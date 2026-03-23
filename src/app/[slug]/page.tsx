'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import QRCode from 'qrcode';

/* ── Tipos ── */
interface Aluno {
  nome: string;
  apelido: string;
}
interface Curiosidade {
  categoria: string;
  resposta: string;
}
interface TurmaData {
  nomeTurma: string;
  escola: string;
  cidade: string;
  dataFormatura: string;
  mural: string;
  plano: string;
  fotos: string[];
  alunos: Aluno[];
  // básico
  professorNome: string | null;
  professorMateria: string | null;
  instagram: string | null;
  // premium
  curiosidades: Curiosidade[] | null;
  capsulaData: string | null;
  capsulaMensagem: string | null;
  tema: string | null;
}
interface Countdown {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  passou: boolean;
}
interface PageProps { params: Promise<{ slug: string }>; }

/* ── Countdown para a formatura ── */
function calcCountdown(dataFormatura: string): Countdown {
  const target = new Date(dataFormatura + 'T00:00:00');
  const now    = new Date();
  const diff   = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { dias: 0, horas: 0, minutos: 0, segundos: 0, passou: true };
  }

  return {
    dias:     Math.floor(diff / 86400000),
    horas:    Math.floor((diff % 86400000) / 3600000),
    minutos:  Math.floor((diff % 3600000) / 60000),
    segundos: Math.floor((diff % 60000) / 1000),
    passou:   false,
  };
}


