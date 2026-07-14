"use client";

import Image from "next/image";
import styles from "./header.module.css";
import ButtonTheme from "./button-theme";

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
  // Slot opcional para ações extras (ex: botões específicos de uma página),
  // renderizado à esquerda do grupo padrão (tema / notificações / usuário).
  // Não é usado na página de gestão, então nada muda lá.
  actions?: React.ReactNode;
}

export default function Header({ tema, toggleTema, denunciasAbertas, actions }: HeaderProps) {
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

        <div className={styles.userChip}>
          <div className={styles.avatar}>MM</div>
          <div>
            <div className={styles.userName}>Miguel Macedo</div>
            <div className={styles.userRole}>Gerente</div>
          </div>
        </div>
      </div>
    </header>
  );
}