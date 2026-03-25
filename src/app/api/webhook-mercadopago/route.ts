export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Limite máximo de execução na Vercel

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabaseClient';
import { getPaymentStatus } from '../../lib/mercadopago';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Funções Auxiliares ─────────────────────────────────────────────────────

function calcularExpiracao(plano: string): string {
  const anos = plano === 'premium' ? 3 : 1;
  const data = new Date();
  data.setFullYear(data.getFullYear() + anos);
  return data.toISOString();
}

async function sendEmail(email: string, slug: string, nomeTurma: string, plano: string) {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/${slug}`;
  const isPremium = plano === 'premium';

  return resend.emails.send({
    from: 'TerceirON <contato@terceiron.com>',
    replyTo: 'contato@terceiron.com',
    to: email,
    subject: `A página da ${nomeTurma} está no ar! 🎓`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
        <div style="background: #f0fdf4; padding: 40px; text-align: center;">
          <h1 style="color: #15803d; margin: 0;">TerceirON</h1>
        </div>
        <div style="padding: 30px;">
          <h2>Página liberada! 🎉</h2>
          <p>A página da <strong>${nomeTurma}</strong> já está disponível.</p>
          <p>Plano: <strong>${isPremium ? 'Premium (3 anos)' : 'Básico (1 ano)'}</strong></p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Acessar Página</a>
          </div>
        </div>
      </div>
    `,
  });
}

// ── Handler Principal (Otimizado) ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  console.log("--- RECEBENDO WEBHOOK MP ---");

  try {
    const bodyText = await req.text();
    if (!bodyText) return NextResponse.json({ ok: true });

    const event = JSON.parse(bodyText);

    // 1. Filtragem de evento
    if (event.type !== 'payment') {
      return NextResponse.json({ ok: true });
    }

    const dataId = event.data?.id || event.id;
    if (!dataId || dataId === "123456") {
      return NextResponse.json({ ok: true });
    }

    // 2. Consulta rápida ao Mercado Pago
    // Precisamos do 'await' aqui para saber se o pagamento é real
    const payment = await getPaymentStatus(dataId);
    
    if (payment.status !== 'approved') {
      console.log(`[MP] ID ${dataId} com status: ${payment.status}`);
      return NextResponse.json({ ok: true });
    }

    const slug = payment.externalReference;
    if (!slug) {
      console.error("❌ Erro: external_reference ausente");
      return NextResponse.json({ ok: true });
    }

    // 3. Busca e atualização no Supabase (Processos rápidos)
    const { data: turma, error: fetchError } = await supabase
      .from('turmas')
      .select('plano, nomeTurma, email, status')
      .eq('slug', slug)
      .single();

    if (fetchError || !turma) {
      console.error(`❌ Turma não encontrada: ${slug}`);
      return NextResponse.json({ ok: true });
    }

    // Se já foi aprovado, encerramos aqui para poupar recursos
    if (turma.status === 'aprovado') {
      return NextResponse.json({ ok: true });
    }

    const expiresAt = calcularExpiracao(turma.plano);
    
    // Atualiza o banco de dados primeiro
    const { error: updateError } = await supabase
      .from('turmas')
      .update({ status: 'aprovado', expiresAt })
      .eq('slug', slug);

    if (updateError) throw updateError;

    // 4. O PONTO CHAVE: Envio de E-mail SEM 'AWAIT'
    // Disparamos o processo e deixamos ele rodando em background na Vercel
    sendEmail(turma.email, slug, turma.nomeTurma, turma.plano)
      .then(() => console.log(`✅ E-mail enviado com sucesso para ${turma.email}`))
      .catch((err) => console.error("❌ Falha no envio de e-mail background:", err));

    console.log(`✅ Sucesso: Turma ${slug} aprovada.`);

    // 5. Respondemos 200 IMEDIATAMENTE para evitar o timeout 502 do Mercado Pago
    return NextResponse.json({ ok: true }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erro crítico no Webhook:", error.message);
    // Retornamos 200 mesmo no erro para que o MP pare de reenviar notificações inúteis
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}