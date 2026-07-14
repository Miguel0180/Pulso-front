"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MessageCircleWarning,
  LineChart,
  Clock,
  Sparkles,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import styles from "./landing.module.css";

const features = [
  {
    icon: ClipboardList,
    title: "Escuta contínua",
    body: "Questionários de pulso curtos e recorrentes, por setor, que os colaboradores respondem em menos de 2 minutos.",
  },
  {
    icon: MessageCircleWarning,
    title: "Canal de denúncias",
    body: "Relatos de assédio, sobrecarga e outros riscos chegam de forma anônima e ficam registrados para acompanhamento.",
  },
  {
    icon: LineChart,
    title: "Mapa de risco por setor",
    body: "Score, tendência e estado — estável, atenção ou crítico — de cada área da empresa, atualizados em tempo real.",
  },
  {
    icon: Clock,
    title: "Ponto & jornada",
    body: "Cruze horas trabalhadas com os indicadores de bem-estar para encontrar sobrecarga antes que vire afastamento.",
  },
  {
    icon: Sparkles,
    title: "Recomendações da IA",
    body: "Ações sugeridas a partir dos dados, priorizadas por urgência — para o RH saber por onde começar.",
  },
  {
    icon: ShieldCheck,
    title: "Trilha de auditoria",
    body: "Histórico completo de questionários, denúncias e ações tomadas, pronto para quando o auditor perguntar.",
  },
];

const steps = [
  {
    numero: "01",
    titulo: "Ouça",
    corpo: "Ative questionários de pulso e o canal de denúncias anônimo em todos os setores da empresa.",
  },
  {
    numero: "02",
    titulo: "Meça",
    corpo: "Acompanhe o score de bem-estar por setor e por colaborador, com alertas quando algo sai do esperado.",
  },
  {
    numero: "03",
    titulo: "Aja",
    corpo: "Receba recomendações priorizadas, decida o próximo passo e registre o que foi feito — com evidência.",
  },
];

const stats = [
  { valor: "2 min", label: "tempo médio para responder um questionário de pulso" },
  { valor: "100%", label: "das denúncias chegam sem identificação, por padrão" },
  { valor: "Setor a setor", label: "visão granular, não só um número único da empresa" },
];

// Coordenadas do "pulso" — mesma lógica de traçado usada no sparkline do dashboard,
// só que aqui ele anima de um estado crítico para um estado estável, em loop.
const PULSE_CHAOS = "M0,70 L112.5,116 L225,34 L337.5,122 L450,28 L562.5,112 L675,38 L787.5,96 L900,58";
const PULSE_CALM = "M0,70 L112.5,64 L225,73 L337.5,62 L450,72 L562.5,63 L675,71 L787.5,65 L900,69";

