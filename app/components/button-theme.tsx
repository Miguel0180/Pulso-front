"use client";

// 👇 O segredo está nesta linha: importar o CSS correto onde a classe .iconButton existe
import styles from "./header.module.css";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.3M12 19.2v2.3M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7Z" />
    </svg>
  );
}

interface ButtonThemeProps {
  tema: "claro" | "escuro";
  onClick: () => void;
}

export default function ButtonTheme({ tema, onClick }: ButtonThemeProps) {
  return (
    <button
      type="button"
      className={styles.iconButton}
      onClick={onClick}
      aria-label={tema === "claro" ? "Ativar modo escuro" : "Ativar modo claro"}
      title={tema === "claro" ? "Modo escuro" : "Modo claro"}
    >
      {tema === "claro" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}