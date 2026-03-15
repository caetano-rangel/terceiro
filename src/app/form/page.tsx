'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/* ── Tipos ── */
type Plano = 'basico' | 'premium';

type Aluno = { nome: string; apelido: string };

type Curiosidade = { categoria: string; resposta: string };

type FormData = {
  plano: Plano;
  // Turma
  nomeTurma: string;
  escola: string;
  cidade: string;
  dataFormatura: string;
  email: string;
  // Alunos
  alunos: Aluno[];
  // Mural
  mural: string;
  // Curiosidades (premium)
  curiosidades: Curiosidade[];
  // Música (premium)
  musicaUrl: string;
};

type FieldErrors = Partial<Record<string, string>>;

/* ── Curiosidades padrão ── */
const CURIOSIDADES_DEFAULT: Curiosidade[] = [
  { categoria: '😴 Quem dormiu mais na aula', resposta: '' },
  { categoria: '📋 MVP da bagunça', resposta: '' },
  { categoria: '🤫 Quem colou de quem', resposta: '' },
  { categoria: '📱 Viciado no celular', resposta: '' },
  { categoria: '🍕 Quem mais comia na aula', resposta: '' },
  { categoria: '🏆 O mais inteligente da turma', resposta: '' },
];

/* ── Compressão de imagem ── */
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const maxSize = 800;
    const quality = 0.7;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) { height = Math.round(height * maxSize / width); width = maxSize; }
        else { width = Math.round(width * maxSize / height); height = maxSize; }
      }
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file);
      }, 'image/jpeg', quality);
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
};

