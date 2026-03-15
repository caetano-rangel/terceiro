'use client';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
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
          }}>Terceirão.app</span>
        </button>
        <span style={{ color: '#86efac', fontSize: '1rem' }}>›</span>
        <span style={{ fontSize: '.88rem', color: '#4d7c5f' }}>Termos de uso</span>
      </nav>

      {/* Conteúdo */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px 80px' }}>

        <h1 className="pf" style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 700, marginBottom: 8, lineHeight: 1.2 }}>
          Termos de Uso
        </h1>
        <p style={{ fontSize: '.88rem', color: '#4d7c5f', marginBottom: 48 }}>
          Última atualização: janeiro de 2025
        </p>

        {[
          {
            titulo: '1. Aceitação dos termos',
            texto: 'Ao utilizar o Terceirão.app, você concorda com estes Termos de Uso. Se não concordar com algum ponto, por favor, não utilize nosso serviço. O uso continuado da plataforma implica aceitação integral destes termos.',
          },
          {
            titulo: '2. Descrição do serviço',
            texto: 'O Terceirão.app é uma plataforma que permite a criação de uma página digital personalizada para turmas do terceiro ano do ensino médio. O representante da turma preenche o formulário, realiza o pagamento único e recebe um link exclusivo com QR Code para compartilhar com a turma.',
          },
          {
            titulo: '3. Cadastro e responsabilidades',
            texto: 'O representante da turma é responsável por todas as informações fornecidas no formulário, incluindo nomes de alunos, fotos e demais conteúdos. Ao submeter o formulário, você declara ter autorização dos envolvidos para publicar seus dados e imagens na página.',
          },
          {
            titulo: '4. Pagamento e planos',
            texto: 'O serviço é oferecido mediante pagamento único, sem cobranças recorrentes. O Plano Básico garante 1 (um) ano de acesso à página online. O Plano Premium garante 3 (três) anos de acesso, além de funcionalidades adicionais como curiosidades da turma e música tema. Não realizamos reembolsos após a publicação da página.',
          },
          {
            titulo: '5. Conteúdo publicado',
            texto: 'Você é o único responsável pelo conteúdo enviado. É proibido publicar conteúdo ofensivo, discriminatório, ilegal ou que viole direitos de terceiros. O Terceirão.app se reserva o direito de remover páginas que violem estas diretrizes sem aviso prévio e sem direito a reembolso.',
          },
          {
            titulo: '6. Propriedade intelectual',
            texto: 'A plataforma Terceirão.app, incluindo seu design, código e marca, são de propriedade exclusiva dos seus criadores. O conteúdo enviado pelo usuário (fotos, textos) permanece de propriedade do usuário, que concede ao Terceirão.app uma licença limitada para exibição na página criada.',
          },
          {
            titulo: '7. Disponibilidade',
            texto: 'Nos esforçamos para manter a plataforma disponível 24 horas por dia, 7 dias por semana. No entanto, não garantimos disponibilidade ininterrupta e não nos responsabilizamos por eventuais indisponibilidades técnicas temporárias.',
          },
          {
            titulo: '8. Encerramento',
            texto: 'Ao término do prazo contratado (1 ou 3 anos), a página será removida automaticamente. Não há renovação automática. Caso deseje manter a página, entre em contato antes do vencimento.',
          },
          {
            titulo: '9. Alterações nos termos',
            texto: 'Podemos atualizar estes termos periodicamente. Alterações significativas serão comunicadas por e-mail. O uso continuado após a notificação implica aceitação dos novos termos.',
          },
          {
            titulo: '10. Contato',
            texto: 'Para dúvidas, solicitações ou reclamações, entre em contato pelo e-mail contato@terceirao.app. Responderemos em até 3 dias úteis.',
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
          <p style={{ fontSize: '.88rem', color: '#15803d', fontWeight: 700, marginBottom: 4 }}>Dúvidas?</p>
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
          © 2026 Terceirão.app · Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}