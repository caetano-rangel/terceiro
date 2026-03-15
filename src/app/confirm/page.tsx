'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

const ConfirmPage = () => {
  const [status, setStatus] = useState('pendente');
  const [dots, setDots]     = useState('');
  const searchParams = useSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const router = useRouter() as any;
  const slug = searchParams.get('slug');

  /* ── Animação dos pontinhos ── */
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(id);
  }, []);

  /* ── Polling do status no Supabase ── */
  useEffect(() => {
    if (!slug) return;

    const checkStatus = async () => {
      const { data, error } = await supabase
        .from('turmas')
        .select('status')
        .eq('slug', slug)
        .single();

      if (error) { console.error('Erro:', error); return; }
      if (data) {
        setStatus(data.status);
        if (data.status === 'aprovado') router.push(`/${slug}`);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [slug, router]);

  const aprovado = status === 'aprovado';

  return (
    <div style={{
      fontFamily: "'Nunito',sans-serif",
      minHeight: '100vh',
      background: 'linear-gradient(155deg,#f0fdf4 0%,#dcfce7 50%,#f0fdfa 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Nunito:wght@300;400;600;700&display=swap');
        .pf { font-family: 'Playfair Display', Georgia, serif !important; }
        @keyframes spin       { to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(1.6);opacity:0} }
        @keyframes float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>

      {/* Blobs */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, background: 'radial-gradient(circle,rgba(134,239,172,.25),transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, background: 'radial-gradient(circle,rgba(45,212,191,.18),transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Card */}
      <div style={{
        background: 'white', borderRadius: 28, padding: '52px 40px',
        border: '1.5px solid #dcfce7',
        boxShadow: '0 8px 48px rgba(34,197,94,.12)',
        maxWidth: 460, width: '100%', textAlign: 'center',
      }}>

        {/* Spinner */}
        <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 32px' }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'linear-gradient(135deg,rgba(220,252,231,.6),rgba(204,251,241,.6))',
            animation: 'pulse-ring 1.5s ease-out infinite',
          }} />
          <div style={{
            position: 'relative', width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg style={{ width: 36, height: 36, animation: 'spin 1.5s linear infinite' }} viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" stroke="#dcfce7" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#22c55e" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Emoji flutuante */}
        <div style={{ fontSize: 48, marginBottom: 16, animation: 'float 2.5s ease-in-out infinite' }}>
          🎓
        </div>

        <h1 className="pf" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#052e16', marginBottom: 12 }}>
          Confirmando pagamento
        </h1>

        <p style={{ color: '#4d7c5f', fontSize: '.97rem', lineHeight: 1.6, marginBottom: 28 }}>
          Estamos preparando a página da sua turma{dots}
        </p>

        {/* Badge de status */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 20px', borderRadius: 50, marginBottom: 28,
          background: aprovado
            ? 'linear-gradient(135deg,#d1fae5,#a7f3d0)'
            : 'linear-gradient(135deg,#dcfce7,#ccfbf1)',
          border: `1px solid ${aprovado ? '#6ee7b7' : '#86efac'}`,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: aprovado ? '#10b981' : '#22c55e',
            boxShadow: `0 0 6px ${aprovado ? '#10b981' : '#22c55e'}`,
          }} />
          <span style={{ fontSize: '.82rem', fontWeight: 700, color: aprovado ? '#065f46' : '#15803d' }}>
            {aprovado ? 'Aprovado! Redirecionando...' : 'Aguardando confirmação'}
          </span>
        </div>

        <p style={{ color: '#4d7c5f', fontSize: '.78rem' }}>
          Você receberá um e-mail com o link da página 🎓
        </p>
      </div>

      {/* Logo rodapé */}
      <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 8, opacity: 0.7 }}>
        <span style={{ fontSize: 20 }}>🎓</span>
        <span className="pf" style={{
          fontSize: '1rem', fontWeight: 700,
          background: 'linear-gradient(90deg,#15803d,#2dd4bf)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Terceirão.app</span>
      </div>
    </div>
  );
};

export default function ConfirmPageWithSuspense() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
        <p style={{ color: '#15803d', fontFamily: 'Nunito,sans-serif' }}>Carregando...</p>
      </div>
    }>
      <ConfirmPage />
    </Suspense>
  );
}