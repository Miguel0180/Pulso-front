"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation"; // ← adicionar useParams
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
} from "lucide-react";
import styles from "./menu.module.css";

const navItems = [
  { label: "Visão geral", path: "/dashboard", icon: LayoutDashboard },
  { label: "Colaboradores", path: "/colaboradores", icon: Users },
  { label: "Questionários", path: "/questionarios", icon: ClipboardList },
  { label: "Ponto & Jornada", path: "/ponto-jornada", icon: Clock },
  { label: "Denúncias", path: "/denuncias", icon: AlertTriangle },
  { label: "Avaliação de Risco", path: "/avaliacao-risco", icon: ShieldAlert },
  { label: "Recomendações IA", path: "/recomendacoes-ia", icon: Sparkles },
  { label: "Configurações", path: "/configuracoes", icon: Settings },
];

const STORAGE_KEY = "etico:menu-recolhido";

export default function Menu() {
  const pathname = usePathname();
  const { id } = useParams(); // ← pega o id da empresa da URL atual
  const [recolhido, setRecolhido] = useState(false);

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
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const href = `/empresas/${id}${item.path}`; // ← monta o link com o id
          const isActive = pathname === href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
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