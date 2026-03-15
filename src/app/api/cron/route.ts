export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import deleteTurmasExpiradas from '../../lib/cron';

export async function GET(req: NextRequest) {
  // Proteção básica com secret para evitar chamadas não autorizadas
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const result = await deleteTurmasExpiradas();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro no cron:', error);
    return NextResponse.json({ message: 'Erro ao executar cron job.' }, { status: 500 });
  }
}