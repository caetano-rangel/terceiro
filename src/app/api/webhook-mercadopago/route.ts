export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel Hobby suporta até 60s em funções de API

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabaseClient';
import { getPaymentStatus } from '../../lib/mercadopago';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Calcula data de expiração pelo plano ───────────────────────────────────
function calcularExpiracao(plano: string): string {
  const anos = plano === 'premium' ? 3 : 1;
  const data = new Date();
  data.setFullYear(data.getFullYear() + anos);
  return data.toISOString();
}

// ── E-mail de confirmação ──────────────────────────────────────────────────
async function sendEmail(email: string, slug: string, nomeTurma: string, plano: string) {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/${slug}`;
  const isPremium = plano === 'premium';

  try {
    await resend.emails.send({
      from: 'TerceirON <contato@terceiron.com>',
      replyTo: 'contato@terceiron.com',
      to: email,
      subject: `A página da ${nomeTurma} está no ar! 🎓`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
          <div style="background: #f0fdf4; padding: 40px; text-align: center;">
            <h1 style="color: #15803d; margin: 0;">TerceirON</h1>
            <p style="color: #166534;">Sua formatura eternizada.</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="margin-top: 0;">Página liberada! 🎉</h2>
            <p>A página da <strong>${nomeTurma}</strong> já está disponível para todos.</p>
            <p>Plano: <strong>${isPremium ? 'Premium (3 anos)' : 'Básico (1 ano)'}</strong></p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Acessar Página da Turma</a>
            </div>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err);
  }
}

// ── Handler Principal ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  console.log("--- RECEBENDO NOTIFICAÇÃO MERCADO PAGO ---");

  try {
    const bodyText = await req.text();
    if (!bodyText) return NextResponse.json({ ok: true });

    const event = JSON.parse(bodyText);

    // 1. Filtrar: Só nos interessam eventos de pagamento
    if (event.type !== 'payment') {
      return NextResponse.json({ ok: true });
    }

    // 2. Obter o ID do pagamento
    const dataId = event.data?.id || event.id;

    // Ignorar IDs de teste do painel do MP
    if (!dataId || dataId === "123456") {
      console.log("⚠️ ID de teste ignorado.");
      return NextResponse.json({ ok: true });
    }

    console.log(`🔍 Consultando pagamento ID: ${dataId}`);

    // 3. Consultar status oficial na API do Mercado Pago
    let payment;
    try {
      payment = await getPaymentStatus(dataId);
    } catch (apiErr: any) {
      if (apiErr.message.includes('404')) {
        console.warn(`[MP] Pagamento ${dataId} não encontrado (404).`);
        return NextResponse.json({ ok: true });
      }
      throw apiErr;
    }

    // 4. Verificar se foi aprovado
    if (payment.status !== 'approved') {
      console.log(`[MP] Pagamento ${dataId} status: ${payment.status}. Ignorando...`);
      return NextResponse.json({ ok: true });
    }

    const slug = payment.externalReference;
    if (!slug) {
      console.error("❌ Pagamento sem external_reference (slug)");
      return NextResponse.json({ ok: true });
    }

    // 5. Buscar Turma no Supabase
    const { data: turma, error: fetchError } = await supabase
      .from('turmas')
      .select('*')
      .eq('slug', slug)
      .single();

    if (fetchError || !turma) {
      console.error(`❌ Turma não encontrada para o slug: ${slug}`);
      return NextResponse.json({ ok: true });
    }

    // 6. Evitar duplicidade
    if (turma.status === 'aprovado') {
      console.log(`ℹ️ Turma ${slug} já estava aprovada.`);
      return NextResponse.json({ ok: true });
    }

    // 7. Atualizar Status e Data de Expiração
    const expiresAt = calcularExpiracao(turma.plano);
    const { error: updateError } = await supabase
      .from('turmas')
      .update({ status: 'aprovado', expiresAt })
      .eq('slug', slug);

    if (updateError) {
      console.error("❌ Erro ao atualizar Supabase:", updateError);
      throw updateError;
    }

    // 8. Enviar E-mail de Confirmação
    await sendEmail(turma.email, slug, turma.nomeTurma, turma.plano);

    console.log(`✅ SUCESSO: Turma ${slug} aprovada e e-mail enviado.`);
    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error("❌ ERRO NO WEBHOOK:", error.message);
    return NextResponse.json({ error: 'Erro processado' }, { status: 200 });
  }
}