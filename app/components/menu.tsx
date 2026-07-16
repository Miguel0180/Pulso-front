"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  Menu as MenuIcon,
  X,
  type LucideIcon,
} from "lucide-react";
import styles from "./menu.module.css";
import { useEmpresa, type Permissao } from "../context/EmpresaContext";
import {
  formatarHoraPonto,
  usePontoHoje,
} from "@/lib/ponto-hoje";

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Se omitido, item sempre aparece (ex.: Configurações). */
  permissoes?: Permissao[];
}

const navItems: NavItem[] = [
  {
    label: "Visão geral",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Colaboradores",
    path: "/colaboradores",
    icon: Users,
    permissoes: ["GERENCIAR_MEMBROS", "GERENCIAR_SETORES"],
  },
  {
    label: "Questionários",
    path: "/questionarios",
    icon: ClipboardList,
    permissoes: ["GERENCIAR_PESQUISAS", "RESPONDER_PESQUISAS"],
  },
  {
    label: "Ponto & Jornada",
    path: "/ponto-jornada",
    icon: Clock,
    permissoes: ["GERENCIAR_JORNADAS", "REGISTRAR_PONTO"],
  },
  {
    label: "Denúncias",
    path: "/denuncias",
    icon: AlertTriangle,
    permissoes: ["GERENCIAR_DENUNCIAS", "RESPONDER_DENUNCIAS"],
  },
  {
    label: "Avaliação de Risco",
    path: "/avaliacao-risco",
    icon: ShieldAlert,
    permissoes: ["GERENCIAR_EMPRESA", "GERENCIAR_MEMBROS"],
  },
  {
    label: "Recomendações",
    path: "/recomendacoes",
    icon: Sparkles,
    permissoes: ["GERENCIAR_EMPRESA", "GERENCIAR_MEMBROS"],
  },
  {
    label: "Configurações",
    path: "/configuracoes",
    icon: Settings,
  },
];

const STORAGE_KEY = "etico:menu-recolhido";
const MOBILE_MQ = "(max-width: 720px)";

export default function Menu() {
  const pathname = usePathname();
  const { id } = useParams();
  const empresaId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : undefined;
  const { temPermissao, carregandoPermissoes, empresa } = useEmpresa();
  const [recolhido, setRecolhido] = useState(false);
  const [mobileAberto, setMobileAberto] = useState(false);
  const [ehMobile, setEhMobile] = useState(false);

  const podeVerPonto = temPermissao("GERENCIAR_JORNADAS", "REGISTRAR_PONTO");
  const { ponto, totalFormatado, emAndamento } = usePontoHoje(
    podeVerPonto ? empresaId : undefined
  );

  useEffect(() => {
    const salvo = window.localStorage.getItem(STORAGE_KEY);
    if (salvo === "1") setRecolhido(true);

    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => {
      setEhMobile(mq.matches);
      if (mq.matches) setMobileAberto(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      ehMobile ? "0px" : recolhido ? "76px" : "248px"
    );
  }, [recolhido, ehMobile]);

  // Fecha o drawer ao navegar (mobile).
  useEffect(() => {
    setMobileAberto(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileAberto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileAberto(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileAberto]);

  function alternar() {
    setRecolhido((prev) => {
      const novo = !prev;
      window.localStorage.setItem(STORAGE_KEY, novo ? "1" : "0");
      return novo;
    });
  }

  const itensVisiveis = navItems.filter((item) => {
    if (!item.permissoes || item.permissoes.length === 0) return true;
    if (carregandoPermissoes && !empresa) return false;
    return temPermissao(...item.permissoes);
  });

  const recolhidoEfetivo = recolhido && !ehMobile;

  return (
    <>
      <button
        type="button"
        className={styles.mobileOpen}
        onClick={() => setMobileAberto(true)}
        aria-label="Abrir menu"
      >
        <MenuIcon size={20} />
      </button>

      {mobileAberto && (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Fechar menu"
          onClick={() => setMobileAberto(false)}
        />
      )}

      <aside
        className={[
          styles.sidebar,
          recolhidoEfetivo ? styles.sidebarCollapsed : "",
          mobileAberto ? styles.sidebarMobileOpen : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden={ehMobile && !mobileAberto ? true : undefined}
      >
        <div className={styles.toggleRow}>
          <button
            type="button"
            className={`${styles.toggleButton} ${styles.toggleDesktop}`}
            onClick={alternar}
            aria-label={recolhidoEfetivo ? "Expandir menu" : "Retrair menu"}
            title={recolhidoEfetivo ? "Expandir menu" : "Retrair menu"}
          >
            {recolhidoEfetivo ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>

          <button
            type="button"
            className={`${styles.toggleButton} ${styles.toggleMobileClose}`}
            onClick={() => setMobileAberto(false)}
            aria-label="Fechar menu"
          >
            <X size={17} />
          </button>

          <Link
            href="/inicio"
            className={styles.homeButton}
            title="Voltar para início"
            aria-label="Voltar para página de início"
          >
            <Home size={17} />
            <span className={styles.homeLabel}>Início</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          {itensVisiveis.map((item) => {
            const href = `/empresas/${id}${item.path}`;
            const isActive = pathname === href || pathname?.startsWith(`${href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                href={href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                title={recolhidoEfetivo ? item.label : undefined}
                onClick={() => setMobileAberto(false)}
              >
                <Icon size={17} className={styles.navIcon} />
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {podeVerPonto && (
          <div
            className={styles.pontoResumo}
            title={recolhidoEfetivo ? `Hoje: ${totalFormatado}` : undefined}
          >
            <div className={styles.pontoResumoTitulo}>
              <Clock size={14} />
              <span className={styles.pontoResumoTituloText}>Hoje</span>
            </div>
            <div className={styles.pontoResumoLinhas}>
              <div className={styles.pontoResumoLinha}>
                <span>Entrada</span>
                <strong>{formatarHoraPonto(ponto?.entrada ?? null)}</strong>
              </div>
              <div className={styles.pontoResumoLinha}>
                <span>Saída</span>
                <strong>{formatarHoraPonto(ponto?.saida ?? null)}</strong>
              </div>
              <div className={`${styles.pontoResumoLinha} ${styles.pontoResumoTotal}`}>
                <span>{emAndamento ? "Em andamento" : "Total"}</span>
                <strong>{totalFormatado}</strong>
              </div>
            </div>
          </div>
        )}

        <div className={styles.navFooter}>
          <span className={styles.navFooterText}>
            Dados sensíveis de saúde ocupacional.
            <br />
            Acesso restrito e auditado.
          </span>
        </div>
      </aside>
    </>
  );
}
