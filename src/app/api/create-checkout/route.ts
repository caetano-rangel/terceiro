export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import stripe from '../../lib/stripe';
import { supabase } from '../../lib/supabaseClient';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // ── Campos básicos ──
    const plano        = formData.get('plano')        as string;
    const nomeTurma    = formData.get('nomeTurma')    as string;
    const escola       = formData.get('escola')       as string;
    const cidade       = formData.get('cidade')       as string ?? '';
    const dataFormatura = formData.get('dataFormatura') as string;
    const email        = formData.get('email')        as string;
    const mural        = formData.get('mural')        as string ?? '';
    const fotos        = formData.getAll('fotos')     as File[];

    // ── Campos JSON ──
    const alunosRaw      = formData.get('alunos')      as string;
    const curiosidadesRaw = formData.get('curiosidades') as string | null;
    const musicaUrl      = formData.get('musicaUrl')   as string ?? '';

    // ── Validação ──
    if (!nomeTurma || !escola || !dataFormatura || !email || !plano) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    // ── Parse JSON ──
    let alunos = [];
    try {
      alunos = JSON.parse(alunosRaw || '[]');
    } catch {
      return NextResponse.json({ error: 'Formato inválido para alunos.' }, { status: 400 });
    }

    let curiosidades = null;
    if (plano === 'premium' && curiosidadesRaw) {
      try {
        curiosidades = JSON.parse(curiosidadesRaw);
      } catch {
        curiosidades = null;
      }
    }

    // ── Gera slug a partir do nome da turma ──
    const slug = `${nomeTurma.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')}-${nanoid(8)}`;

    // ── Upload das fotos para o Supabase Storage ──
    const fotoUrls: string[] = [];
    for (const foto of fotos) {
      const ext = foto.type.split('/')[1] || 'jpg';
      const fileName = `${slug}/${nanoid(10)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, foto, { upsert: false });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw new Error('Erro no upload da foto.');
      }

      const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      if (publicUrlData.publicUrl) {
        fotoUrls.push(publicUrlData.publicUrl);
      } else {
        throw new Error('Erro ao obter URL pública da foto.');
      }
    }

    // ── Inserção no Supabase ──
    const { error: insertError } = await supabase.from('turmas').insert([{
      slug,
      plano,
      nomeTurma,
      escola,
      cidade,
      dataFormatura,
      email,
      mural,
      alunos,
      fotos: fotoUrls,
      curiosidades: plano === 'premium' ? curiosidades : null,
      musicaUrl:    plano === 'premium' ? musicaUrl    : null,
      status:    'pendente',
      createdAt: new Date().toISOString(),
    }]);

    if (insertError) {
      console.error('Erro ao salvar no Supabase:', insertError.message);
      return NextResponse.json({ error: 'Erro ao salvar os dados.' }, { status: 500 });
    }

    // ── Cria sessão Stripe ──
    const priceId = plano === 'basico'
      ? process.env.STRIPE_PRICE_ID    // R$39
      : process.env.STRIPE_PRICE_ID_2; // R$79

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      metadata: { slug, email },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/confirm?slug=${slug}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_BASE_URL}/`,
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    return NextResponse.json({ error: 'Erro ao criar sessão de checkout.' }, { status: 500 });
  }
}