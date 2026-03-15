import { supabase } from './supabaseClient';

const deleteTurmasExpiradas = async () => {
  console.log('[CRON] Iniciando verificação de turmas expiradas.');

  try {
    const now = new Date().toISOString();

    // Busca turmas aprovadas cuja data de expiração já passou
    const { data: turmas, error: fetchError } = await supabase
      .from('turmas')
      .select('id, slug, fotos')
      .eq('status', 'aprovado')
      .lt('expiresAt', now);

    if (fetchError) {
      console.error('[CRON] Erro ao buscar turmas:', fetchError.message);
      return { success: false, error: fetchError.message };
    }

    if (!turmas || turmas.length === 0) {
      console.log('[CRON] Nenhuma turma expirada encontrada.');
      return { success: true, message: 'Nenhuma turma expirada.' };
    }

    console.log(`[CRON] ${turmas.length} turma(s) expirada(s). Iniciando deleção...`);

    // Deleta fotos do Storage para cada turma
    for (const turma of turmas) {
      const { fotos, slug } = turma;

      if (fotos && Array.isArray(fotos) && fotos.length > 0) {
        const filePaths = fotos
          .map((url: string) => url.split('/storage/v1/object/public/uploads/')[1])
          .filter(Boolean);

        if (filePaths.length > 0) {
          const { error: deleteFilesError } = await supabase.storage
            .from('uploads')
            .remove(filePaths);

          if (deleteFilesError) {
            console.error(`[CRON] Erro ao deletar fotos da turma ${slug}:`, deleteFilesError.message);
          } else {
            console.log(`[CRON] ${filePaths.length} foto(s) deletada(s) da turma ${slug}.`);
          }
        }
      }
    }

    // Deleta os registros das turmas expiradas
    const ids = turmas.map((t: { id: number }) => t.id);
    const { error: deleteError } = await supabase
      .from('turmas')
      .delete()
      .in('id', ids);

    if (deleteError) {
      console.error('[CRON] Erro ao deletar turmas:', deleteError.message);
      return { success: false, error: deleteError.message };
    }

    console.log(`[CRON] ${turmas.length} turma(s) deletada(s) com sucesso.`);
    return { success: true, message: `${turmas.length} turma(s) expirada(s) deletada(s).` };

  } catch (error) {
    console.error('[CRON] Erro inesperado:', error);
    return { success: false, error: 'Erro inesperado ao processar a deleção.' };
  }
};

export default deleteTurmasExpiradas;