/* ── Temas ── */
const TEMAS: Record<string, {
  cor: string; gradient: string; light: string; badge: string; dark: string; heroBg: string;
  cardBg: string; cardBorder: string; cardShadow: string; cardText: string; cardSubText: string;
  badgeBg: string; badgeBorder: string; badgeText: string;
  btnBg: string; btnText: string; metallic: boolean;
}> = {
  verde: {
    cor: '#15803d', gradient: 'linear-gradient(135deg,#86efac,#22c55e,#15803d)',
    light: '#dcfce7', badge: '#15803d', dark: '#052e16',
    heroBg: 'linear-gradient(155deg,#052e16 0%,#064e3b 50%,#0d4d4d 100%)',
    cardBg: 'linear-gradient(160deg,#064e3b 0%,#065f46 40%,#047857 60%,#064e3b 100%)',
    cardBorder: '#6ee7b7', cardShadow: 'rgba(4,120,87,.4)', cardText: '#d1fae5', cardSubText: '#a7f3d0',
    badgeBg: 'rgba(110,231,183,.15)', badgeBorder: '#6ee7b7', badgeText: '#6ee7b7',
    btnBg: 'linear-gradient(135deg,#6ee7b7,#34d399,#059669)', btnText: '#052e16', metallic: true,
  },
  roxo: {
    cor: '#7c3aed', gradient: 'linear-gradient(135deg,#c4b5fd,#8b5cf6,#7c3aed)',
    light: '#ede9fe', badge: '#7c3aed', dark: '#2e1065',
    heroBg: 'linear-gradient(155deg,#2e1065 0%,#4c1d95 50%,#3b0764 100%)',
    cardBg: 'linear-gradient(160deg,#2e1065 0%,#3b0764 40%,#4c1d95 60%,#2e1065 100%)',
    cardBorder: '#a78bfa', cardShadow: 'rgba(109,40,217,.4)', cardText: '#ede9fe', cardSubText: '#c4b5fd',
    badgeBg: 'rgba(167,139,250,.15)', badgeBorder: '#a78bfa', badgeText: '#a78bfa',
    btnBg: 'linear-gradient(135deg,#a78bfa,#7c3aed,#6d28d9)', btnText: '#ffffff', metallic: true,
  },
  rosa: {
    cor: '#db2777', gradient: 'linear-gradient(135deg,#f9a8d4,#ec4899,#db2777)',
    light: '#fce7f3', badge: '#db2777', dark: '#831843',
    heroBg: 'linear-gradient(155deg,#831843 0%,#9d174d 50%,#701a75 100%)',
    cardBg: 'linear-gradient(160deg,#831843 0%,#9d174d 40%,#be185d 60%,#831843 100%)',
    cardBorder: '#f9a8d4', cardShadow: 'rgba(190,24,93,.4)', cardText: '#fce7f3', cardSubText: '#fbcfe8',
    badgeBg: 'rgba(249,168,212,.15)', badgeBorder: '#f9a8d4', badgeText: '#f9a8d4',
    btnBg: 'linear-gradient(135deg,#f9a8d4,#ec4899,#db2777)', btnText: '#4a0023', metallic: true,
  },
  azul: {
    cor: '#1d4ed8', gradient: 'linear-gradient(135deg,#93c5fd,#3b82f6,#1d4ed8)',
    light: '#dbeafe', badge: '#1d4ed8', dark: '#1e3a8a',
    heroBg: 'linear-gradient(155deg,#1e3a8a 0%,#1e40af 50%,#172554 100%)',
    cardBg: 'linear-gradient(160deg,#1e3a8a 0%,#1e40af 40%,#2563eb 60%,#1e3a8a 100%)',
    cardBorder: '#93c5fd', cardShadow: 'rgba(37,99,235,.4)', cardText: '#dbeafe', cardSubText: '#bfdbfe',
    badgeBg: 'rgba(147,197,253,.15)', badgeBorder: '#93c5fd', badgeText: '#93c5fd',
    btnBg: 'linear-gradient(135deg,#93c5fd,#3b82f6,#1d4ed8)', btnText: '#172554', metallic: true,
  },
  laranja: {
    cor: '#c2410c', gradient: 'linear-gradient(135deg,#fdba74,#f97316,#c2410c)',
    light: '#ffedd5', badge: '#c2410c', dark: '#431407',
    heroBg: 'linear-gradient(155deg,#431407 0%,#7c2d12 50%,#450a0a 100%)',
    cardBg: 'linear-gradient(160deg,#431407 0%,#7c2d12 40%,#9a3412 60%,#431407 100%)',
    cardBorder: '#fdba74', cardShadow: 'rgba(194,65,12,.4)', cardText: '#ffedd5', cardSubText: '#fed7aa',
    badgeBg: 'rgba(253,186,116,.15)', badgeBorder: '#fdba74', badgeText: '#fdba74',
    btnBg: 'linear-gradient(135deg,#fdba74,#f97316,#c2410c)', btnText: '#431407', metallic: true,
  },
  vermelho: {
    cor: '#b91c1c', gradient: 'linear-gradient(135deg,#fca5a5,#ef4444,#b91c1c)',
    light: '#fee2e2', badge: '#b91c1c', dark: '#450a0a',
    heroBg: 'linear-gradient(155deg,#450a0a 0%,#7f1d1d 50%,#3b0000 100%)',
    cardBg: 'linear-gradient(160deg,#450a0a 0%,#7f1d1d 40%,#991b1b 60%,#450a0a 100%)',
    cardBorder: '#fca5a5', cardShadow: 'rgba(153,27,27,.4)', cardText: '#fee2e2', cardSubText: '#fecaca',
    badgeBg: 'rgba(252,165,165,.15)', badgeBorder: '#fca5a5', badgeText: '#fca5a5',
    btnBg: 'linear-gradient(135deg,#fca5a5,#ef4444,#b91c1c)', btnText: '#450a0a', metallic: true,
  },
  preto: {
    cor: '#374151', gradient: 'linear-gradient(135deg,#9ca3af,#6b7280,#374151)',
    light: '#f3f4f6', badge: '#374151', dark: '#030712',
    heroBg: 'linear-gradient(155deg,#030712 0%,#111827 50%,#0f172a 100%)',
    cardBg: 'linear-gradient(160deg,#030712 0%,#111827 40%,#1f2937 60%,#030712 100%)',
    cardBorder: '#9ca3af', cardShadow: 'rgba(0,0,0,.5)', cardText: '#f3f4f6', cardSubText: '#d1d5db',
    badgeBg: 'rgba(156,163,175,.12)', badgeBorder: '#6b7280', badgeText: '#d1d5db',
    btnBg: 'linear-gradient(135deg,#d1d5db,#9ca3af,#6b7280)', btnText: '#111827', metallic: true,
  },
  cafe: {
    cor: '#92400e', gradient: 'linear-gradient(135deg,#d97706,#b45309,#92400e)',
    light: '#fef3c7', badge: '#92400e', dark: '#1c0a00',
    heroBg: 'linear-gradient(155deg,#1c0a00 0%,#451a03 50%,#2c1200 100%)',
    cardBg: 'linear-gradient(160deg,#1c0a00 0%,#451a03 40%,#78350f 60%,#1c0a00 100%)',
    cardBorder: '#fcd34d', cardShadow: 'rgba(120,53,15,.5)', cardText: '#fef3c7', cardSubText: '#fde68a',
    badgeBg: 'rgba(252,211,77,.12)', badgeBorder: '#fcd34d', badgeText: '#fcd34d',
    btnBg: 'linear-gradient(135deg,#fcd34d,#d97706,#92400e)', btnText: '#1c0a00', metallic: true,
  },
  dourado: {
    cor: '#b8860b', gradient: 'linear-gradient(135deg,#d4a017,#b8860b,#9a7010)',
    light: '#fef3c7', badge: '#b8860b', dark: '#1a1000',
    heroBg: 'linear-gradient(160deg,#7b5900 0%,#b8860b 15%,#d4a017 30%,#9a7010 50%,#c8960e 65%,#7b5900 80%,#b08000 100%)',
    cardBg: 'linear-gradient(160deg,#7b5900 0%,#b8860b 15%,#d4a017 30%,#9a7010 50%,#c8960e 65%,#7b5900 80%,#b08000 100%)',
    cardBorder: '#d4a017', cardShadow: 'rgba(120,90,0,.6)', cardText: '#fef9e7', cardSubText: '#fde68a',
    badgeBg: 'rgba(0,0,0,.25)', badgeBorder: 'rgba(218,165,17,.5)', badgeText: '#fcd34d',
    btnBg: 'linear-gradient(135deg,#1a1000,#2d1f00)', btnText: '#daa520', metallic: true,
  },
};

