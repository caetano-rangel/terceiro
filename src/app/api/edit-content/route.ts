export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, email, action, data } = body;

    if (!slug || !email || !action) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    // ── Verifica email ──
    const { data: turma, error: fetchError } = await supabase
      .from('turmas')
      .select('email, plano, status')
      .eq('slug', slug)
      .single();

    if (fetchError || !turma) {
      return NextResponse.json({ error: 'Página não encontrada.' }, { status: 404 });
    }

    if (turma.status !== 'aprovado') {
      return NextResponse.json({ error: 'Página não está ativa.' }, { status: 403 });
    }

    if (turma.email.toLowerCase().trim() !== email.toLowerCase().trim()) {
      return NextResponse.json({ error: 'Email incorreto.' }, { status: 401 });
    }

    // ── Ações ──
    if (action === 'save_mural') {
      const { error } = await supabase
        .from('turmas')
        .update({ mural: data.mural })
        .eq('slug', slug);

      if (error) return NextResponse.json({ error: 'Erro ao salvar mural.' }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === 'save_alunos') {
      const alunos = data.alunos?.filter((a: { nome: string }) => a.nome?.trim());
      if (!alunos?.length) {
        return NextResponse.json({ error: 'Adicione pelo menos 1 aluno.' }, { status: 400 });
      }
      const { error } = await supabase
        .from('turmas')
        .update({ alunos })
        .eq('slug', slug);

      if (error) return NextResponse.json({ error: 'Erro ao salvar alunos.' }, { status: 500 });
      return NextResponse.json({ ok: true, alunos });
    }

    if (action === 'save_curiosidades') {
      if (turma.plano !== 'premium') {
        return NextResponse.json({ error: 'Apenas plano premium.' }, { status: 403 });
      }
      const { error } = await supabase
        .from('turmas')
        .update({ curiosidades: data.curiosidades })
        .eq('slug', slug);

      if (error) return NextResponse.json({ error: 'Erro ao salvar curiosidades.' }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });

  } catch (error) {
    console.error('Erro na edição de conteúdo:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}