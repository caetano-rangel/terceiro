export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import stripe from '../../lib/stripe';
import { createPreference } from '../../lib/mercadopago';
import { supabase } from '../../lib/supabaseClient';
import { nanoid } from 'nanoid';

// Preços em reais (Mercado Pago usa float, não centavos)
// Para testar em produção, defina NEXT_PUBLIC_TEST_MODE=true no .env.local
const IS_TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === 'true';

const PRECOS = {
  basico:  IS_TEST_MODE ? 0.05 : 39.00,
  premium: IS_TEST_MODE ? 0.05 : 79.00,
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // ── Campos básicos ──
    const plano           = formData.get('plano')          as string;
    const nomeTurma       = formData.get('nomeTurma')      as string;
    const escola          = formData.get('escola')         as string;
    const cidade          = formData.get('cidade')         as string ?? '';
    const dataFormatura   = formData.get('dataFormatura')  as string;
    const email           = formData.get('email')          as string;
    const mural           = formData.get('mural')          as string ?? '';
    const fotos           = formData.getAll('fotos')       as File[];

    // ── Método de pagamento: 'card' (Stripe) ou 'pix' (Mercado Pago) ──
    const metodoPagamento = (formData.get('metodoPagamento') as string) ?? 'card';

    // ── Campos extras ──
    const professorNome     = formData.get('professorNome')    as string ?? '';
    const professorMateria  = formData.get('professorMateria') as string ?? '';
    const instagram         = formData.get('instagram')        as string ?? '';

    // ── Campos JSON ──
    const alunosRaw       = formData.get('alunos')       as string;
    const curiosidadesRaw = formData.get('curiosidades') as string | null;

    // ── Campos premium ──
    const capsulaData     = formData.get('capsulaData')     as string ?? '';
    const capsulaMensagem = formData.get('capsulaMensagem') as string ?? '';
    const tema            = formData.get('tema')            as string ?? 'verde';

    // ── Validação ──
    if (!nomeTurma || !escola || !dataFormatura || !email || !plano) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }
    if (!['basico', 'premium'].includes(plano)) {
      return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 });
    }
    if (!['card', 'pix'].includes(metodoPagamento)) {
      return NextResponse.json({ error: 'Método de pagamento inválido.' }, { status: 400 });
    }

    // ── Parse alunos ──
    let alunos = [];
    try { alunos = JSON.parse(alunosRaw || '[]'); }
    catch { return NextResponse.json({ error: 'Formato inválido para alunos.' }, { status: 400 }); }

    // ── Parse curiosidades ──
    let curiosidades = null;
    if (plano === 'premium' && curiosidadesRaw) {
      try { curiosidades = JSON.parse(curiosidadesRaw); } catch { curiosidades = null; }
    }

    // ── Gera slug ──
    const slug = `${nomeTurma.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')}-${nanoid(8)}`;

    // ── Upload das fotos ──
    const fotoUrls: string[] = [];
    for (const foto of fotos) {
      const ext      = foto.type.split('/')[1] || 'jpg';
      const fileName = `${slug}/${nanoid(10)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, foto, { upsert: false });
      if (uploadError) throw new Error('Erro no upload da foto.');
      const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
      if (!publicUrlData.publicUrl) throw new Error('Erro ao obter URL pública da foto.');
      fotoUrls.push(publicUrlData.publicUrl);
    }

    // ── Inserção no Supabase ──
    const { error: insertError } = await supabase.from('turmas').insert([{
      slug, plano, nomeTurma, escola, cidade, dataFormatura, email, mural, alunos,
      fotos: fotoUrls, professorNome, professorMateria, instagram,
      curiosidades:    plano === 'premium' ? curiosidades    : null,
      capsulaData:     plano === 'premium' ? capsulaData     : null,
      capsulaMensagem: plano === 'premium' ? capsulaMensagem : null,
      tema:            plano === 'premium' ? tema            : 'verde',
      status: 'pendente', metodoPagamento,
      createdAt: new Date().toISOString(),
    }]);

    if (insertError) {
      console.error('Erro ao salvar no Supabase:', insertError.message);
      return NextResponse.json({ error: 'Erro ao salvar os dados.' }, { status: 500 });
    }

    // ── CARTÃO → Stripe (sem alteração) ────────────────────────────────────
    if (metodoPagamento === 'card') {
      const priceId = plano === 'basico' ? process.env.STRIPE_PRICE_ID : process.env.STRIPE_PRICE_ID_2;
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        metadata: { slug, email },
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/confirm?slug=${slug}`,
        cancel_url:  `${process.env.NEXT_PUBLIC_BASE_URL}/`,
      });
      return NextResponse.json({ url: session.url });
    }

    // ── PIX → Mercado Pago Checkout Pro ───────────────────────────────────
    if (metodoPagamento === 'pix') {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';
      const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
      const isSandbox = (process.env.MERCADOPAGO_ACCESS_TOKEN ?? '').startsWith('TEST-');

      const preference = await createPreference({
        transactionAmount: PRECOS[plano as 'basico' | 'premium'],
        description:       `TerceirON — Plano ${plano} (${nomeTurma})`,
        payer:             { email },
        externalReference: slug,
        successUrl:        `${baseUrl}/confirm?slug=${slug}`,
        cancelUrl:         `${baseUrl}/`,
        notificationUrl:   isLocal ? undefined : `${baseUrl}/api/webhook-mercadopago`,
      });

      // Em sandbox usa sandbox_init_point, em produção usa init_point
      const redirectUrl = isSandbox ? preference.sandboxInitPoint : preference.initPoint;

      return NextResponse.json({ url: redirectUrl });
    }

  } catch (error) {
    console.error('Erro ao criar checkout:', error);
    return NextResponse.json({ error: 'Erro ao criar checkout.' }, { status: 500 });
  }
}