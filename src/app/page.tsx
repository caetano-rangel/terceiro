'use client';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';

/* ── Animações ── */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 36 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay } },
});
const fadeLeft = (delay = 0): Variants => ({
  hidden: { opacity: 0, x: -40 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.7, ease: EASE, delay } },
});
const fadeRight = (delay = 0): Variants => ({
  hidden: { opacity: 0, x: 40 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.7, ease: EASE, delay } },
});

/* ── QR pattern mock ── */
const QR_PATTERN = [
  1,1,1,1,1,1,1,0, 1,0,0,0,0,0,1,0,
  1,0,1,1,1,0,1,0, 1,0,1,0,1,0,1,0,
  1,0,1,1,1,0,1,0, 1,0,0,0,0,0,1,0,
  1,1,1,1,1,1,1,0, 0,1,0,1,0,1,0,1,
];

/* ── Phone Mockup ── */
function PhoneMock() {
  return (
    <div style={{
      background: '#0a1f12', borderRadius: 36, padding: '10px 7px', width: 200,
      boxShadow: '0 32px 72px rgba(5,46,22,.3), 0 0 0 1px #1a4a28',
    }}>
      <div style={{
        background: 'linear-gradient(160deg,#f0fdf4,#dcfce7,#f0fdfa)',
        borderRadius: 28, padding: 14, minHeight: 360,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9,
      }}>
        <div style={{
          width: 52, height: 52,
          background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)',
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 26,
          boxShadow: '0 6px 18px rgba(134,239,172,.5)',
        }}>🎓</div>

        <div style={{ fontFamily: "'Playfair Display',serif", color: '#15803d', fontWeight: 700, fontSize: '1rem' }}>
          3º B — 2025
        </div>
        <div style={{ fontSize: '.6rem', color: '#4d7c5f', textAlign: 'center' }}>
          Colégio Est. Silva Jardim
        </div>

        <div style={{
          background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)',
          borderRadius: 14, padding: '8px 14px', textAlign: 'center',
          border: '1px solid #86efac', width: '100%',
        }}>
          <div style={{ fontSize: '.6rem', color: '#4d7c5f' }}>Formatura em</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.2rem', color: '#15803d', fontWeight: 700 }}>
            52 dias
          </div>
          <div style={{ fontSize: '.6rem', color: '#4d7c5f' }}>🎉</div>
        </div>

        {[
          { emoji: '🧑', nome: 'Lucas "Saladão"', frase: '"vou ser rico... ou não"' },
          { emoji: '👩', nome: 'Ana "Aninha"',    frase: '"medicina ou morrer"' },
        ].map((a) => (
          <div key={a.nome} style={{
            background: 'white', borderRadius: 10, padding: '7px 10px', width: '100%',
            display: 'flex', alignItems: 'center', gap: 7, border: '1px solid #dcfce7',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'linear-gradient(135deg,#dcfce7,#d1fae5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, flexShrink: 0,
            }}>{a.emoji}</div>
            <div>
              <div style={{ fontSize: '.64rem', fontWeight: 700, color: '#052e16' }}>{a.nome}</div>
              <div style={{ fontSize: '.56rem', color: '#4d7c5f', fontStyle: 'italic' }}>{a.frase}</div>
            </div>
          </div>
        ))}

        <div style={{
          background: '#f0fdf4', borderRadius: 10, padding: '7px 10px', width: '100%',
          fontSize: '.62rem', color: '#4d7c5f', textAlign: 'center', fontStyle: 'italic',
        }}>
          &quot;A melhor turma de todas 💚&quot;
        </div>

        <div style={{ background: 'white', borderRadius: 10, padding: 6, border: '1px solid #dcfce7' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 1.5 }}>
            {QR_PATTERN.map((v, i) => (
              <div key={i} style={{ width: 5, height: 5, borderRadius: 1, background: v ? '#052e16' : 'transparent' }} />
            ))}
          </div>
          <div style={{ fontSize: '.58rem', color: '#4d7c5f', marginTop: 2, textAlign: 'center' }}>
            QR Code da turma
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Step Card ── */
function StepCard({ emoji, num, title, desc, delay }: {
  emoji: string; num: string; title: string; desc: string; delay: number;
}) {
  return (
    <motion.div
      variants={fadeUp(delay)} initial="hidden" whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      style={{
        background: 'white', borderRadius: 22, padding: '28px 22px', textAlign: 'center',
        border: '1.5px solid #dcfce7', boxShadow: '0 4px 24px rgba(134,239,172,.15)',
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 10 }}>{emoji}</div>
      <div style={{
        width: 26, height: 26,
        background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)',
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 10px', fontSize: '.78rem', fontWeight: 700, color: '#15803d',
      }}>{num}</div>
      <h3 style={{ fontSize: '.95rem', fontWeight: 700, color: '#052e16', marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: '.84rem', color: '#4d7c5f', lineHeight: 1.6 }}>{desc}</p>
    </motion.div>
  );
}

