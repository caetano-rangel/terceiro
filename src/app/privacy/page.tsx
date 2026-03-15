'use client';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const router = useRouter() as any;

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", background: '#f6fdf8', minHeight: '100vh', color: '#052e16' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito:wght@300;400;600;700&display=swap');
        .pf { font-family: 'Playfair Display', Georgia, serif !important; }
      `}</style>

      {/* Nav */}
      <nav style={{
        background: 'rgba(246,253,248,.95)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #dcfce7', padding: '14px 32px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <button onClick={() => router.push('/')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 9,
          fontFamily: "'Nunito',sans-serif",
        }}>
          <span style={{ fontSize: 24 }}>🎓</span>
          <span className="pf" style={{
            fontSize: '1.2rem', fontWeight: 700,
            background: 'linear-gradient(90deg,#15803d,#2dd4bf)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>terceirON</span>
        </button>
        <span style={{ color: '#86efac', fontSize: '1rem' }}>›</span>
        <span style={{ fontSize: '.88rem', color: '#4d7c5f' }}>Política de privacidade</span>
      </nav>

      {/* Conteúdo */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px 80px' }}>

        <h1 className="pf" style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 700, marginBottom: 8, lineHeight: 1.2 }}>
          Política de Privacidade
        </h1>
        <p style={{ fontSize: '.88rem', color: '#4d7c5f', marginBottom: 48 }}>
          Última atualização: janeiro de 2025
        </p>

        {[
          {
            titulo: '1. Informações que coletamos',
            texto: 'Coletamos as informações fornecidas voluntariamente no formulário de criação da página: nome da turma, escola, cidade, data da formatura, e-mail do representante, nomes e apelidos dos alunos, fotos coletivas, mural de recados, curiosidades da turma e link de música (para o plano Premium). Também coletamos dados de pagamento processados de forma segura pelo Stripe — não armazenamos dados de cartão de crédito em nossos servidores.',
          },
          {
            titulo: '2. Como usamos suas informações',
            texto: 'Utilizamos as informações coletadas exclusivamente para: criar e exibir a página da turma; enviar o e-mail de confirmação com o link da página; processar o pagamento com segurança; e melhorar nosso serviço. Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing.',
          },
          {
            titulo: '3. Fotos e imagens',
            texto: 'As fotos enviadas são armazenadas de forma segura no Supabase Storage e utilizadas exclusivamente para exibição na página da turma. Ao enviar fotos, você declara ter autorização das pessoas retratadas para publicação. Não utilizamos as imagens para nenhuma outra finalidade.',
          },
          {
            titulo: '4. Compartilhamento de dados',
            texto: 'Compartilhamos dados apenas com provedores de serviço essenciais para o funcionamento da plataforma: Stripe (processamento de pagamentos), Supabase (banco de dados e armazenamento de arquivos) e Resend (envio de e-mails transacionais). Todos os provedores seguem rigorosas políticas de privacidade e segurança.',
          },
          {
            titulo: '5. Armazenamento e segurança',
            texto: 'Seus dados são armazenados em servidores seguros com criptografia em trânsito (HTTPS) e em repouso. Adotamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado, perda ou alteração.',
          },
          {
            titulo: '6. Retenção de dados',
            texto: 'Os dados da turma são mantidos pelo período contratado — 1 ano no Plano Básico e 3 anos no Plano Premium. Após o vencimento, os dados e as fotos são excluídos permanentemente de nossos servidores. O e-mail do representante pode ser mantido por até 6 meses após o vencimento para fins de suporte.',
          },
          {
            titulo: '7. Seus direitos (LGPD)',
            texto: 'Em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), você tem direito a: acessar os dados que temos sobre você; corrigir dados incorretos; solicitar a exclusão antecipada dos dados; e revogar o consentimento. Para exercer esses direitos, entre em contato pelo e-mail contato@terceirao.app.',
          },
          {
            titulo: '8. Cookies',
            texto: 'Utilizamos apenas cookies essenciais para o funcionamento da plataforma, como manutenção de sessão. Não utilizamos cookies de rastreamento ou publicidade.',
          },
          {
            titulo: '9. Menores de idade',
            texto: 'Nossa plataforma é voltada para alunos do terceiro ano do ensino médio. As informações dos alunos são inseridas pelo representante da turma, que é responsável por obter as devidas autorizações dos alunos e, quando necessário, de seus responsáveis legais.',
          },
          {
            titulo: '10. Alterações nesta política',
            texto: 'Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças relevantes por e-mail. A data de última atualização sempre estará indicada no topo desta página.',
          },
          {
            titulo: '11. Contato',
            texto: 'Para dúvidas sobre privacidade ou para exercer seus direitos, entre em contato pelo e-mail contato@terceirao.app. Nosso encarregado de dados (DPO) responderá em até 15 dias úteis.',
          },
        ].map(({ titulo, texto }) => (
          <div key={titulo} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#15803d', marginBottom: 10 }}>
              {titulo}
            </h2>
            <p style={{ fontSize: '.95rem', color: '#4d7c5f', lineHeight: 1.8 }}>
              {texto}
            </p>
          </div>
        ))}

        <div style={{
          marginTop: 48, padding: '20px 24px',
          background: 'linear-gradient(135deg,#dcfce7,#ccfbf1)',
          borderRadius: 16, border: '1px solid #86efac',
        }}>
          <p style={{ fontSize: '.88rem', color: '#15803d', fontWeight: 700, marginBottom: 4 }}>
            Dúvidas sobre privacidade?
          </p>
          <p style={{ fontSize: '.85rem', color: '#4d7c5f', margin: 0 }}>
            Entre em contato pelo e-mail{' '}
            <a href="mailto:contato@terceirao.app" style={{ color: '#15803d', fontWeight: 700 }}>
              contato@terceirao.app
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#052e16', padding: '28px 24px', textAlign: 'center' }}>
        <p style={{ color: '#4d7c5f', fontSize: '.75rem' }}>
          © 2026 terceirON · Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}