'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import QRCode from 'qrcode';
import useEmblaCarousel from 'embla-carousel-react';

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
  curiosidades: Curiosidade[] | null;
  musicaUrl: string | null;
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

/* ── Página ── */
const TurmaPage: React.FC<PageProps> = ({ params }) => {
  const [slug, setSlug]           = useState<string | null>(null);
  const [turma, setTurma]         = useState<TurmaData | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

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

  /* ── Carrossel auto-play ── */
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    const auto = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => { clearInterval(auto); emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  /* ── Música tema (premium) ── */
  useEffect(() => {
    if (!turma || turma.plano !== 'premium' || !turma.musicaUrl) return;
    const handler = () => {
      const audio = document.getElementById('bg-audio') as HTMLAudioElement;
      if (audio) { audio.volume = 0.2; audio.play().catch(() => {}); }
      document.removeEventListener('click', handler);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [turma]);

  /* ── Download QR ── */
  const downloadQR = useCallback(() => {
    if (!qrCodeUrl || !slug) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `QRCode-${slug}.png`;
    a.click();
  }, [qrCodeUrl, slug]);

  /* ── Loading ── */
  if (!turma) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', fontFamily: "'Nunito',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
        <p style={{ color: '#15803d', fontWeight: 600 }}>Carregando...</p>
      </div>
    </div>
  );

  const formatarData = (data: string) =>
    new Date(data + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", minHeight: '100vh', background: 'linear-gradient(180deg,#f0fdf4 0%,#dcfce7 30%,#f0fdfa 100%)', color: '#052e16', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Nunito:wght@300;400;600;700&display=swap');
        .pf { font-family: 'Playfair Display', Georgia, serif !important; }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp .7s ease forwards; }
        .float   { animation: float 3s ease-in-out infinite; }
        .embla            { overflow: hidden; border-radius: 20px; }
        .embla__container { display: flex; }
        .embla__slide     { flex: 0 0 100%; }
      `}</style>

      {/* Música tema */}
      {turma.plano === 'premium' && turma.musicaUrl && (
        <audio id="bg-audio" loop>
          <source src={turma.musicaUrl} type="audio/mp3" />
        </audio>
      )}

      {/* ── HERO ── */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '64px 24px 48px', textAlign: 'center', background: 'linear-gradient(155deg,#f0fdf4 0%,#dcfce7 40%,#ccfbf1 100%)', borderBottom: '1px solid #86efac30' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, background: 'radial-gradient(circle,rgba(134,239,172,.3),transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, background: 'radial-gradient(circle,rgba(45,212,191,.2),transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div className="float" style={{ fontSize: 56, marginBottom: 16 }}>🎓</div>
        <h1 className="pf fade-up" style={{ fontSize: 'clamp(2.4rem,8vw,4rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: 12 }}>
          {turma.nomeTurma}
        </h1>
        <p style={{ color: '#4d7c5f', fontSize: '.9rem', marginBottom: 10 }}>
          {turma.escola}{turma.cidade ? ` · ${turma.cidade}` : ''}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)', borderRadius: 50, padding: '4px 16px', fontSize: '.75rem', fontWeight: 700, color: '#15803d' }}>
            🎉 Formatura em {formatarData(turma.dataFormatura)}
          </span>
          {turma.plano === 'premium' && turma.musicaUrl && (
            <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)', borderRadius: 50, padding: '4px 16px', fontSize: '.75rem', fontWeight: 700, color: '#15803d' }}>
              🎵 Toque para ouvir
            </span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 20px 80px' }}>

        {/* ── COUNTDOWN ── */}
        {countdown && (
          <div style={{ marginBottom: 56 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)', borderRadius: 50, padding: '5px 18px', fontSize: '.8rem', color: '#15803d', fontWeight: 700 }}>
                {countdown.passou ? '🎉 Formatura realizada!' : '⏳ Countdown da formatura'}
              </span>
            </div>

            {!countdown.passou ? (
              <>
                <div style={{ background: 'white', borderRadius: 22, padding: '28px 20px', border: '1.5px solid #dcfce7', boxShadow: '0 4px 24px rgba(134,239,172,.15)', marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
                    {[
                      { label: 'Dias',    value: countdown.dias },
                      { label: 'Horas',   value: countdown.horas },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <div className="pf" style={{ fontSize: '3rem', fontWeight: 700, color: '#15803d', lineHeight: 1 }}>{value}</div>
                        <div style={{ fontSize: '.75rem', color: '#4d7c5f', marginTop: 4, fontWeight: 600 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#ccfbf1)', borderRadius: 22, padding: '28px 20px', border: '1.5px solid #86efac30', boxShadow: '0 4px 24px rgba(45,212,191,.1)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
                    {[
                      { label: 'Minutos',  value: countdown.minutos },
                      { label: 'Segundos', value: countdown.segundos },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <div className="pf" style={{ fontSize: '3rem', fontWeight: 700, color: '#2dd4bf', lineHeight: 1 }}>{value}</div>
                        <div style={{ fontSize: '.75rem', color: '#4d7c5f', marginTop: 4, fontWeight: 600 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ background: 'white', borderRadius: 22, padding: '32px', border: '1.5px solid #dcfce7', boxShadow: '0 4px 24px rgba(134,239,172,.15)', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
                <p className="pf" style={{ fontSize: '1.4rem', color: '#15803d', fontWeight: 700 }}>Formatura realizada!</p>
                <p style={{ color: '#4d7c5f', fontSize: '.9rem', marginTop: 8 }}>{formatarData(turma.dataFormatura)}</p>
              </div>
            )}
          </div>
        )}

        {/* ── GALERIA DE FOTOS ── */}
        {turma.fotos.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)', borderRadius: 50, padding: '5px 18px', fontSize: '.8rem', color: '#15803d', fontWeight: 700 }}>
                🖼️ Galeria da turma
              </span>
            </div>
            <div className="embla" ref={emblaRef}>
              <div className="embla__container">
                {turma.fotos.map((url, i) => (
                  <div key={i} className="embla__slide">
                    <img src={url} alt={`Foto ${i + 1}`} style={{ width: '100%', maxHeight: 480, objectFit: 'cover', borderRadius: 20, border: '2px solid #dcfce7', boxShadow: '0 8px 32px rgba(134,239,172,.2)' }} />
                  </div>
                ))}
              </div>
            </div>
            {turma.fotos.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
                {turma.fotos.map((_, i) => (
                  <button key={i} onClick={() => emblaApi?.scrollTo(i)} style={{
                    width: i === selectedIndex ? 20 : 8, height: 8,
                    borderRadius: 99, border: 'none', cursor: 'pointer',
                    background: i === selectedIndex ? 'linear-gradient(135deg,#86efac,#22c55e)' : '#dcfce7',
                    transition: 'all .3s', padding: 0,
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LISTA DA TURMA ── */}
        {turma.alunos.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)', borderRadius: 50, padding: '5px 18px', fontSize: '.8rem', color: '#15803d', fontWeight: 700 }}>
                👥 A galera do {turma.nomeTurma}
              </span>
            </div>
            <div style={{ background: 'white', borderRadius: 22, padding: '24px', border: '1.5px solid #dcfce7', boxShadow: '0 4px 24px rgba(134,239,172,.15)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
                {turma.alunos.map((aluno, i) => (
                  <div key={i} style={{
                    background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                    borderRadius: 14, padding: '14px 12px', textAlign: 'center',
                    border: '1px solid #86efac30',
                    transition: 'transform .2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#86efac,#2dd4bf)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 8px', fontSize: 18,
                    }}>🧑</div>
                    <div style={{ fontSize: '.85rem', fontWeight: 700, color: '#052e16', marginBottom: 2 }}>{aluno.nome}</div>
                    {aluno.apelido && (
                      <div style={{ fontSize: '.75rem', color: '#4d7c5f', fontStyle: 'italic' }}>&quot;{aluno.apelido}&quot;</div>
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
              <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)', borderRadius: 50, padding: '5px 18px', fontSize: '.8rem', color: '#15803d', fontWeight: 700 }}>
                ✍️ Mural da turma
              </span>
            </div>
            <div style={{ background: 'white', borderRadius: 22, padding: '32px 28px', border: '1.5px solid #dcfce7', boxShadow: '0 4px 24px rgba(134,239,172,.15)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 16, left: 20, fontFamily: "'Playfair Display',serif", fontSize: '4rem', color: '#dcfce7', lineHeight: 1, userSelect: 'none' }}>"</div>
              <p style={{ fontSize: '1.05rem', color: '#4d7c5f', lineHeight: 1.8, fontStyle: 'italic', textAlign: 'center', paddingTop: 16, position: 'relative' }}>
                {turma.mural}
              </p>
              <div style={{ position: 'absolute', bottom: 8, right: 20, fontFamily: "'Playfair Display',serif", fontSize: '4rem', color: '#dcfce7', lineHeight: 1, userSelect: 'none' }}>"</div>
            </div>
          </div>
        )}

        {/* ── CURIOSIDADES (premium) ── */}
        {turma.plano === 'premium' && turma.curiosidades && turma.curiosidades.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)', borderRadius: 50, padding: '5px 18px', fontSize: '.8rem', color: '#15803d', fontWeight: 700 }}>
                🎲 Curiosidades da turma
              </span>
            </div>
            <div style={{ background: 'white', borderRadius: 22, padding: '28px 24px', border: '1.5px solid #dcfce7', boxShadow: '0 4px 24px rgba(134,239,172,.15)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {turma.curiosidades.filter(c => c.resposta).map((c, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '13px 16px', borderRadius: 14,
                    background: i % 2 === 0
                      ? 'linear-gradient(135deg,rgba(220,252,231,.5),rgba(204,251,241,.2))'
                      : 'linear-gradient(135deg,rgba(204,251,241,.2),rgba(220,252,231,.5))',
                    border: '1px solid #dcfce7',
                    transition: 'transform .2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(5px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateX(0)')}
                  >
                    <div style={{ flexShrink: 0, fontSize: '1.4rem', lineHeight: 1 }}>
                      {c.categoria.split(' ')[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: '.78rem', color: '#4d7c5f', margin: '0 0 2px' }}>
                        {c.categoria.split(' ').slice(1).join(' ')}
                      </p>
                      <p style={{ fontSize: '.95rem', fontWeight: 700, color: '#052e16', margin: 0 }}>
                        {c.resposta}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── QR CODE ── */}
        {qrCodeUrl && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 20 }}>
              <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)', borderRadius: 50, padding: '5px 18px', fontSize: '.8rem', color: '#15803d', fontWeight: 700 }}>
                📱 QR Code exclusivo da turma
              </span>
            </div>
            <div style={{ background: 'white', borderRadius: 22, padding: '32px', border: '1.5px solid #dcfce7', boxShadow: '0 4px 24px rgba(134,239,172,.15)', display: 'inline-block' }}>
              <img src={qrCodeUrl} alt="QR Code" style={{ width: 200, height: 200, borderRadius: 12, display: 'block', margin: '0 auto 16px' }} />
              <p style={{ color: '#4d7c5f', fontSize: '.78rem', marginBottom: 16 }}>
                Escaneie para acessar esta página
              </p>
              <button onClick={downloadQR}
                style={{
                  background: 'linear-gradient(135deg,#86efac,#22c55e,#15803d)',
                  color: 'white', border: 'none', padding: '12px 32px',
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
      <footer style={{ background: '#052e16', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎓</div>
        <p className="pf" style={{
          background: 'linear-gradient(90deg,#86efac,#2dd4bf)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontWeight: 700, marginBottom: 4, display: 'inline-block',
        }}>Terceirão.app</p>
        <p style={{ color: '#4d7c5f', fontSize: '.72rem' }}>
          Copyright © 2025 Terceirão.app · Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
};

export default TurmaPage;