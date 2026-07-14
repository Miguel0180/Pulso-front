"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./cadastro.module.css";
import { useTheme } from "../context/ThemeContext";
import { User, Mail, Lock, ArrowRight, Check } from "lucide-react";

const requisitos = [
  "Mínimo de 8 caracteres",
  "Uma letra maiúscula",
  "Um número ou símbolo",
];

function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" className={styles.brandMark} fill="none">
      <path
        d="M8 4H6a2 2 0 0 0-2 2v3M8 20H6a2 2 0 0 1-2-2v-3M4 12h14"
        stroke="var(--accent-violet)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CadastroPage() {
  const { tema } = useTheme();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [aceite, setAceite] = useState(false);

  return (
    <div className={styles.page} data-theme={tema}>
      <div className={styles.shell}>
        <div className={styles.brandRow}>
          <BrandMark />
          <span className={styles.brandName}>ÉTICO</span>
        </div>

        <div className={styles.card}>
          <h1 className={styles.title}>Criar sua conta</h1>
          <p className={styles.subtitle}>
            Leva menos de um minuto. Depois você cria sua empresa ou entra com um código.
          </p>

          <form className={styles.form}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Nome completo</span>
              <div className={styles.inputWrap}>
                <User size={15} className={styles.inputIcon} />
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className={styles.input}
                />
              </div>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>E-mail corporativo</span>
              <div className={styles.inputWrap}>
                <Mail size={15} className={styles.inputIcon} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                  className={styles.input}
                />
              </div>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Senha</span>
              <div className={styles.inputWrap}>
                <Lock size={15} className={styles.inputIcon} />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Crie uma senha forte"
                  className={styles.input}
                />
              </div>
            </label>

            <ul className={styles.requisitos}>
              {requisitos.map((r) => (
                <li key={r} className={styles.requisitoItem}>
                  <Check size={13} className={styles.requisitoIcon} /> {r}
                </li>
              ))}
            </ul>

            <label className={styles.termsRow}>
              <input
                type="checkbox"
                checked={aceite}
                onChange={(e) => setAceite(e.target.checked)}
                className={styles.checkbox}
              />
              <span>
                Concordo com os <Link href="#">Termos de Uso</Link> e a{" "}
                <Link href="#">Política de Privacidade</Link>.
              </span>
            </label>

            <Link href="/" className={styles.submitButton}>
              Criar conta <ArrowRight size={15} />
            </Link>
          </form>
        </div>

        <p className={styles.footerText}>
          Já tem uma conta? <Link href="/login">Fazer login</Link>
        </p>
      </div>
    </div>
  );
}