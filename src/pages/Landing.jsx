import {
  LogIn,
  Upload,
  FolderOpen,
  BrainCircuit,
  MessageSquareText,
  CheckCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import styles from './Landing.module.css'

export default function Landing({ onEnter }) {
  return (
    <div className={styles.page}>

      <div className={styles.glowCenter} />
      <div className={styles.glowRight} />

      {/* Header */}
      <header className={styles.header}>
        <button onClick={onEnter} className={styles.loginLink}>
          <span className={styles.loginIconWrap}>
            <LogIn size={20} />
          </span>
          <span className={styles.loginText}>Entrar</span>
        </button>

        <div className={styles.brand}>
          <BrainCircuit size={28} className={styles.brandIcon} />
          <span className={styles.brandName}>Studium</span>
        </div>

        <div className={styles.headerSpacer} />
      </header>

      {/* Hero */}
      <main className={styles.hero}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Sua nova forma de estudar com IA
        </div>

        <h1 className={styles.title}>
          Estude menos, <br className={styles.brDesktop} />
          <span className={styles.titleGradient}>entenda muito mais.</span>
        </h1>

        <p className={styles.subtitle}>
          Organize suas aulas em PDF por matéria, gere resumos automáticos e tire dúvidas direto com a IA sobre cada material. O conhecimento que você precisa, na velocidade que você quer.
        </p>

        <div className={styles.ctaRow}>
          <button onClick={onEnter} className={styles.ctaButton}>
            <Upload size={20} />
            Upload do primeiro PDF
          </button>
        </div>
      </main>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <div className={styles.featuresHead}>
            <h2 className={styles.featuresTitle}>Leitura Dinâmica e Ativa</h2>
            <p className={styles.featuresSubtitle}>
              Não é apenas armazenamento de PDFs. A IA do Studium interage com o material para garantir seu aprendizado.
            </p>
          </div>

          <div className={styles.grid}>
            <FeatureCard
              icon={<FolderOpen className={styles.iconLavender} />}
              title="Organização por Matérias"
              description="Mantenha seus estudos estruturados. Separe seus PDFs e anotações em pastas e disciplinas para fácil acesso."
            />
            <FeatureCard
              icon={<BrainCircuit className={styles.iconPink} />}
              title="Resumos Gerados por IA"
              description="Extraia os pontos chave de textos longos instantaneamente. Notas criadas automaticamente baseadas no conteúdo da sua aula."
            />
            <FeatureCard
              icon={<MessageSquareText className={styles.iconViolet} />}
              title="Chat com o Material"
              description="Ficou com dúvida? Pergunte diretamente ao PDF. A IA responde baseada no contexto do arquivo atual."
            />
            <FeatureCard
              icon={<CheckCircle className={styles.iconBlush} />}
              title="Quizzes Automáticos"
              description="Teste o que você aprendeu. A plataforma gera questionários sobre a aula para fixar o conhecimento."
            />
            <FeatureCard
              icon={<TrendingUp className={styles.iconLavender} />}
              title="Progresso por PDF"
              description="Acompanhe seu domínio (%). Veja visualmente o quanto você já absorveu de cada material de estudo."
            />

            <div className={styles.demoCard}>
              <div className={styles.demoIconWrap}>
                <Upload size={32} />
              </div>
              <h3 className={styles.demoTitle}>Pronto para começar?</h3>
              <p className={styles.demoText}>Faça upload agora e veja a mágica acontecer.</p>
              <button onClick={onEnter} className={styles.demoLink}>
                Testar agora <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© 2024 Studium. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIconWrap}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
    </div>
  )
}
