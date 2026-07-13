"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./menu.module.css";

function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" className={styles.brandMark} fill="none">
      <path
        d="M2 17h5l2.5-7 4 14 3-17 2.5 10H30"
        stroke="#c9bdf0"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Mapeamos os itens com seus respectivos caminhos (paths) das pastas
const navItems = [
  { label: "Visão geral", path: "/dashboard" },
  { label: "Colaboradores", path: "/colaboradores" },
  { label: "Questionários", path: "/questionarios" },
  { label: "Ponto & Jornada", path: "/ponto-jornada" },
  { label: "Denúncias", path: "/denuncias" },
  { label: "Avaliação de Risco", path: "/avaliacao-risco" },
  { label: "Recomendações IA", path: "/recomendacoes-ia" },
  { label: "Configurações", path: "/configuracoes" },
];

export default function Menu() {
  const pathname = usePathname(); // Pega a URL atual do navegador

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <BrandMark />
        <div className={styles.brandText}>
          <span className={styles.brandName}>Pulso Ético</span>
          <span className={styles.brandSub}>Gestão NR-1</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          // Verifica se a rota atual começa com o path do item para mantê-lo ativo
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.label}
              href={item.path}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className={styles.navFooter}>
        Dados sensíveis de saúde ocupacional.
        <br />
        Acesso restrito e auditado.
      </div>
    </aside>
  );
}