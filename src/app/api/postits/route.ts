export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabaseClient';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug) return NextResponse.json({ error: 'Slug ausente.' }, { status: 400 });

  const { data, error } = await supabase
    .from('postits')
    .select('id, nome, mensagem, cor, created_at')
    .eq('slug', slug)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Erro ao buscar post-its.' }, { status: 500 });

  return NextResponse.json({ postits: data || [] });
}

export async function POST(req: NextRequest) {
  try {
    const { slug, nome, mensagem, cor } = await req.json();

    if (!slug || !mensagem?.trim()) {
      return NextResponse.json({ error: 'Mensagem obrigatória.' }, { status: 400 });
    }

    if (mensagem.trim().length > 200) {
      return NextResponse.json({ error: 'Mensagem muito longa. Máximo 200 caracteres.' }, { status: 400 });
    }

    const coresValidas = ['amarelo', 'rosa', 'verde', 'azul', 'roxo', 'laranja'];
    const corFinal = coresValidas.includes(cor) ? cor : 'amarelo';

    const { data, error } = await supabase
      .from('postits')
      .insert([{ slug, nome: nome?.trim() || 'Anônimo', mensagem: mensagem.trim(), cor: corFinal }])
      .select('id, nome, mensagem, cor, created_at')
      .single();

    if (error) return NextResponse.json({ error: 'Erro ao salvar post-it.' }, { status: 500 });

    return NextResponse.json({ ok: true, postit: data });

  } catch (error) {
    console.error('Erro no post-it:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id    = searchParams.get('id');
    const slug  = searchParams.get('slug');
    const email = searchParams.get('email');

    if (!id || !slug || !email) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    // Verifica email do rep.
    const { data: turma } = await supabase
      .from('turmas')
      .select('email')
      .eq('slug', slug)
      .single();

    if (!turma || turma.email.toLowerCase().trim() !== email.toLowerCase().trim()) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { error } = await supabase
      .from('postits')
      .delete()
      .eq('id', id)
      .eq('slug', slug);

    if (error) return NextResponse.json({ error: 'Erro ao remover post-it.' }, { status: 500 });

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Erro ao deletar post-it:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}