/* ── Componente Field ── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: '.92rem', fontWeight: 700, color: '#15803d', marginBottom: 2 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ color: '#ef4444', fontSize: '.78rem', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

/* ── Form principal ── */
const Form = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [formData, setFormData] = useState<FormData>({
    plano: 'basico',
    nomeTurma: '', escola: '', cidade: '', dataFormatura: '', email: '',
    alunos: [{ nome: '', apelido: '' }],
    mural: '',
    curiosidades: CURIOSIDADES_DEFAULT,
    musicaUrl: '',
  });

  useEffect(() => {
    const planoParam = searchParams.get('plano');
    if (planoParam === 'basico' || planoParam === 'premium') {
      setFormData(p => ({ ...p, plano: planoParam }));
    }
  }, [searchParams]);

  const maxFotos = formData.plano === 'premium' ? 50 : 20;

  /* ── Estilos ── */
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', marginTop: 8,
    background: 'white', color: '#052e16',
    border: '1.5px solid #dcfce7', borderRadius: 14,
    fontSize: '.97rem', fontFamily: "'Nunito',sans-serif",
    outline: 'none', transition: 'border-color .2s, box-shadow .2s',
  };
  const inputError: React.CSSProperties = { ...inputStyle, border: '1.5px solid #f87171' };
  const btnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg,#86efac,#22c55e,#15803d)',
    color: 'white', border: 'none', padding: '14px 0', borderRadius: 50,
    fontSize: '1rem', fontWeight: 700, cursor: 'pointer', width: '100%',
    boxShadow: '0 8px 24px rgba(34,197,94,.35)',
    fontFamily: "'Nunito',sans-serif", transition: 'transform .2s, box-shadow .2s',
  };

  /* ── Handlers ── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    setFieldErrors(p => ({ ...p, [name]: undefined }));
  };

  const handleAlunoChange = (i: number, field: keyof Aluno, value: string) => {
    setFormData(p => {
      const alunos = [...p.alunos];
      alunos[i] = { ...alunos[i], [field]: value };
      return { ...p, alunos };
    });
  };

  const addAluno = () => {
    setFormData(p => ({ ...p, alunos: [...p.alunos, { nome: '', apelido: '' }] }));
  };

  const removeAluno = (i: number) => {
    if (formData.alunos.length === 1) return;
    setFormData(p => ({ ...p, alunos: p.alunos.filter((_, idx) => idx !== i) }));
  };

  const handleCuriosidadeChange = (i: number, value: string) => {
    setFormData(p => {
      const curiosidades = [...p.curiosidades];
      curiosidades[i] = { ...curiosidades[i], resposta: value };
      return { ...p, curiosidades };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    if (selected.length > maxFotos) {
      setFileError(`Máximo de ${maxFotos} fotos para este plano.`);
      setFiles(null);
    } else {
      setFileError(null);
      setFiles(selected);
    }
  };

  /* ── Validação step 1 ── */
  const validateStep1 = () => {
    const errs: FieldErrors = {};
    if (!formData.nomeTurma)    errs.nomeTurma    = 'Campo obrigatório';
    if (!formData.escola)       errs.escola       = 'Campo obrigatório';
    if (!formData.dataFormatura) errs.dataFormatura = 'Campo obrigatório';
    if (!formData.email)        errs.email        = 'Campo obrigatório';
    const alunosValidos = formData.alunos.filter(a => a.nome.trim());
    if (alunosValidos.length === 0) errs.alunos = 'Adicione pelo menos 1 aluno';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length < 1) { setFileError('Envie pelo menos 1 foto.'); return; }

    const payload = new FormData();

    // dados básicos
    payload.append('plano',        formData.plano);
    payload.append('nomeTurma',    formData.nomeTurma);
    payload.append('escola',       formData.escola);
    payload.append('cidade',       formData.cidade);
    payload.append('dataFormatura', formData.dataFormatura);
    payload.append('email',        formData.email);
    payload.append('mural',        formData.mural);
    payload.append('alunos',       JSON.stringify(formData.alunos.filter(a => a.nome.trim())));

    if (formData.plano === 'premium') {
      payload.append('curiosidades', JSON.stringify(formData.curiosidades));
      payload.append('musicaUrl',    formData.musicaUrl);
    }

    // fotos comprimidas
    const compressed = await Promise.all(Array.from(files).map(compressImage));
    const totalSize = compressed.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > 4 * 1024 * 1024) {
      setFileError('Fotos muito grandes. Use fotos menores ou em menor quantidade.');
      return;
    }
    compressed.forEach(f => payload.append('fotos', f));

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/create-checkout', { method: 'POST', body: payload });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erro ao processar pedido. Tente novamente.\n\n' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro no checkout:', err);
      alert('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", background: '#f6fdf8', minHeight: '100vh', color: '#052e16', transition: 'background .4s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Nunito:wght@300;400;600;700&display=swap');
        .pf { font-family: 'Playfair Display', Georgia, serif !important; }
        input:focus, textarea:focus { border-color: #22c55e !important; box-shadow: 0 0 0 3px rgba(34,197,94,.15) !important; }
        .btn-green:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(34,197,94,.5) !important; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        background: 'rgba(246,253,248,.95)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #dcfce7',
        padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
          <span style={{ fontSize: 26 }}>🎓</span>
          <span className="pf" style={{
            fontSize: '1.3rem', fontWeight: 700,
            background: 'linear-gradient(90deg,#15803d,#2dd4bf)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Terceirão.app</span>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: step >= s
                  ? 'linear-gradient(135deg,#86efac,#22c55e,#15803d)'
                  : '#dcfce7',
                color: step >= s ? 'white' : '#15803d',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '.8rem', fontWeight: 700,
                boxShadow: step >= s ? '0 4px 12px rgba(34,197,94,.35)' : 'none',
                transition: 'all .3s',
              }}>{s}</div>
              {s < 2 && (
                <div style={{
                  width: 24, height: 2,
                  background: step > 1 ? '#22c55e' : '#dcfce7',
                  borderRadius: 2, transition: 'background .3s',
                }} />
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(155deg,#f0fdf4 0%,#dcfce7 50%,#f0fdfa 100%)',
        padding: '48px 24px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, background: 'radial-gradient(circle,rgba(134,239,172,.3),transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, background: 'radial-gradient(circle,rgba(45,212,191,.18),transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <span style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)',
          borderRadius: 50, padding: '5px 18px', fontSize: '.8rem',
          color: '#15803d', fontWeight: 700, marginBottom: 14,
        }}>
          {step === 1 ? '🎓 Dados da turma' : '📸 Fotos & extras'}
        </span>

        <h1 className="pf" style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 700, lineHeight: 1.25, color: '#052e16' }}>
          {step === 1
            ? <><em style={{ color: '#15803d', fontStyle: 'italic' }}>Configure</em> a página</>
            : <>Quase lá! <em style={{ color: '#15803d', fontStyle: 'italic' }}>Adicione as fotos</em></>
          }
        </h1>
      </div>

      {/* ── FORM ── */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px 64px' }}>
        <form onSubmit={handleSubmit} noValidate>

          {/* ═══ STEP 1 ═══ */}
          <div style={{ display: step === 1 ? 'block' : 'none' }}>

            {/* Seletor de plano */}
            <div style={{
              background: 'white', borderRadius: 20, padding: 6,
              border: '1.5px solid #dcfce7', boxShadow: '0 4px 20px rgba(134,239,172,.15)',
              display: 'flex', marginBottom: 28,
            }}>
              {(['basico', 'premium'] as Plano[]).map(p => (
                <button key={p} type="button"
                  onClick={() => setFormData(d => ({ ...d, plano: p }))}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: 14, border: 'none',
                    cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
                    fontWeight: 700, fontSize: '.82rem', lineHeight: 1.4,
                    transition: 'all .25s',
                    background: formData.plano === p
                      ? 'linear-gradient(135deg,#86efac,#22c55e,#15803d)'
                      : 'transparent',
                    color: formData.plano === p ? 'white' : '#4d7c5f',
                    boxShadow: formData.plano === p ? '0 4px 14px rgba(34,197,94,.3)' : 'none',
                  }}
                >
                  {p === 'basico'
                    ? <>Básico · 20 fotos<br />1 ano · R$39</>
                    : <>Premium · 50 fotos<br />Música + curiosidades · R$79 ⭐</>
                  }
                </button>
              ))}
            </div>

            {/* Dados da turma */}
            <div style={{
              background: 'white', borderRadius: 20, padding: '28px 24px',
              border: '1.5px solid #dcfce7', boxShadow: '0 4px 20px rgba(134,239,172,.12)',
              marginBottom: 20,
            }}>
              <Field label="Nome da turma 🎓" error={fieldErrors.nomeTurma}>
                <input type="text" name="nomeTurma" value={formData.nomeTurma} onChange={handleChange}
                  placeholder="Ex: 3º B — 2025"
                  style={fieldErrors.nomeTurma ? inputError : inputStyle} />
              </Field>
              <Field label="Escola 🏫" error={fieldErrors.escola}>
                <input type="text" name="escola" value={formData.escola} onChange={handleChange}
                  placeholder="Colégio Estadual Silva Jardim"
                  style={fieldErrors.escola ? inputError : inputStyle} />
              </Field>
              <Field label="Cidade 📍">
                <input type="text" name="cidade" value={formData.cidade} onChange={handleChange}
                  placeholder="São Paulo — SP"
                  style={inputStyle} />
              </Field>
              <Field label="Data da formatura 🎉" error={fieldErrors.dataFormatura}>
                <input type="date" name="dataFormatura" value={formData.dataFormatura} onChange={handleChange}
                  style={fieldErrors.dataFormatura ? inputError : inputStyle} />
              </Field>
              <Field label="Email para receber o link 📧" error={fieldErrors.email}>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="email@exemplo.com"
                  style={fieldErrors.email ? inputError : inputStyle} />
              </Field>
            </div>

            {/* Alunos */}
            <div style={{
              background: 'white', borderRadius: 20, padding: '28px 24px',
              border: fieldErrors.alunos ? '1.5px solid #f87171' : '1.5px solid #dcfce7',
              boxShadow: '0 4px 20px rgba(134,239,172,.12)',
              marginBottom: 20,
            }}>
              <p style={{ fontSize: '.92rem', fontWeight: 700, color: '#15803d', marginBottom: 16 }}>
                Alunos da turma 👥
              </p>
              <p style={{ fontSize: '.82rem', color: '#4d7c5f', marginBottom: 20, lineHeight: 1.5 }}>
                Nome completo e apelido de cada aluno. Aparecerão listados na página.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {formData.alunos.map((aluno, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text" placeholder={`Nome ${i + 1}`}
                        value={aluno.nome}
                        onChange={e => handleAlunoChange(i, 'nome', e.target.value)}
                        style={{ ...inputStyle, marginTop: 0 }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text" placeholder="Apelido"
                        value={aluno.apelido}
                        onChange={e => handleAlunoChange(i, 'apelido', e.target.value)}
                        style={{ ...inputStyle, marginTop: 0 }}
                      />
                    </div>
                    {formData.alunos.length > 1 && (
                      <button type="button" onClick={() => removeAluno(i)}
                        style={{
                          background: '#fef2f2', border: '1px solid #fecaca',
                          borderRadius: 10, padding: '12px 10px', cursor: 'pointer',
                          color: '#f87171', fontSize: '.82rem', fontWeight: 700,
                          fontFamily: "'Nunito',sans-serif", flexShrink: 0, marginTop: 0,
                        }}>✕</button>
                    )}
                  </div>
                ))}
              </div>

              {fieldErrors.alunos && (
                <p style={{ color: '#ef4444', fontSize: '.78rem', marginTop: 8 }}>{fieldErrors.alunos}</p>
              )}

              <button type="button" onClick={addAluno}
                style={{
                  marginTop: 16, width: '100%', padding: '12px',
                  background: '#f0fdf4', border: '1.5px dashed #86efac',
                  borderRadius: 14, cursor: 'pointer', color: '#15803d',
                  fontSize: '.88rem', fontWeight: 700,
                  fontFamily: "'Nunito',sans-serif", transition: 'background .2s',
                }}>
                + Adicionar aluno
              </button>
            </div>

            <button type="button" className="btn-green"
              onClick={() => { if (validateStep1()) setStep(2); }}
              style={btnStyle}>
              Continuar →
            </button>
          </div>

          {/* ═══ STEP 2 ═══ */}
          <div style={{ display: step === 2 ? 'block' : 'none' }}>

            {/* Upload de fotos */}
            <div style={{
              background: 'white', borderRadius: 20, padding: '28px 24px',
              border: fileError ? '1.5px solid #f87171' : '1.5px solid #dcfce7',
              boxShadow: '0 4px 20px rgba(134,239,172,.12)', marginBottom: 20,
            }}>
              <p style={{ fontSize: '.92rem', fontWeight: 700, color: '#15803d', marginBottom: 12 }}>
                Fotos da galera 📷
              </p>
              <label htmlFor="fotos-input" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: '28px 16px', borderRadius: 14, cursor: 'pointer',
                border: '2px dashed #86efac', background: 'rgba(220,252,231,.25)',
                transition: 'border-color .2s',
              }}>
                <span style={{ fontSize: '2.2rem' }}>🖼️</span>
                <p style={{ color: '#15803d', fontWeight: 700, fontSize: '.9rem', textAlign: 'center' }}>
                  Clique para selecionar fotos
                </p>
                <p style={{ color: '#4d7c5f', fontSize: '.78rem', textAlign: 'center' }}>
                  Mínimo 1 · Máximo {maxFotos} fotos
                </p>
                {files && files.length > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)',
                    borderRadius: 50, padding: '4px 16px', fontSize: '.8rem', fontWeight: 700, color: '#15803d',
                  }}>
                    {files.length} foto{files.length > 1 ? 's' : ''} selecionada{files.length > 1 ? 's' : ''} ✓
                  </div>
                )}
              </label>
              <input id="fotos-input" type="file" name="fotos" accept="image/*" multiple
                onChange={handleFileChange} style={{ display: 'none' }} />
              {fileError && <p style={{ color: '#ef4444', fontSize: '.78rem', marginTop: 8 }}>{fileError}</p>}
            </div>

            {/* Mural de recados */}
            <div style={{
              background: 'white', borderRadius: 20, padding: '28px 24px',
              border: '1.5px solid #dcfce7', boxShadow: '0 4px 20px rgba(134,239,172,.12)',
              marginBottom: 20,
            }}>
              <Field label="Mural de recados ✍️">
                <textarea name="mural" value={formData.mural} onChange={handleChange}
                  placeholder="Escreva uma mensagem coletiva da turma, votos para o futuro, um grito de guerra... 💚"
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 120 } as React.CSSProperties}
                />
              </Field>
            </div>

            {/* Curiosidades — só premium */}
            {formData.plano === 'premium' && (
              <div style={{
                background: 'white', borderRadius: 20, padding: '28px 24px',
                border: '1.5px solid #dcfce7', boxShadow: '0 4px 20px rgba(134,239,172,.12)',
                marginBottom: 20,
              }}>
                <p style={{ fontSize: '.92rem', fontWeight: 700, color: '#15803d', marginBottom: 6 }}>
                  Curiosidades da turma 🎲
                </p>
                <p style={{ fontSize: '.82rem', color: '#4d7c5f', marginBottom: 20, lineHeight: 1.5 }}>
                  Preencha os rankings — quem foi quem na turma.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {formData.curiosidades.map((c, i) => (
                    <div key={i}>
                      <label style={{ fontSize: '.88rem', fontWeight: 700, color: '#15803d' }}>
                        {c.categoria}
                      </label>
                      <input
                        type="text"
                        placeholder="Nome do aluno"
                        value={c.resposta}
                        onChange={e => handleCuriosidadeChange(i, e.target.value)}
                        style={{ ...inputStyle }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Música tema — só premium */}
            {formData.plano === 'premium' && (
              <div style={{
                background: 'white', borderRadius: 20, padding: '28px 24px',
                border: '1.5px solid #dcfce7', boxShadow: '0 4px 20px rgba(134,239,172,.12)',
                marginBottom: 20,
              }}>
                <Field label="Música tema 🎵">
                  <input type="url" name="musicaUrl" value={formData.musicaUrl} onChange={handleChange}
                    placeholder="Cole o link do YouTube da música da turma"
                    style={inputStyle} />
                </Field>
                <p style={{ fontSize: '.78rem', color: '#4d7c5f', marginTop: 4 }}>
                  Toca automaticamente quando alguém abre a página.
                </p>
              </div>
            )}

            {/* Resumo */}
            <div style={{
              background: 'linear-gradient(135deg,rgba(220,252,231,.8),rgba(204,251,241,.8))',
              borderRadius: 16, padding: '16px 20px', marginBottom: 24,
              border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ fontSize: '1.8rem' }}>🎓</span>
              <div>
                <p style={{ fontWeight: 700, color: '#15803d', fontSize: '.9rem' }}>
                  {formData.nomeTurma || 'Sua turma'} · Plano {formData.plano === 'premium' ? 'Premium' : 'Básico'}
                </p>
                <p style={{ color: '#4d7c5f', fontSize: '.8rem' }}>
                  {formData.plano === 'premium'
                    ? '3 anos · 50 fotos · Música · Curiosidades · R$79'
                    : '1 ano · 20 fotos · R$39'
                  }
                </p>
              </div>
              <button type="button" onClick={() => setStep(1)}
                style={{
                  marginLeft: 'auto', background: 'none', border: 'none',
                  color: '#4d7c5f', fontSize: '.78rem', cursor: 'pointer',
                  fontFamily: "'Nunito',sans-serif",
                }}>Alterar</button>
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setStep(1)}
                style={{
                  flex: '0 0 auto', padding: '14px 22px', borderRadius: 50,
                  background: 'white', border: '1.5px solid #86efac',
                  color: '#15803d', fontWeight: 700, fontSize: '.9rem',
                  cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
                }}>
                ← Voltar
              </button>
              <button type="submit" className="btn-green" style={btnStyle} disabled={isSubmitting}>
                {isSubmitting
                  ? <svg style={{ width: 24, height: 24, animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <circle cx="12" cy="12" r="10" strokeOpacity=".25" />
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                    </svg>
                  : 'Criar a página! 🎓'
                }
              </button>
            </div>
          </div>

        </form>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#052e16', padding: '36px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>🎓</div>
        <div className="pf" style={{
          background: 'linear-gradient(90deg,#86efac,#2dd4bf)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontSize: '1.1rem', fontWeight: 700, marginBottom: 6,
        }}>Terceirão.app</div>
        <p style={{ color: '#4d7c5f', fontSize: '.82rem', marginBottom: 16 }}>
          A página da sua turma — para sempre.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 14 }}>
          {[['Termos de uso', '/terms'], ['Privacidade', '/privacy']].map(([label, path]) => (
            <button key={path} onClick={() => router.push(path)}
              style={{
                background: 'none', border: 'none', color: '#4d7c5f',
                fontSize: '.8rem', cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
                transition: 'color .2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#86efac')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4d7c5f')}
            >{label}</button>
          ))}
        </div>
        <p style={{ color: '#1a4a28', fontSize: '.72rem' }}>
          Copyright © 2025 Terceirão.app · Todos os direitos reservados
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </footer>
    </div>
  );
};

const FormPage = () => (
  <Suspense fallback={
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f6fdf8' }}>
      <p style={{ color: '#15803d', fontFamily: 'Nunito,sans-serif' }}>Carregando...</p>
    </div>
  }>
    <Form />
  </Suspense>
);

export default FormPage;