/* ── Galeria carrossel centralizado ── */
function GaleriaCarrossel({ fotos, tema }: { fotos: string[]; tema: typeof TEMAS[string] }) {
  const [active, setActive]     = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const startX   = useRef(0);
  const dragging = useRef(false);

  const prev = () => setActive(i => (i - 1 + fotos.length) % fotos.length);
  const next = () => setActive(i => (i + 1) % fotos.length);

  /* Swipe touch/mouse */
  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    trackRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const dx = e.clientX - startX.current;
    if (dx < -40) next();
    else if (dx > 40) prev();
  };

  /* Índices visíveis: prev, active, next */
  const len  = fotos.length;
  const iPrev = (active - 1 + len) % len;
  const iNext = (active + 1) % len;
  const visible = len === 1
    ? [{ idx: active, pos: 'center' }]
    : len === 2
    ? [{ idx: iPrev, pos: 'left' }, { idx: active, pos: 'center' }]
    : [
        { idx: iPrev,  pos: 'left'   },
        { idx: active, pos: 'center' },
        { idx: iNext,  pos: 'right'  },
      ];

  const styleFor = (pos: string): React.CSSProperties => {
    if (pos === 'center') return {
      width: isMobile ? '78%' : '68%',
      height: isMobile ? 300 : 440,
      borderRadius: 18, objectFit: 'cover',
      boxShadow: '0 12px 40px rgba(34,197,94,.25)',
      border: `2px solid ${tema.cor}40`,
      transform: 'scale(1)',
      opacity: 1,
      zIndex: 2,
      cursor: 'default',
      transition: 'all .4s cubic-bezier(.22,1,.36,1)',
      flexShrink: 0,
    };
    return {
      width: isMobile ? '14%' : '28%',
      height: isMobile ? 240 : 320,
      borderRadius: isMobile ? 10 : 14,
      objectFit: 'cover',
      border: `1.5px solid ${tema.light}`,
      transform: pos === 'left'
        ? isMobile ? 'scale(0.85) translateX(32px)' : 'scale(0.88) translateX(12px)'
        : isMobile ? 'scale(0.85) translateX(-32px)' : 'scale(0.88) translateX(-12px)',
      opacity: isMobile ? 0.3 : 0.55,
      zIndex: 1,
      cursor: 'pointer',
      transition: 'all .4s cubic-bezier(.22,1,.36,1)',
      flexShrink: 0,
    };
  };

  return (
    <div style={{ marginBottom: 56 }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <span style={{ display: 'inline-block', background: `linear-gradient(135deg,${tema.light},${tema.light}88)`, borderRadius: 50, padding: '5px 18px', fontSize: '.8rem', color: tema.cor, fontWeight: 700 }}>
          🖼️ Galeria da turma
        </span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, overflow: 'hidden', padding: '16px 0',
          userSelect: 'none', touchAction: 'pan-y',
          position: 'relative',
        }}
      >
        {visible.map(({ idx, pos }) => (
          <img
            key={idx}
            src={fotos[idx]}
            alt={`Foto ${idx + 1}`}
            style={styleFor(pos) as React.CSSProperties}
            data-pos={pos}
            onClick={() => {
              if (pos === 'left')  prev();
              if (pos === 'right') next();
              if (pos === 'center') setLightbox(true);
            }}
            draggable={false}
          />
        ))}
      </div>

      {/* Dots */}
      {fotos.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
          {fotos.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} style={{
              width: i === active ? 20 : 7, height: 7,
              borderRadius: 99, border: 'none', cursor: 'pointer', padding: 0,
              background: i === active ? tema.gradient : tema.light,
              transition: 'all .3s',
            }} />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            animation: 'fadeInLb .2s ease',
          }}
        >
          <style>{`@keyframes fadeInLb { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }`}</style>

          {/* Botão fechar */}
          <button
            onClick={() => setLightbox(false)}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)',
              color: 'white', borderRadius: '50%', width: 40, height: 40,
              fontSize: '1.2rem', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontFamily: 'sans-serif', lineHeight: 1,
            }}
          >✕</button>

          {/* Seta esquerda */}
          {fotos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              style={{
                position: 'absolute', left: 16,
                background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)',
                color: 'white', borderRadius: '50%', width: 44, height: 44,
                fontSize: '1.4rem', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >‹</button>
          )}

          {/* Foto */}
          <img
            src={fotos[active]}
            alt="Foto ampliada"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '88vh',
              objectFit: 'contain', borderRadius: 16,
              boxShadow: '0 24px 80px rgba(0,0,0,.5)',
            }}
          />

          {/* Seta direita */}
          {fotos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              style={{
                position: 'absolute', right: 16,
                background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)',
                color: 'white', borderRadius: '50%', width: 44, height: 44,
                fontSize: '1.4rem', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >›</button>
          )}

          {/* Contador */}
          <div style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,.6)', fontSize: '.82rem',
          }}>
            {active + 1} / {fotos.length}
          </div>
        </div>
      )}


    </div>
  );
}

