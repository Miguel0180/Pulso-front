"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MessageCircleWarning,
  ShieldAlert,
  Clock,
  Sparkles,
  ClipboardList,
  Smartphone,
} from "lucide-react";
import styles from "./landing.module.css";

const features = [
  {
    icon: ClipboardList,
    title: "Questionários de pulso",
    body: "Pesquisas curtas por setor. O colaborador responde em minutos; o RH vê o clima em tempo quase real.",
  },
  {
    icon: MessageCircleWarning,
    title: "Canal de denúncias",
    body: "Relatos anônimos de assédio, sobrecarga e outros riscos, com trilha para acompanhar cada caso.",
  },
  {
    icon: Clock,
    title: "Ponto & jornada",
    body: "Registro de entrada e saída com foto, além do total de horas do dia — cruzado com bem-estar.",
  },
  {
    icon: ShieldAlert,
    title: "Avaliação de risco",
    body: "Mapa de risco psicossocial por setor, com score, tendência e estado (estável, atenção ou crítico).",
  },
  {
    icon: Sparkles,
    title: "Recomendações",
    body: "Ações sugeridas a partir dos dados, priorizadas por urgência para o RH saber por onde começar.",
  },
  {
    icon: Smartphone,
    title: "App do colaborador",
    body: "Check-in de humor, ponto, questionários e denúncias no celular — sem depender só do painel web.",
  },
];

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
      <header className={styles.nav}>
        <div className={styles.navBrand}>
          <Image src="/logo-black.png" alt="Pulso Ético" width={100} height={28} priority />
        </div>
        <nav className={styles.navLinks}>
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#mobile">App mobile</a>
        </nav>
        <div className={styles.navActions}>
          <Link href="/login" className={styles.navLogin}>
            Entrar
          </Link>
          <Link href="/cadastro" className={styles.navCta}>
            Criar conta
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroBrand}>Pulso Ético</div>
        <h1 className={styles.heroTitle}>Risco psicossocial sob controle.</h1>
        <p className={styles.heroSubtitle}>
          Questionários, denúncias, ponto e recomendações num só lugar — para o RH agir
          antes que o risco vire passivo.
        </p>
        <div className={styles.heroActions}>
          <Link href="/cadastro" className={styles.primaryButton}>
            Começar agora
          </Link>
          <a href="#funcionalidades" className={styles.secondaryLink}>
            Ver funcionalidades
          </a>
        </div>

        <div className={styles.heroVisual}>
          <PulseHero />
          <div className={styles.heroVisualLabels}>
            <span>Risco crítico</span>
            <span>Estável</span>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className={styles.features}>
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>Funcionalidades</span>
          <h2 className={styles.sectionTitle}>O que você usa de verdade</h2>
          <p className={styles.sectionLead}>
            Só o que está no produto hoje — painel web e app do colaborador.
          </p>
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

      <section id="mobile" className={styles.mobileSection}>
        <div className={styles.mobileInner}>
          <div className={styles.mobileCopy}>
            <span className={styles.eyebrow}>App mobile</span>
            <h2 className={styles.mobileTitle}>O pulso da equipe no bolso.</h2>
            <p className={styles.mobileBody}>
              Colaboradores acompanham a visão geral, respondem questionários, batem ponto
              e registram denúncias direto no celular — com a mesma linguagem do painel.
            </p>
            <ul className={styles.mobileList}>
              <li>Dashboard de bem-estar e alertas</li>
              <li>Status dos setores em tempo real</li>
              <li>Fluxos rápidos para o dia a dia</li>
            </ul>
            <Link href="/cadastro" className={styles.primaryButton}>
              Criar conta
            </Link>
          </div>

          <div className={styles.mobileVisual}>
            <div className={styles.mobileGlow} aria-hidden />
            <div className={styles.phoneFrame}>
              <Image
                src="/mobile.webp"
                alt="Tela do app Pulso Ético no celular mostrando o dashboard de bem-estar"
                width={390}
                height={844}
                className={styles.phoneImage}
                sizes="(max-width: 720px) 260px, 320px"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <h2 className={styles.finalCtaTitle}>Pronto para colocar o Ético a trabalhar?</h2>
        <Link href="/cadastro" className={styles.primaryButton}>
          Criar conta
        </Link>
        <p className={styles.finalCtaNote}>Já tem acesso? <Link href="/login">Entrar</Link></p>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Image src="/logo-black.png" alt="Pulso Ético" width={90} height={26} />
          <p className={styles.footerTag}>Gestão de riscos psicossociais para empresas brasileiras.</p>
        </div>

        <div className={styles.footerCols}>
          <div className={styles.footerCol}>
            <span className={styles.footerColTitle}>Produto</span>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#mobile">App mobile</a>
          </div>
          <div className={styles.footerCol}>
            <span className={styles.footerColTitle}>Conta</span>
            <Link href="/login">Entrar</Link>
            <Link href="/cadastro">Criar conta</Link>
          </div>
        </div>

        <div className={styles.footerBottom}>
          © {new Date().getFullYear()} Pulso Ético. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
