"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

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
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [manterConectado, setManterConectado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!email || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }

    setCarregando(true);

    const resultado = await login({ email, senha }, manterConectado);

    if (!resultado.ok) {
      setErro(resultado.erro ?? "Não foi possível entrar agora.");
      setCarregando(false);
      return;
    }

    if (resultado.precisaVerificacao) {
      router.push(`/verificar-codigo?email=${encodeURIComponent(email)}`);
      return;
    }

    router.push("/inicio");
  }

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

          <form className={styles.form} onSubmit={handleSubmit}>
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
                  autoComplete="email"
                  required
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
                  autoComplete="current-password"
                  required
                />
              </div>
            </label>

            {erro && <p className={styles.errorText}>{erro}</p>}

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={manterConectado}
                onChange={(e) => setManterConectado(e.target.checked)}
              />
              Manter conectado
            </label>
            <p className={styles.deviceHint}>
              Neste dispositivo, após verificar o e-mail uma vez, o login fica confiável por até 90 dias.
            </p>

            <button type="submit" className={styles.submitButton} disabled={carregando}>
              {carregando ? (
                <>
                  <Loader2 size={15} className={styles.spinner} /> Entrando...
                </>
              ) : (
                <>
                  Entrar <ArrowRight size={15} />
                </>
              )}
            </button>
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