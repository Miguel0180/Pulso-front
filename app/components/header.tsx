"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./header.module.css";
import ButtonTheme from "./button-theme";
import { useAuth } from "../context/AuthContext";
import { LogOut, ChevronDown } from "lucide-react";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8.5a6 6 0 0 0-12 0c0 4.2-1.2 6-2 6.8-.3.3-.1.7.3.7h15.4c.4 0 .6-.4.3-.7-.8-.8-2-2.6-2-6.8Z" />
      <path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

interface HeaderProps {
  tema: "claro" | "escuro";
  toggleTema: () => void;
  denunciasAbertas: number;
  actions?: React.ReactNode;
}

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Header({ tema, toggleTema, denunciasAbertas, actions }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [menuAberto, setMenuAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const nome = user?.nome ?? "Usuário";

  // Fecha o dropdown ao clicar fora dele
  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  async function handleSair() {
    setSaindo(true);
    await logout();
    router.push("/login");
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.headerLogoBox}>
        <Image
          src="/logo.png"
          alt="Ético"
          fill
          sizes="160px"
          className={styles.headerLogo}
          priority
        />
      </div>

      <div className={styles.topbarActions}>
        {actions}
        {actions && <div className={styles.actionDivider} />}

        <ButtonTheme tema={tema} onClick={toggleTema} />

        <button type="button" className={styles.iconButton} aria-label="Notificações" title="Notificações">
          <BellIcon />
          {denunciasAbertas > 0 && <span className={styles.alertDot} />}
        </button>

        <div className={styles.actionDivider} />

        <div className={styles.userMenu} ref={menuRef}>
          <button
            type="button"
            className={styles.userChip}
            onClick={() => setMenuAberto((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuAberto}
          >
            <div className={styles.avatar}>{iniciais(nome)}</div>
            <div className={styles.userName}>{nome}</div>
            <ChevronDown size={14} className={styles.userChevron} />
          </button>

          {menuAberto && (
            <div className={styles.userDropdown} role="menu">
              <button
                type="button"
                className={styles.userDropdownItem}
                onClick={handleSair}
                disabled={saindo}
                role="menuitem"
              >
                <LogOut size={15} />
                {saindo ? "Saindo..." : "Sair"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}