/* ── Página ── */
const TurmaPage: React.FC<PageProps> = ({ params }) => {
  const [slug, setSlug]           = useState<string | null>(null);
  const [turma, setTurma]         = useState<TurmaData | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Edição de fotos
  const [editMode, setEditMode]     = useState(false);
  const [authModal, setAuthModal]   = useState(false);
  const [authEmail, setAuthEmail]   = useState('');
  const [authError, setAuthError]   = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [fotosEdit, setFotosEdit]   = useState<string[]>([]);

  /* ── Carrega dados ── */
  useEffect(() => {
    const fetchData = async () => {
      const { slug: s } = await params;
      setSlug(s);

      const { data, error } = await supabase
        .from('turmas')
        .select('*')
        .eq('slug', s)
        .single();

      if (error || !data) { console.error('Erro:', error); return; }
      setTurma(data as TurmaData);
      setFotosEdit((data as TurmaData).fotos || []);

      const qr = await QRCode.toDataURL(
        `${process.env.NEXT_PUBLIC_BASE_URL}/${s}`,
        { width: 280, margin: 2, color: { dark: '#052e16', light: '#ffffff' } }
      );
      setQrCodeUrl(qr);
    };
    fetchData();
  }, [params]);

  /* ── Countdown ao vivo ── */
  useEffect(() => {
    if (!turma) return;
    const tick = () => setCountdown(calcCountdown(turma.dataFormatura));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [turma]);

  /* ── Download QR ── */
  const downloadQR = useCallback(() => {
    if (!qrCodeUrl || !slug) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `QRCode-${slug}.png`;
    a.click();
  }, [qrCodeUrl, slug]);

  /* ── Auth edição ── */
  const handleAuth = async () => {
    if (!authEmail.trim()) { setAuthError('Digite seu email.'); return; }
    setAuthLoading(true); setAuthError('');
    try {
      const fd = new FormData();
      fd.append('slug',   slug!);
      fd.append('email',  authEmail);
      fd.append('action', 'remove');
      fd.append('fotoUrl', fotosEdit[0] || '');
      // Só valida o email — não remove nada de verdade
      const res  = await fetch('/api/edit-photos', { method: 'POST', body: (() => { const f = new FormData(); f.append('slug', slug!); f.append('email', authEmail); f.append('action', 'validate'); return f; })() });
      const data = await res.json();
      if (res.status === 401) { setAuthError('Email incorreto. Tente novamente.'); return; }
      if (res.status === 404) { setAuthError('Página não encontrada.'); return; }
      // Qualquer outro status que não 400 de ação inválida = email correto
      setAuthModal(false);
      setEditMode(true);
    } catch {
      setAuthError('Erro de conexão.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRemoveFoto = async (url: string) => {
    if (!slug || editLoading) return;
    if (!confirm('Remover esta foto?')) return;
    setEditLoading(true);
    try {
      const fd = new FormData();
      fd.append('slug',    slug);
      fd.append('email',   authEmail);
      fd.append('action',  'remove');
      fd.append('fotoUrl', url);
      const res  = await fetch('/api/edit-photos', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        setFotosEdit(data.fotos);
        if (turma) setTurma({ ...turma, fotos: data.fotos });
      } else {
        alert(data.error || 'Erro ao remover foto.');
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !slug || editLoading) return;
    setEditLoading(true);
    try {
      const fd = new FormData();
      fd.append('slug',   slug);
      fd.append('email',  authEmail);
      fd.append('action', 'add');
      fd.append('foto',   file);
      const res  = await fetch('/api/edit-photos', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        setFotosEdit(data.fotos);
        if (turma) setTurma({ ...turma, fotos: data.fotos });
      } else {
        alert(data.error || 'Erro ao adicionar foto.');
      }
    } finally {
      setEditLoading(false);
      e.target.value = '';
    }
  };

  /* ── Loading ── */
  if (!turma) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', fontFamily: "'Nunito',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
        <p style={{ color: '#4d7c5f', fontWeight: 600 }}>Carregando...</p>
      </div>
    </div>
  );

  const formatarData = (data: string) =>
    new Date(data + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const tema = TEMAS[turma.tema ?? 'verde'] ?? TEMAS['verde'];

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", minHeight: '100vh', background: '#f6fdf8', color: '#052e16', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Nunito:wght@300;400;600;700&display=swap');
        .pf { font-family: 'Playfair Display', Georgia, serif !important; }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sheen  { 0%{left:-80%} 100%{left:140%} }
        .fade-up { animation: fadeUp .7s ease forwards; }
        .float   { animation: float 3s ease-in-out infinite; }
        .embla            { overflow: hidden; border-radius: 20px; }
        .embla__container { display: flex; }
        .embla__slide     { flex: 0 0 100%; }
        .metallic-card { position: relative; overflow: hidden; }
        .metallic-card::before { content:''; position:absolute; top:0; left:-80%; width:50%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent); transform:skewX(-18deg); animation:sheen 4s ease-in-out infinite; pointer-events:none; }
      `}</style>

      {/* ── MODAL AUTH ── */}
      {authModal && (
        <div onClick={() => setAuthModal(false)} style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#ffffff',
            borderRadius: 24, padding: '40px 32px',
            maxWidth: 400, width: '100%',
            boxShadow: '0 24px 80px rgba(0,0,0,.5)',
          }}>
            <h2 className="pf" style={{ fontSize: '1.4rem', color: '#052e16', marginBottom: 8 }}>
              Gerenciar fotos
            </h2>
            <p style={{ fontSize: '.88rem', color: '#4d7c5f', marginBottom: 24, lineHeight: 1.5 }}>
              Digite o email usado na criação da página para entrar no modo de edição.
            </p>
            <input
              type="email"
              value={authEmail}
              onChange={e => { setAuthEmail(e.target.value); setAuthError(''); }}
              placeholder="seu@email.com"
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 14,
                border: `1.5px solid ${authError ? '#f87171' : '#dcfce7'}`,
                background: '#f9fafb', color: '#052e16',
                fontSize: '.97rem', fontFamily: "'Nunito',sans-serif",
                outline: 'none', marginBottom: 8, boxSizing: 'border-box',
              }}
            />
            {authError && <p style={{ color: '#ef4444', fontSize: '.78rem', marginBottom: 8 }}>{authError}</p>}
            <button onClick={handleAuth} disabled={authLoading}
              style={{
                width: '100%', padding: '13px', borderRadius: 50, border: 'none',
                background: tema.cardBg,
                color: tema.cardText, fontWeight: 700, fontSize: '1rem',
                cursor: authLoading ? 'wait' : 'pointer',
                fontFamily: "'Nunito',sans-serif", marginTop: 4,
                boxShadow: `0 4px 16px ${tema.cardShadow}`,
              }}>
              {authLoading ? 'Verificando...' : 'Entrar no modo de edição'}
            </button>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '64px 24px 48px', textAlign: 'center', background: tema.heroBg, borderBottom: `1px solid ${tema.cor}20` }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, background: 'radial-gradient(circle,rgba(134,239,172,.15),transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, background: 'radial-gradient(circle,rgba(45,212,191,.1),transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div className="float" style={{ fontSize: 56, marginBottom: 16 }}>🎓</div>
        <h1 className="pf fade-up" style={{ fontSize: 'clamp(2.4rem,8vw,4rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: 12, color: 'white' }}>
          {turma.nomeTurma}
        </h1>
        <p style={{ color: tema.light, fontSize: '.9rem', marginBottom: 10 }}>
          {turma.escola}{turma.cidade ? ` · ${turma.cidade}` : ''}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-block', background: 'rgba(255,255,255,.12)', borderRadius: 50, padding: '4px 16px', fontSize: '.75rem', fontWeight: 700, color: 'white', border: '1px solid rgba(255,255,255,.2)' }}>
            🎉 Formatura em {formatarData(turma.dataFormatura)}
          </span>

        </div>
      </div>



      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 20px 80px' }}>

        {/* ── COUNTDOWN ── */}
        {countdown && (
          <div style={{ marginBottom: 56 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span style={{ display: 'inline-block', background: `linear-gradient(135deg,${tema.light},${tema.light}88)`, borderRadius: 50, padding: '5px 18px', fontSize: '.8rem', color: tema.cor, fontWeight: 700 }}>
                {countdown.passou ? '🎉 Formatura realizada!' : '⏳ Countdown da formatura'}
              </span>
            </div>

            {!countdown.passou ? (
              <>
                <div style={{ borderRadius: 22, padding: '28px 20px', background: tema.cardBg, border: `1.5px solid ${tema.cardBorder}`, boxShadow: `0 8px 32px ${tema.cardShadow}, inset 0 1px 0 rgba(255,255,255,.15)`, marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
                    {[
                      { label: 'Dias',    value: countdown.dias },
                      { label: 'Horas',   value: countdown.horas },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <div className="pf" style={{ fontSize: '3rem', fontWeight: 700, color: tema.cardText, lineHeight: 1, textShadow: '0 2px 4px rgba(0,0,0,.3)' }}>{value}</div>
                        <div style={{ fontSize: '.75rem', color: tema.cardSubText, marginTop: 4, fontWeight: 600 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: tema.cardBg, borderRadius: 22, padding: '28px 20px', border: `1.5px solid ${tema.cardBorder}`, boxShadow: `0 8px 32px ${tema.cardShadow}, inset 0 1px 0 rgba(255,255,255,.15)` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
                    {[
                      { label: 'Minutos',  value: countdown.minutos },
                      { label: 'Segundos', value: countdown.segundos },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <div className="pf" style={{ fontSize: '3rem', fontWeight: 700, color: tema.cardText, lineHeight: 1, textShadow: '0 2px 4px rgba(0,0,0,.3)' }}>{value}</div>
                        <div style={{ fontSize: '.75rem', color: tema.cardSubText, marginTop: 4, fontWeight: 600 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ borderRadius: 22, padding: '32px', background: tema.cardBg, border: `1.5px solid ${tema.cardBorder}`, boxShadow: `0 8px 32px ${tema.cardShadow}`, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
                <p className="pf" style={{ fontSize: '1.4rem', color: tema.cardText, fontWeight: 700 }}>Formatura realizada!</p>
                <p style={{ color: '#4d7c5f', fontSize: '.9rem', marginTop: 8 }}>{formatarData(turma.dataFormatura)}</p>
              </div>
            )}
          </div>
        )}

        {/* ── GALERIA DE FOTOS ── */}
        {editMode ? (
          <div style={{ marginBottom: 56 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ display: 'inline-block', background: `linear-gradient(135deg,${tema.light},${tema.light}88)`, borderRadius: 50, padding: '5px 18px', fontSize: '.8rem', color: tema.cor, fontWeight: 700 }}>
                ✏️ Editando galeria — clique no ✕ para remover
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 8 }}>
              {fotosEdit.map((url, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                  <img src={url} alt={`Foto ${i+1}`} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => handleRemoveFoto(url)}
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      background: 'rgba(0,0,0,.65)', border: 'none', color: 'white',
                      borderRadius: '50%', width: 28, height: 28, cursor: 'pointer',
                      fontSize: '.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Nunito',sans-serif",
                    }}>✕</button>
                </div>
              ))}
              {fotosEdit.length < (turma?.plano === 'premium' ? 50 : 20) && (
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  height: 120, borderRadius: 12, cursor: 'pointer',
                  border: `2px dashed ${tema.light}`, background: `${tema.light}40`,
                  color: tema.cor, fontSize: '.8rem', fontWeight: 700, gap: 6,
                }}>
                  <span style={{ fontSize: 24 }}>+</span>
                  Adicionar
                  <input type="file" accept="image/*" onChange={handleAddFoto} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          </div>
        ) : (
          turma.fotos.length > 0 && <GaleriaCarrossel fotos={turma.fotos} tema={tema} />
        )}

        {/* Botão gerenciar fotos / sair edição */}
        <div style={{ textAlign: 'center', marginTop: -36, marginBottom: 56 }}>
          {editMode ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '.82rem', color: '#4d7c5f', fontWeight: 600 }}>
                ✏️ {fotosEdit.length}/{turma?.plano === 'premium' ? 50 : 20} fotos
                {editLoading && ' · Salvando...'}
              </span>
              <button onClick={() => setEditMode(false)}
                style={{
                  background: `linear-gradient(135deg,${tema.light},${tema.cor}40)`,
                  border: `1px solid ${tema.light}`,
                  color: tema.cor, borderRadius: 50, padding: '7px 18px',
                  fontSize: '.82rem', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Nunito',sans-serif",
                }}>
                ✓ Sair da edição
              </button>
            </div>
          ) : (
            <button onClick={() => setAuthModal(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '.75rem', color: '#4d7c5f', fontFamily: "'Nunito',sans-serif",
                opacity: .5, textDecoration: 'none',
              }}>
              🔒 Gerenciar fotos
            </button>
          )}
        </div>

        {/* ── LISTA DA TURMA ── */}
        {turma.alunos.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ display: 'inline-block', background: `linear-gradient(135deg,${tema.light},${tema.light}88)`, borderRadius: 50, padding: '5px 18px', fontSize: '.8rem', color: tema.cor, fontWeight: 700 }}>
                👥 A galera do {turma.nomeTurma}
              </span>
            </div>
            <div style={{ borderRadius: 22, padding: '24px', background: tema.cardBg, border: `1.5px solid ${tema.cardBorder}`, boxShadow: `0 8px 32px ${tema.cardShadow}, inset 0 1px 0 rgba(255,255,255,.12)` }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
                {turma.alunos.map((aluno, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,.08)',
                    borderRadius: 14, padding: '14px 12px', textAlign: 'center',
                    border: `1px solid ${tema.cardBorder}40`,
                    transition: 'transform .2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: tema.btnBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 8px', fontSize: 18,
                    }}>🧑</div>
                    <div style={{ fontSize: '.85rem', fontWeight: 700, color: tema.cardText, marginBottom: 2 }}>{aluno.nome}</div>
                    {aluno.apelido && (
                      <div style={{ fontSize: '.75rem', color: tema.cardSubText, fontStyle: 'italic' }}>&quot;{aluno.apelido}&quot;</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MURAL DE RECADOS ── */}
        {turma.mural && (
          <div style={{ marginBottom: 56 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ display: 'inline-block', background: `linear-gradient(135deg,${tema.light},${tema.light}88)`, borderRadius: 50, padding: '5px 18px', fontSize: '.8rem', color: tema.cor, fontWeight: 700 }}>
                ✍️ Mural da turma
              </span>
            </div>
            <div style={{ borderRadius: 22, padding: '32px 28px', background: tema.cardBg, border: `1.5px solid ${tema.cardBorder}`, boxShadow: `0 8px 32px ${tema.cardShadow}, inset 0 1px 0 rgba(255,255,255,.12)`, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 16, left: 20, fontFamily: "'Playfair Display',serif", fontSize: '4rem', color: tema.light, lineHeight: 1, userSelect: 'none' }}>"</div>
              <p style={{ fontSize: '1.05rem', color: tema.cardText, lineHeight: 1.8, fontStyle: 'italic', textAlign: 'center', paddingTop: 16, position: 'relative' }}>
                {turma.mural}
              </p>
              <div style={{ position: 'absolute', bottom: 8, right: 20, fontFamily: "'Playfair Display',serif", fontSize: '4rem', color: tema.light, lineHeight: 1, userSelect: 'none' }}>"</div>
            </div>
          </div>
        )}


        {/* ── CURIOSIDADES (premium) ── */}
        {turma.plano === 'premium' && turma.curiosidades && turma.curiosidades.some(c => c.resposta) && (
          <div style={{ marginBottom: 56 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ display: 'inline-block', background: `linear-gradient(135deg,${tema.light},${tema.light}88)`, borderRadius: 50, padding: '5px 18px', fontSize: '.8rem', color: tema.cor, fontWeight: 700 }}>
                🎲 Curiosidades da turma
              </span>
            </div>
            <div style={{ borderRadius: 22, padding: '28px 24px', background: tema.cardBg, border: `1.5px solid ${tema.cardBorder}`, boxShadow: `0 8px 32px ${tema.cardShadow}` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {turma.curiosidades.filter(c => c.resposta).map((c, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '13px 16px', borderRadius: 14,
                    background: i % 2 === 0
                      ? 'rgba(255,255,255,.07)'
                      : 'rgba(255,255,255,.04)',
                    border: `1px solid ${tema.light}`,
                    transition: 'transform .2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(5px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateX(0)')}
                  >
                    <div style={{ flexShrink: 0, fontSize: '1.4rem', lineHeight: 1 }}>
                      {c.categoria.split(' ')[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: '.78rem', color: tema.cardSubText, margin: '0 0 2px' }}>
                        {c.categoria.split(' ').slice(1).join(' ')}
                      </p>
                      <p style={{ fontSize: '.95rem', fontWeight: 700, color: tema.cardText, margin: 0 }}>
                        {c.resposta}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* ── PROFESSOR FAVORITO ── */}
        {(turma.professorNome || turma.professorMateria) && (
          <div style={{ marginBottom: 56 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ display: 'inline-block', background: `linear-gradient(135deg,${tema.light},${tema.light}88)`, borderRadius: 50, padding: '5px 18px', fontSize: '.8rem', color: tema.cor, fontWeight: 700 }}>
                🍎 Professor favorito
              </span>
            </div>
            <div style={{ borderRadius: 22, padding: '28px 24px', border: `1.5px solid ${tema.light}`, boxShadow: '0 4px 24px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg,${tema.light},${tema.light}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                👨‍🏫
              </div>
              <div>
                {turma.professorNome && <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#052e16', marginBottom: 4 }}>{turma.professorNome}</p>}
                {turma.professorMateria && <p style={{ fontSize: '.88rem', color: '#4d7c5f' }}>{turma.professorMateria}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── INSTAGRAM ── */}
        {turma.instagram && (
          <div style={{ marginBottom: 56 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ display: 'inline-block', background: `linear-gradient(135deg,${tema.light},${tema.light}88)`, borderRadius: 50, padding: '5px 18px', fontSize: '.8rem', color: tema.cor, fontWeight: 700 }}>
                📸 Instagram da turma
              </span>
            </div>
            <a href={`https://instagram.com/${turma.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', textDecoration: 'none' }}>
              <div style={{ borderRadius: 22, padding: '20px 24px', border: `1.5px solid ${tema.light}`, boxShadow: '0 4px 24px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 16, transition: 'transform .2s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)')}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)')}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#f9a8d4,#ec4899,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  📷
                </div>
                <div>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#052e16', marginBottom: 2 }}>
                    @{turma.instagram.replace('@','')}
                  </p>
                  <p style={{ fontSize: '.8rem', color: '#4d7c5f' }}>Ver perfil no Instagram</p>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: '1.2rem', color: '#4d7c5f' }}>→</span>
              </div>
            </a>
          </div>
        )}

        {/* ── CÁPSULA DO TEMPO (premium) ── */}
        {turma.plano === 'premium' && turma.capsulaData && turma.capsulaMensagem && (() => {
          const agora    = new Date();
          const abertura = new Date(turma.capsulaData + 'T00:00:00');
          const aberta   = agora >= abertura;
          return (
            <div style={{ marginBottom: 56 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <span style={{ display: 'inline-block', background: `linear-gradient(135deg,${tema.light},${tema.light}88)`, borderRadius: 50, padding: '5px 18px', fontSize: '.8rem', color: tema.cor, fontWeight: 700 }}>
                  ⏳ Cápsula do tempo
                </span>
              </div>
              {aberta ? (
                <div style={{ borderRadius: 22, padding: '32px 28px', background: tema.cardBg, border: `1.5px solid ${tema.cardBorder}`, boxShadow: `0 8px 32px ${tema.cardShadow}, inset 0 1px 0 rgba(255,255,255,.12)`, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 16, left: 20, fontFamily: "'Playfair Display',serif", fontSize: '4rem', color: tema.light, lineHeight: 1, userSelect: 'none' }}>"</div>
                  <p style={{ fontSize: '1.05rem', color: tema.cardText, lineHeight: 1.8, fontStyle: 'italic', textAlign: 'center', paddingTop: 16, position: 'relative' }}>
                    {turma.capsulaMensagem}
                  </p>
                  <div style={{ position: 'absolute', bottom: 8, right: 20, fontFamily: "'Playfair Display',serif", fontSize: '4rem', color: tema.light, lineHeight: 1, userSelect: 'none' }}>"</div>
                </div>
              ) : (
                <div style={{ borderRadius: 22, padding: '32px', border: `1.5px solid ${tema.light}`, boxShadow: '0 4px 24px rgba(0,0,0,.06)', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
                  <p className="pf" style={{ fontSize: '1.1rem', color: '#052e16', fontWeight: 700, marginBottom: 8 }}>
                    Cápsula lacrada
                  </p>
                  <p style={{ color: '#4d7c5f', fontSize: '.88rem' }}>
                    Abre em {new Date(turma.capsulaData + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── QR CODE ── */}
        {qrCodeUrl && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 20 }}>
              <span style={{ display: 'inline-block', background: `linear-gradient(135deg,${tema.light},${tema.light}88)`, borderRadius: 50, padding: '5px 18px', fontSize: '.8rem', color: tema.cor, fontWeight: 700 }}>
                📱 QR Code exclusivo da turma
              </span>
            </div>
            <div style={{ borderRadius: 22, padding: '32px', background: tema.cardBg, border: `1.5px solid ${tema.cardBorder}`, boxShadow: `0 8px 32px ${tema.cardShadow}`, display: 'inline-block' }}>
              <img src={qrCodeUrl} alt="QR Code" style={{ width: 200, height: 200, borderRadius: 12, display: 'block', margin: '0 auto 16px' }} />
              <p style={{ color: tema.cardSubText, fontSize: '.78rem', marginBottom: 16 }}>
                Escaneie para acessar esta página
              </p>
              <button onClick={downloadQR}
                style={{
                  background: tema.gradient,
                  color: tema.btnText, border: 'none', padding: '12px 32px',
                  borderRadius: 50, fontSize: '.9rem', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(34,197,94,.3)',
                  fontFamily: "'Nunito',sans-serif", transition: 'transform .2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                Baixar QR Code 🎓
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: tema.dark, padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎓</div>
        <p className="pf" style={{
          color: tema.light,
          fontWeight: 700, marginBottom: 4,
        }}>TerceirON</p>
        <p style={{ color: tema.light, fontSize: '.72rem', opacity: 0.6 }}>
          Copyright © 2026 TerceirON · Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
};

export default TurmaPage;