/* ── Feat Card ── */
function FeatCard({ emoji, title, desc, premium, delay }: {
  emoji: string; title: string; desc: string; premium?: boolean; delay: number;
}) {
  return (
    <motion.div
      variants={fadeUp(delay)} initial="hidden" whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      style={{
        background: 'white', borderRadius: 22, padding: '28px 22px',
        border: '1.5px solid #dcfce7', boxShadow: '0 4px 24px rgba(134,239,172,.12)',
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 12 }}>{emoji}</div>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#052e16', marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: '.88rem', color: '#4d7c5f', lineHeight: 1.65 }}>{desc}</p>
      {premium && (
        <span style={{
          display: 'inline-block', marginTop: 10,
          background: 'linear-gradient(135deg,#f7fee7,#ecfccb)',
          borderRadius: 50, padding: '3px 12px',
          fontSize: '.72rem', color: '#3f6212', fontWeight: 700,
          border: '1px solid #bef264',
        }}>⭐ Premium</span>
      )}
    </motion.div>
  );
}

/* ── Home ── */
const Home: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const router = useRouter() as any;
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  const btnGreen: React.CSSProperties = {
    display: 'inline-block',
    background: 'linear-gradient(135deg,#86efac,#22c55e,#15803d)',
    color: 'white', border: 'none', padding: '14px 36px', borderRadius: 50,
    fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(34,197,94,.35)',
    fontFamily: "'Nunito',sans-serif", transition: 'transform .3s, box-shadow .3s',
  };

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", background: '#f6fdf8', color: '#052e16', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Nunito:wght@300;400;600;700&display=swap');
        .pf { font-family: 'Playfair Display', Georgia, serif !important; }
        .btn-green:hover { transform: translateY(-3px); box-shadow: 0 14px 36px rgba(34,197,94,.55) !important; }
        .btn-teal:hover  { transform: translateY(-3px); box-shadow: 0 14px 36px rgba(45,212,191,.55) !important; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        background: 'rgba(246,253,248,0.95)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #dcfce7',
        padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 24 }}>🎓</span>
          <span className="pf" style={{
            fontSize: '1.1rem', fontWeight: 700,
            background: 'linear-gradient(90deg,#15803d,#2dd4bf)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>TerceirON</span>
        </div>
        <button onClick={() => router.push('/form')} className="btn-green"
          style={{ ...btnGreen, padding: '9px 16px', fontSize: '.78rem', whiteSpace: 'nowrap' }}>
          Criar a página
        </button>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{
        background: 'linear-gradient(155deg,#f0fdf4 0%,#dcfce7 30%,#ccfbf1 70%,#f0fdfa 100%)',
        padding: '80px 24px 64px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 340, height: 340, background: 'radial-gradient(circle,rgba(134,239,172,.35),transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 260, height: 260, background: 'radial-gradient(circle,rgba(45,212,191,.2),transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', left: '50%', width: 200, height: 200, background: 'radial-gradient(circle,rgba(190,242,100,.18),transparent 70%)', borderRadius: '50%', pointerEvents: 'none', transform: 'translate(-50%,-50%)' }} />

        <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 48, justifyContent: 'center', position: 'relative', zIndex: 1 }}>

          <motion.div variants={fadeLeft(0)} initial="hidden" animate="show" style={{ flex: '1 1 320px', maxWidth: 500 }}>
            <span style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)',
              borderRadius: 50, padding: '5px 18px',
              fontSize: '.82rem', color: '#15803d', fontWeight: 700, marginBottom: 18,
            }}>🎓 Exclusivo para o terceirão</span>

            <h1 className="pf" style={{ fontSize: 'clamp(2rem,5vw,3.1rem)', fontWeight: 700, lineHeight: 1.22, marginBottom: 18 }}>
              A Página{' '}
              <em style={{ color: '#15803d', fontStyle: 'italic' }}>Exclusiva</em>
              {' '}da Sua Turma
            </h1>

            <p style={{ fontSize: '1.05rem', color: '#4d7c5f', lineHeight: 1.75, marginBottom: 32 }}>
              Crie uma página linda com perfis, fotos, countdown da formatura e mural de recados.
              Um <strong style={{ color: '#15803d' }}>link único</strong> que fica vivo por anos.
            </p>

            <button onClick={() => router.push('/form')} className="btn-green"
              style={{ ...btnGreen, fontSize: '1.05rem', padding: '15px 32px' }}>
              Criar a página agora 🎓
            </button>
            <p style={{ fontSize: '.82rem', color: '#4d7c5f', marginTop: 12 }}>
              Pronto em menos de 10 minutos · Sem mensalidade
            </p>
          </motion.div>

          <motion.div variants={fadeRight(0.15)} initial="hidden" animate="show" style={{ flexShrink: 0 }}>
            <motion.div style={{ y: heroY }}>
              <PhoneMock />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section style={{ padding: '80px 24px', background: '#f6fdf8' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <motion.div variants={fadeUp(0)} initial="hidden" whileInView="show" viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{
              display: 'inline-block', background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)',
              borderRadius: 50, padding: '5px 18px', fontSize: '.82rem', color: '#15803d', fontWeight: 700, marginBottom: 14,
            }}>🪄 Simples assim</span>
            <h2 className="pf" style={{ fontSize: '2rem', color: '#052e16', fontWeight: 700 }}>Como Funciona?</h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(185px,1fr))', gap: 18 }}>
            <StepCard emoji="📋" num="1" title="Preencha tudo"  desc="O rep. da turma digita os dados, fotos e nomes de cada aluno no formulário." delay={0}   />
            <StepCard emoji="👀" num="2" title="Veja o preview" desc="Visualize como a página vai ficar antes de pagar. Sem surpresas."              delay={0.1} />
            <StepCard emoji="💳" num="3" title="Pague uma vez"  desc="Básico R$39 ou Premium R$79. Pagamento único, sem mensalidade."                 delay={0.2} />
            <StepCard emoji="🔗" num="4" title="Página no ar!"  desc="Link + QR Code prontos. Manda no grupo e cola no cartaz da formatura."          delay={0.3} />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '80px 24px', background: '#f6fdf8' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <motion.div variants={fadeUp(0)} initial="hidden" whileInView="show" viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{
              display: 'inline-block', background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)',
              borderRadius: 50, padding: '5px 18px', fontSize: '.82rem', color: '#15803d', fontWeight: 700, marginBottom: 14,
            }}>✨ O que tem na página</span>
            <h2 className="pf" style={{ fontSize: '2rem', color: '#052e16', fontWeight: 700 }}>Tudo que a turma merece</h2>
            <p style={{ color: '#4d7c5f', marginTop: 8, fontSize: '.95rem' }}>Uma página completa, bonita e permanente</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18 }}>
            <FeatCard emoji="⏳" title="Countdown da formatura"  desc="Contador ao vivo com dias, horas, minutos e segundos até o grande dia."                    delay={0}   />
            <FeatCard emoji="👥" title="Lista da turma"          desc="Nomes e apelidos de todos, com fotos coletivas da galera."                                   delay={0.1} />
            <FeatCard emoji="🖼️" title="Galeria de fotos"        desc="Carrossel com as melhores fotos da galera. Até 20 no básico, 50 no premium."                delay={0.2} />
            <FeatCard emoji="✍️" title="Mural de recados"        desc="Mensagens e votos para a turma ficarem eternizadas na página."                              delay={0}   />
            <FeatCard emoji="🎲" title="Curiosidades da turma"   desc="MVP da bagunça, quem dormiu mais, quem colou de quem — os rankings." premium              delay={0.1} />
            <FeatCard emoji="🎵" title="Música tema"             desc="A música que vai tocar quando alguém abrir a página da turma."        premium              delay={0.2} />
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(155deg,#f0fdf4,rgba(204,251,241,.4))' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <motion.div variants={fadeUp(0)} initial="hidden" whileInView="show" viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{
              display: 'inline-block', background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)',
              borderRadius: 50, padding: '5px 18px', fontSize: '.82rem', color: '#15803d', fontWeight: 700, marginBottom: 14,
            }}>💰 Investimento único</span>
            <h2 className="pf" style={{ fontSize: '2rem', color: '#052e16', fontWeight: 700 }}>Escolha seu Plano</h2>
            <p style={{ color: '#4d7c5f', marginTop: 8, fontSize: '.95rem' }}>Pague uma vez. A página fica no ar por anos.</p>
          </motion.div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>

            {/* Básico */}
            <motion.div
              variants={fadeUp(0)} initial="hidden" whileInView="show" viewport={{ once: true }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              style={{ flex: '1 1 280px', maxWidth: 340 }}
            >
              <div style={{
                background: 'white', borderRadius: 22, padding: '28px 22px',
                border: '1.5px solid #dcfce7', boxShadow: '0 4px 24px rgba(134,239,172,.15)',
              }}>
                <p style={{ fontSize: '.8rem', color: '#22c55e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Básico</p>
                <p className="pf" style={{ fontSize: '2.8rem', fontWeight: 700, color: '#052e16' }}>R$39</p>
                <p style={{ fontSize: '.82rem', color: '#4d7c5f', marginBottom: 4 }}>pagamento único · 1 ano online</p>
                <div style={{ height: 2, borderRadius: 2, margin: '14px 0 20px', background: 'linear-gradient(90deg,#dcfce7,#86efac)' }} />
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {([
                    [true,  '1 ano de acesso'],
                    [true,  'Até 20 fotos coletivas'],
                    [true,  'Countdown da formatura'],
                    [true,  'Lista + mural + galeria'],
                    [true,  'QR Code exclusivo'],
                    [false, 'Sem curiosidades'],
                    [false, 'Sem música tema'],
                  ] as [boolean, string][]).map(([ok, label]) => (
                    <li key={label} style={{ fontSize: '.93rem', display: 'flex', alignItems: 'center', gap: 6, color: ok ? '#374151' : '#9ca3af' }}>
                      <span style={{ color: ok ? '#4ade80' : '#f87171' }}>{ok ? '✓' : '✕'}</span> {label}
                    </li>
                  ))}
                </ul>
                <button onClick={() => router.push('/form?plano=basico')} className="btn-green"
                  style={{ ...btnGreen, width: '100%', marginTop: 24 }}>
                  Criar no básico 🎓
                </button>
              </div>
            </motion.div>

            {/* Premium */}
            <motion.div
              variants={fadeUp(0.1)} initial="hidden" whileInView="show" viewport={{ once: true }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              style={{ flex: '1 1 280px', maxWidth: 340, position: 'relative' }}
            >
              <div style={{
                background: 'white', borderRadius: 22, padding: '42px 22px 28px',
                position: 'relative', boxShadow: '0 8px 40px rgba(134,239,172,.25)',
              }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 22, padding: 2,
                  background: 'linear-gradient(135deg,#86efac,#2dd4bf,#bef264)',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor', maskComposite: 'exclude',
                  pointerEvents: 'none', opacity: 0.85,
                }} />
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg,#86efac,#2dd4bf)',
                  borderRadius: 50, padding: '4px 18px',
                  whiteSpace: 'nowrap', fontSize: '.76rem', fontWeight: 700, color: 'white',
                }}>⭐ Mais escolhido</div>
                <p style={{ fontSize: '.8rem', color: '#22c55e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Premium</p>
                <p className="pf" style={{ fontSize: '2.8rem', fontWeight: 700, color: '#052e16' }}>R$79</p>
                <p style={{ fontSize: '.82rem', color: '#4d7c5f', marginBottom: 4 }}>pagamento único · 3 anos online</p>
                <div style={{ height: 2, borderRadius: 2, margin: '14px 0 20px', background: 'linear-gradient(90deg,#86efac,#2dd4bf)' }} />
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    '3 anos de acesso',
                    'Até 50 fotos coletivas',
                    'Countdown da formatura',
                    'Lista + mural + galeria',
                    'QR Code exclusivo',
                    'Curiosidades da turma 🎲',
                    'Música tema 🎵',
                  ].map((f) => (
                    <li key={f} style={{ fontSize: '.93rem', display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
                      <span style={{ color: '#4ade80' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => router.push('/form?plano=premium')} className="btn-teal"
                  style={{
                    ...btnGreen,
                    background: 'linear-gradient(135deg,#a7f3d0,#2dd4bf,#0d9488)',
                    boxShadow: '0 8px 24px rgba(45,212,191,.35)',
                    width: '100%', marginTop: 24,
                  }}>
                  Quero o Premium ⭐
                </button>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '88px 24px', background: 'linear-gradient(135deg,#f0fdf4,#dcfce7,#ccfbf1)', textAlign: 'center' }}>
        <motion.div variants={fadeUp(0)} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ fontSize: 52, marginBottom: 18 }}>🎓</div>
          <h2 className="pf" style={{ fontSize: '1.9rem', fontWeight: 700, color: '#052e16', marginBottom: 14 }}>
            A turma merece<br />ser lembrada
          </h2>
          <p style={{ fontSize: '1rem', color: '#4d7c5f', lineHeight: 1.7, marginBottom: 30 }}>
            Crie agora a página da turma, compartilhe no grupo e cole o QR Code no cartaz da formatura.
          </p>
          <button onClick={() => router.push('/form')} className="btn-green"
            style={{ ...btnGreen, fontSize: '1rem', padding: '14px 36px' }}>
            Criar a página agora 🎓
          </button>
          <p style={{ marginTop: 14, fontSize: '.8rem', color: '#4d7c5f' }}>
            Pagamento seguro · Suporte em português
          </p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#052e16', padding: '44px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 30, marginBottom: 10 }}>🎓</div>
        <div className="pf" style={{
          fontSize: '1.25rem', fontWeight: 700, marginBottom: 8,
          background: 'linear-gradient(90deg,#86efac,#2dd4bf)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block',
        }}>terceirON</div>
        <p style={{ color: '#4d7c5f', fontSize: '.88rem', marginBottom: 20 }}>
          A página da sua turma — para sempre.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 18 }}>
          {[['Termos de uso', '/terms'], ['Privacidade', '/privacy']].map(([label, path]) => (
            <button key={path} onClick={() => router.push(path)}
              style={{
                background: 'none', border: 'none', color: '#4d7c5f',
                fontSize: '.83rem', cursor: 'pointer',
                fontFamily: "'Nunito',sans-serif", transition: 'color .2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#86efac')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4d7c5f')}
            >{label}</button>
          ))}
        </div>
        <p style={{ color: '#1a4a28', fontSize: '.75rem' }}>
          Copyright © 2026 terceirON · Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
};

export default Home;