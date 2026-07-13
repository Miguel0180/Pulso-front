"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./nova-empresa.module.css";
import { useTheme } from "../../context/ThemeContext";

const SEGMENTOS = ["Comércio", "Serviços", "Indústria", "Tecnologia", "Saúde", "Educação", "Outro"];
const TAMANHOS = ["1 a 10 pessoas", "11 a 50 pessoas", "51 a 200 pessoas", "Mais de 200 pessoas"];

export default function NovaEmpresa() {
  const { tema } = useTheme();
  const router = useRouter();

  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [segmento, setSegmento] = useState(SEGMENTOS[0]);
  const [tamanho, setTamanho] = useState(TAMANHOS[0]);
  const [cnpj, setCnpj] = useState("");
  const [criando, setCriando] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeEmpresa.trim()) return;

    setCriando(true);
    setTimeout(() => {
      // Aqui entraria a chamada real para criar a empresa (API / backend).
      router.push("/inicio");
    }, 700);
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
              <span className={styles.fieldLabel}>CNPJ (opcional)</span>
              <input
                className={`${styles.input} ${styles.mono}`}
                type="text"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
              />
            </label>

            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Segmento</span>
                <select className={styles.select} value={segmento} onChange={(e) => setSegmento(e.target.value)}>
                  {SEGMENTOS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Tamanho da equipe</span>
                <select className={styles.select} value={tamanho} onChange={(e) => setTamanho(e.target.value)}>
                  {TAMANHOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>

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