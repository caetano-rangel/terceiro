export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabaseClient';
import stripe from '../../lib/stripe';
// import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY);
const secret = process.env.STRIPE_WEBHOOK_SECRET;

/* ── Calcula data de expiração pelo plano ── */
function calcularExpiracao(plano: string): string {
  const anos = plano === 'premium' ? 3 : 1;
  const data = new Date();
  data.setFullYear(data.getFullYear() + anos);
  return data.toISOString();
}

/* ── Email de confirmação ── */
// const sendEmail = async (email: string, slug: string, nomeTurma: string, plano: string) => {
//   const url = `${process.env.NEXT_PUBLIC_BASE_URL}/${slug}`;
//   const isPremium = plano === 'premium';
//
//   await resend.emails.send({
//     from: 'Terceirão.app <contato@terceirao.app>',
//     replyTo: 'contato@terceirao.app',
//     to: email,
//     subject: `A página da ${nomeTurma} está no ar! 🎓`,
//     html: `
//       <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
//
//         <!-- Header -->
//         <div style="background: linear-gradient(135deg, #dcfce7, #ccfbf1); padding: 40px 32px; text-align: center;">
//           <div style="font-size: 48px; margin-bottom: 12px;">🎓</div>
//           <h1 style="font-size: 24px; color: #052e16; margin: 0; font-weight: 700;">Terceirão.app</h1>
//           <p style="color: #4d7c5f; margin: 8px 0 0; font-size: 14px;">A página da sua turma — para sempre.</p>
//         </div>
//
//         <!-- Corpo -->
//         <div style="padding: 36px 32px;">
//           <h2 style="color: #052e16; font-size: 20px; margin: 0 0 12px;">Página no ar! 🎉</h2>
//           <p style="color: #4d7c5f; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">
//             A página da <strong>${nomeTurma}</strong> está pronta e já pode ser compartilhada com a galera!
//           </p>
//           <p style="color: #4d7c5f; font-size: 14px; line-height: 1.7; margin: 0 0 24px;">
//             Plano <strong>${isPremium ? 'Premium — 3 anos online ⭐' : 'Básico — 1 ano online'}</strong>
//           </p>
//
//           <!-- CTA -->
//           <div style="text-align: center; margin: 32px 0;">
//             <a href="${url}"
//               style="display: inline-block; background: linear-gradient(135deg, #86efac, #22c55e, #15803d); color: white; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-size: 15px; font-weight: 700;">
//               Ver a página da turma 🎓
//             </a>
//           </div>
//
//           <!-- Link direto -->
//           <p style="color: #6b7c6e; font-size: 13px; line-height: 1.6; margin: 0 0 24px;">
//             Ou copie e cole este link no navegador:<br/>
//             <a href="${url}" style="color: #15803d; word-break: break-all;">${url}</a>
//           </p>
//
//           <!-- Dica QR -->
//           <div style="background: #f0fdf4; border-radius: 12px; padding: 16px 20px; border: 1px solid #dcfce7;">
//             <p style="color: #15803d; font-size: 13px; font-weight: 700; margin: 0 0 4px;">💡 Dica</p>
//             <p style="color: #4d7c5f; font-size: 13px; line-height: 1.6; margin: 0;">
//               Na sua página tem um QR Code exclusivo — baixa e cola no cartaz da formatura para todo mundo acessar na hora!
//             </p>
//           </div>
//         </div>
//
//         <!-- Footer -->
//         <div style="background: #052e16; padding: 24px 32px; text-align: center;">
//           <p style="color: #4d7c5f; font-size: 12px; margin: 0;">
//             © 2025 Terceirão.app · Todos os direitos reservados<br/>
//             Dúvidas? <a href="mailto:contato@terceirao.app" style="color: #86efac;">contato@terceirao.app</a>
//           </p>
//         </div>
//
//       </div>
//     `,
//   });
// };

/* ── Handler ── */
export async function POST(req: Request) {
  try {
    const body      = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!secret || !signature) {
      throw new Error('Missing secret or signature');
    }

    const event = stripe.webhooks.constructEvent(body, signature, secret);

    switch (event.type) {

      /* ── Pagamento aprovado ── */
      case 'checkout.session.completed': {
        if (event.data.object.payment_status === 'paid') {
          const slug  = event.data.object.metadata?.slug;
          const email = event.data.object.metadata?.email;

          if (slug && email) {
            // Busca plano e nome da turma para expiração
            const { data: turma } = await supabase
              .from('turmas')
              .select('plano, "nomeTurma"')
              .eq('slug', slug)
              .single();

            const plano     = turma?.plano     ?? 'basico';
            // const nomeTurma = turma?.nomeTurma ?? 'Sua turma';
            const expiresAt = calcularExpiracao(plano);

            const { error } = await supabase
              .from('turmas')
              .update({ status: 'aprovado', expiresAt })
              .eq('slug', slug);

            if (error) {
              console.error('Erro ao atualizar status:', error);
              return NextResponse.json({ error: 'Erro ao atualizar status.' }, { status: 500 });
            }

            // await sendEmail(email, slug, nomeTurma, plano);
            console.log(`[WEBHOOK] Turma ${slug} aprovada. Email pendente de configuração.`);
          }
        }
        break;
      }

      /* ── Sessão expirou sem pagamento ── */
      case 'checkout.session.expired': {
        const expiredSlug = event.data.object.metadata?.slug;
        if (expiredSlug) {
          const { error } = await supabase
            .from('turmas')
            .update({ status: 'expirado' })
            .eq('slug', expiredSlug);

          if (error) {
            console.error('Erro ao atualizar status expirado:', error);
            return NextResponse.json({ error: 'Erro ao atualizar status.' }, { status: 500 });
          }
        }
        break;
      }

      default:
        console.log(`Evento ignorado: ${event.type}`);
    }

    return NextResponse.json({ result: event, ok: true });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return NextResponse.json({ message: 'Webhook error', ok: false }, { status: 500 });
  }
}