function PulseHero() {
  const [animar, setAnimar] = useState(true);

  useEffect(() => {
    const prefereReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setAnimar(!prefereReduzido);
  }, []);

  return (
    <svg viewBox="0 0 900 140" className={styles.pulseSvg} preserveAspectRatio="none" aria-hidden="true">
      <path
        d={animar ? PULSE_CHAOS : PULSE_CALM}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={animar ? "#dc2626" : "#16a34a"}
      >
        {animar && (
          <>
            <animate
              attributeName="d"
              values={`${PULSE_CHAOS};${PULSE_CALM};${PULSE_CHAOS}`}
              keyTimes="0;0.5;1"
              dur="8s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            />
            <animate
              attributeName="stroke"
              values="#dc2626;#16a34a;#dc2626"
              keyTimes="0;0.5;1"
              dur="8s"
              repeatCount="indefinite"
            />
          </>
        )}
      </path>
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className={styles.page}>
      {/* -------------------------------- Navegação -------------------------------- */}
      <header className={styles.nav}>
        <div className={styles.navBrand}>
          <Image src="/logo.png" alt="Ético" width={100} height={28} priority />
        </div>
        <nav className={styles.navLinks}>
          <a href="#produto">Produto</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#planos">Planos</a>
        </nav>
        <div className={styles.navActions}>
          <Link href="/login" className={styles.navLogin}>
            Entrar
          </Link>
          <Link href="/cadastro" className={styles.navCta}>
            Agendar demonstração
          </Link>
        </div>
      </header>

      {/* ----------------------------------- Hero ----------------------------------- */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Gestão de riscos psicossociais · NR-1</span>
          <h1 className={styles.heroTitle}>Transforme escuta em ação.</h1>
          <p className={styles.heroSubtitle}>
            Ético reúne questionários de pulso, denúncias anônimas e dados de jornada num
            só painel — para o RH enxergar o risco antes que ele vire passivo trabalhista.
          </p>
          <div className={styles.heroActions}>
            <Link href="/cadastro" className={styles.primaryButton}>
              Agendar demonstração
            </Link>
            <a href="#como-funciona" className={styles.secondaryLink}>
              Ver como funciona ↓
            </a>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <PulseHero />
          <div className={styles.heroVisualLabels}>
            <span>Risco crítico</span>
            <span>Estável</span>
          </div>
        </div>
      </section>

      {/* --------------------------------- Contexto --------------------------------- */}
      <section className={styles.context}>
        <p className={styles.contextText}>
          Desde a atualização da NR-1, empresas brasileiras precisam identificar, avaliar e
          agir sobre riscos psicossociais no ambiente de trabalho — com evidências, não só
          boas intenções. Ético é onde essa evidência mora.
        </p>
      </section>

      {/* --------------------------------- Produto ---------------------------------- */}
      <section id="produto" className={styles.features}>
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>O que o Ético faz por você</span>
          <h2 className={styles.sectionTitle}>Tudo que o RH precisa num só lugar</h2>
        </div>

        <div className={styles.featureGrid}>
          {features.map((f) => (
            <div className={styles.featureCard} key={f.title}>
              <div className={styles.featureIcon}>
                <f.icon size={18} />
              </div>
              <div className={styles.featureTitle}>{f.title}</div>
              <p className={styles.featureBody}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------ Como funciona -------------------------------- */}
      <section id="como-funciona" className={styles.howItWorks}>
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>Como funciona</span>
          <h2 className={styles.sectionTitle}>Três passos, um ciclo contínuo</h2>
        </div>

        <div className={styles.stepsRow}>
          {steps.map((s, i) => (
            <div className={styles.stepCard} key={s.numero}>
              <span className={styles.stepNumber}>{s.numero}</span>
              <div className={styles.stepTitle}>{s.titulo}</div>
              <p className={styles.stepBody}>{s.corpo}</p>
              {i < steps.length - 1 && <span className={styles.stepArrow}>→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------- Stats ----------------------------------- */}
      <section className={styles.statsBand}>
        <div className={styles.statsGrid}>
          {stats.map((s) => (
            <div className={styles.statItem} key={s.label}>
              <div className={styles.statValue}>{s.valor}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------- Depoimento --------------------------------- */}
      <section className={styles.testimonial}>
        <p className={styles.testimonialQuote}>
          "Antes a gente só descobria que um setor estava no limite quando alguém pedia
          demissão. Hoje o alerta chega semanas antes, com dados pra sustentar a conversa
          com a liderança."
        </p>
        <div className={styles.testimonialAuthor}>
          <div className={styles.testimonialAvatar}>LF</div>
          <div>
            <div className={styles.testimonialName}>Luana Ferraz</div>
            <div className={styles.testimonialRole}>Gerente de Gente & Cultura, empresa de varejo</div>
          </div>
        </div>
      </section>

      {/* ------------------------------------ CTA ------------------------------------- */}
      <section className={styles.finalCta}>
        <h2 className={styles.finalCtaTitle}>
          Pronto para enxergar o que os números não contam sozinhos?
        </h2>
        <Link href="/cadastro" className={styles.primaryButton}>
          Agendar demonstração
        </Link>
        <p className={styles.finalCtaNote}>Sem cartão de crédito. Resposta em 1 dia útil.</p>
      </section>

      {/* ----------------------------------- Footer ------------------------------------ */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Image src="/logo.png" alt="Ético" width={90} height={26} />
          <p className={styles.footerTag}>Gestão de riscos psicossociais para empresas brasileiras.</p>
        </div>

        <div className={styles.footerCols}>
          <div className={styles.footerCol}>
            <span className={styles.footerColTitle}>Produto</span>
            <a href="#produto">Recursos</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#planos">Planos</a>
          </div>
          <div className={styles.footerCol}>
            <span className={styles.footerColTitle}>Empresa</span>
            <Link href="/login">Entrar</Link>
            <Link href="/cadastro">Criar conta</Link>
          </div>
          <div className={styles.footerCol}>
            <span className={styles.footerColTitle}>Legal</span>
            <a href="#">Privacidade (LGPD)</a>
            <a href="#">Termos de uso</a>
          </div>
        </div>

        <div className={styles.footerBottom}>© {new Date().getFullYear()} Ético. Todos os direitos reservados.</div>
      </footer>
    </div>
  );
}