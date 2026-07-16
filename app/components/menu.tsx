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

export default function Menu() {
  const pathname = usePathname();
  const { id } = useParams();
  const empresaId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : undefined;
  const { temPermissao, carregandoPermissoes, empresa } = useEmpresa();
  const [recolhido, setRecolhido] = useState(false);

  const podeVerPonto = temPermissao("GERENCIAR_JORNADAS", "REGISTRAR_PONTO");
  const { ponto, totalFormatado, emAndamento } = usePontoHoje(
    podeVerPonto ? empresaId : undefined
  );

  useEffect(() => {
    const salvo = window.localStorage.getItem(STORAGE_KEY);
    if (salvo === "1") setRecolhido(true);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      recolhido ? "76px" : "248px"
    );
  }, [recolhido]);

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

  return (
    <aside className={`${styles.sidebar} ${recolhido ? styles.sidebarCollapsed : ""}`}>
      <div className={styles.toggleRow}>
        <button
          type="button"
          className={styles.toggleButton}
          onClick={alternar}
          aria-label={recolhido ? "Expandir menu" : "Retrair menu"}
          title={recolhido ? "Expandir menu" : "Retrair menu"}
        >
          {recolhido ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
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
              title={recolhido ? item.label : undefined}
            >
              <Icon size={17} className={styles.navIcon} />
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {podeVerPonto && (
        <div className={styles.pontoResumo} title={recolhido ? `Hoje: ${totalFormatado}` : undefined}>
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
  );
}
