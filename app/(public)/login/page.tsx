"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./login.module.css";
import { useTheme } from "../context/ThemeContext";
import { Mail, Lock, ArrowRight } from "lucide-react";

function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" className={styles.brandMark} fill="none">
      <path
        d="M2 17h5l2.5-7 4 14 3-17 2.5 10H30"
        stroke="#6d28d9"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { tema } = useTheme();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  return (
    <div className={styles.page} data-theme={tema}>
      <div className={styles.shell}>
        <div className={styles.brandRow}>
          <BrandMark />
          <span className={styles.brandName}>Pulso Ético</span>
        </div>

        <div className={styles.card}>
          <h1 className={styles.title}>Entrar na sua conta</h1>
          <p className={styles.subtitle}>
            Acesse o painel de gestão de riscos psicossociais da sua empresa.
          </p>

          <form className={styles.form}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>E-mail</span>
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
              <div className={styles.fieldTop}>
                <span className={styles.fieldLabel}>Senha</span>
                <Link href="#" className={styles.forgotLink}>
                  Esqueceu a senha?
                </Link>
              </div>
              <div className={styles.inputWrap}>
                <Lock size={15} className={styles.inputIcon} />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className={styles.input}
                />
              </div>
            </label>

            <label className={styles.checkboxRow}>
              <input type="checkbox" className={styles.checkbox} />
              Manter conectado por 30 dias
            </label>

            <Link href="/dashboard" className={styles.submitButton}>
              Entrar <ArrowRight size={15} />
            </Link>
          </form>
        </div>

        <p className={styles.footerText}>
          Ainda não tem uma conta? <Link href="/cadastro">Cadastre-se</Link>
        </p>
        <p className={styles.footerText}>
          Quer criar ou entrar em uma empresa? <Link href="/">Voltar ao início</Link>
        </p>
      </div>
    </div>
  );
}