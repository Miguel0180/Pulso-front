"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./nova-empresa.module.css";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { API_URL } from "@/lib/api";

export default function NovaEmpresa() {
  const { tema } = useTheme();
  const { token } = useAuth();
  const router = useRouter();

  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [descricao, setDescricao] = useState("");
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!nomeEmpresa.trim()) return;

    setCriando(true);

    try {
      const res = await fetch(`${API_URL}/api/empresas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nome: nomeEmpresa,
          descricao,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setErro("Sua sessão expirou. Faça login novamente.");
        } else {
          setErro("Não foi possível criar a empresa agora. Tente novamente.");
        }
        setCriando(false);
        return;
      }

      router.push("/inicio");
    } catch {
      setErro("Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.");
      setCriando(false);
    }
  }

  return (
    <div className={styles.page} data-theme={tema}>
      <div className={styles.shell}>
        <Link href="/inicio" className={styles.backLink}>
          ← Voltar para início
        </Link>

        <section className={styles.hero}>
          <div className={styles.heroTag}>Nova organização</div>
          <h1 className={styles.heroTitle}>Vamos criar sua empresa.</h1>
          <p className={styles.heroSub}>
            Essas informações ajudam a configurar o painel de gestão. Você poderá alterá-las depois, a qualquer momento.
          </p>
        </section>

        <div className={styles.panel}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Nome da empresa</span>
              <input
                className={styles.input}
                type="text"
                placeholder="Ex: Comércio Aurora Ltda."
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                required
                autoFocus
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Descrição</span>
              <textarea
                className={styles.input}
                placeholder="Conte um pouco sobre a empresa, ramo de atuação, etc."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
              />
            </label>

            {erro && <p className={styles.errorText}>{erro}</p>}

            <div className={styles.actions}>
              <Link href="/inicio" className={styles.cancelButton}>
                Cancelar
              </Link>
              <button className={styles.primaryButton} type="submit" disabled={criando}>
                {criando ? "Criando empresa..." : "Criar empresa"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}