export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabaseClient';
import { getPaymentStatus } from '../../lib/mercadopago';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Valida assinatura do webhook Mercado Pago ──────────────────────────────
// Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
// O MP envia o header "x-signature" no formato: "ts=<timestamp>,v1=<hash>"
// O hash é HMAC-SHA256 de "id:<dataId>;request-id:<xRequestId>;ts:<ts>;"
function verificarAssinatura(req: NextRequest, dataId: string): boolean {
  const secret    = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? '';
  const xSig      = req.headers.get('x-signature') ?? '';
  const xReqId    = req.headers.get('x-request-id') ?? '';

  // Extrai ts e v1 do header
  const parts = Object.fromEntries(xSig.split(',').map(p => p.split('=')));
  const ts = parts['ts'];
  const v1 = parts['v1'];

  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xReqId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ── Calcula data de expiração pelo plano ───────────────────────────────────
function calcularExpiracao(plano: string): string {
  const anos = plano === 'premium' ? 3 : 1;
  const data = new Date();
  data.setFullYear(data.getFullYear() + anos);
  return data.toISOString();
}

// ── E-mail de confirmação (igual ao do Stripe) ─────────────────────────────
async function sendEmail(email: string, slug: string, nomeTurma: string, plano: string) {
  const url       = `${process.env.NEXT_PUBLIC_BASE_URL}/${slug}`;
  const isPremium = plano === 'premium';

  await resend.emails.send({
    from:    'TerceirON <contato@terceiron.com>',
    replyTo: 'contato@terceiron.com',
    to:      email,
    subject: `A página da ${nomeTurma} está no ar! 🎓`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #dcfce7, #ccfbf1); padding: 40px 32px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 12px;">🎓</div>
          <h1 style="font-size: 24px; color: #000000; margin: 0; font-weight: 700;">TerceirON</h1>
          <p style="color: #1a5c34; margin: 8px 0 0; font-size: 14px;">A página da sua turma — para sempre.</p>
        </div>
        <div style="padding: 36px 32px;">
          <h2 style="color: #052e16; font-size: 20px; margin: 0 0 12px;">Página no ar! 🎉</h2>
          <p style="color: #4d7c5f; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">
            A página da <strong>${nomeTurma}</strong> está pronta e já pode ser compartilhada com a galera!
          </p>
          <p style="color: #4d7c5f; font-size: 14px; line-height: 1.7; margin: 0 0 24px;">
            Plano <strong>${isPremium ? 'Premium — 3 anos online ⭐' : 'Básico — 1 ano online'}</strong>
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #86efac, #22c55e, #15803d); color: white; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-size: 15px; font-weight: 700;">
              Ver a página da turma 🎓
            </a>
          </div>
          <p style="color: #6b7c6e; font-size: 13px; line-height: 1.6; margin: 0 0 24px;">
            Ou copie e cole este link no navegador:<br/>
            <a href="${url}" style="color: #15803d; word-break: break-all;">${url}</a>
          </p>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 16px 20px; border: 1px solid #dcfce7;">
            <p style="color: #15803d; font-size: 13px; font-weight: 700; margin: 0 0 4px;">💡 Dica</p>
            <p style="color: #4d7c5f; font-size: 13px; line-height: 1.6; margin: 0;">
              Na sua página tem um QR Code exclusivo — baixa e cola no cartaz da formatura para todo mundo acessar na hora!
            </p>
          </div>
        </div>
        <div style="background: #052e16; padding: 24px 32px; text-align: center;">
          <p style="color: #4d7c5f; font-size: 12px; margin: 0;">
            © 2025 TerceirON · Todos os direitos reservados<br/>
            Dúvidas? <a href="mailto:contato@terceiron.com" style="color: #86efac;">contato@terceiron.com</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── Handler ────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body  = await req.text();
    const event = JSON.parse(body);

    // O MP envia notificações de vários tipos — só nos interessa "payment"
    if (event.type !== 'payment') {
      return NextResponse.json({ ok: true });
    }

    const dataId = String(event.data?.id ?? '');

    // Valida assinatura
    if (!verificarAssinatura(req, dataId)) {
      console.warn('Mercado Pago webhook: assinatura inválida');
      return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
    }

    // Consulta o pagamento na API do MP para obter status e external_reference
    // (nunca confiar só no payload do webhook para aprovar pagamentos)
    const payment = await getPaymentStatus(Number(dataId));

    if (payment.status !== 'approved') {
      // Pagamento ainda pendente ou falhou — ignora por agora
      console.log(`MP webhook: pagamento ${dataId} status=${payment.status}`);
      return NextResponse.json({ ok: true });
    }

    const slug = payment.externalReference;
    if (!slug) {
      console.error('MP webhook: external_reference vazio', payment);
      return NextResponse.json({ error: 'Referência não encontrada.' }, { status: 400 });
    }

    // Busca dados da turma
    const { data: turma } = await supabase
      .from('turmas')
      .select('plano, "nomeTurma", email, status')
      .eq('slug', slug)
      .single();

    // Evita processar duas vezes (o MP pode reenviar o webhook)
    if (turma?.status === 'aprovado') {
      return NextResponse.json({ ok: true });
    }

    const plano     = turma?.plano     ?? 'basico';
    const nomeTurma = turma?.nomeTurma ?? 'Sua turma';
    const email     = turma?.email     ?? '';
    const expiresAt = calcularExpiracao(plano);

    const { error: updateError } = await supabase
      .from('turmas')
      .update({ status: 'aprovado', expiresAt })
      .eq('slug', slug);

    if (updateError) {
      console.error('Erro ao atualizar status PIX:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar status.' }, { status: 500 });
    }

    await sendEmail(email, slug, nomeTurma, plano);
    console.log(`PIX aprovado via MP — slug: ${slug}, paymentId: ${dataId}`);

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Erro no webhook Mercado Pago:', error);
    return NextResponse.json({ message: 'Webhook error', ok: false }, { status: 500 });
  }
}