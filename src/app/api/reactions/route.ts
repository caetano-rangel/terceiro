export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabaseClient';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug      = searchParams.get('slug');
  const visitorId = searchParams.get('visitorId');

  if (!slug) return NextResponse.json({ error: 'Slug ausente.' }, { status: 400 });

  const { data, error } = await supabase
    .from('reacoes')
    .select('aluno_index, emoji, visitor_id')
    .eq('slug', slug);

  if (error) return NextResponse.json({ error: 'Erro ao buscar reações.' }, { status: 500 });

  // Agrupa contagem
  const agrupado: Record<number, Record<string, number>> = {};
  const minhas: Record<number, string> = {};

  for (const r of data || []) {
    if (!agrupado[r.aluno_index]) agrupado[r.aluno_index] = {};
    agrupado[r.aluno_index][r.emoji] = (agrupado[r.aluno_index][r.emoji] || 0) + 1;
    if (visitorId && r.visitor_id === visitorId) {
      minhas[r.aluno_index] = r.emoji;
    }
  }

  return NextResponse.json({ reacoes: agrupado, minhas });
}

export async function POST(req: NextRequest) {
  try {
    const { slug, alunoIndex, emoji, visitorId } = await req.json();

    if (!slug || alunoIndex === undefined || !emoji || !visitorId) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const emojisValidos = ['❤️', '🔥', '😂', '👑'];
    if (!emojisValidos.includes(emoji)) {
      return NextResponse.json({ error: 'Emoji inválido.' }, { status: 400 });
    }

    // Verifica se já reagiu a este aluno
    const { data: existing } = await supabase
      .from('reacoes')
      .select('id, emoji')
      .eq('slug', slug)
      .eq('aluno_index', alunoIndex)
      .eq('visitor_id', visitorId)
      .single();

    if (existing) {
      if (existing.emoji === emoji) {
        // Clicou no mesmo — remove (toggle)
        await supabase.from('reacoes').delete().eq('id', existing.id);
        return NextResponse.json({ ok: true, action: 'removed' });
      } else {
        // Troca de emoji
        await supabase.from('reacoes').update({ emoji }).eq('id', existing.id);
        return NextResponse.json({ ok: true, action: 'updated' });
      }
    }

    // Insere nova reação
    await supabase.from('reacoes').insert([{ slug, aluno_index: alunoIndex, emoji, visitor_id: visitorId }]);
    return NextResponse.json({ ok: true, action: 'added' });

  } catch (error) {
    console.error('Erro nas reações:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}