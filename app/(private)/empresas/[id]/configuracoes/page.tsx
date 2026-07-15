"use client";

import Sidebar from "../../../../components/menu";
import Header from "../../../../components/header";
import { useTheme } from "../../../../context/ThemeContext";
import { useAccessibility, type TamanhoFonte } from "../../../../context/AccessibilityContext";

import pageStyles from "../dashboard/gestao.module.css";
import styles from "./configuracoes.module.css";

const OPCOES_FONTE: { valor: TamanhoFonte; label: string }[] = [
  { valor: "normal", label: "Normal" },
  { valor: "grande", label: "Grande" },
  { valor: "extra", label: "Extra grande" },
];

export default function ConfiguracoesPage() {
  const { tema, toggleTema } = useTheme();
  const { fonte, setFonte, libras, setLibras } = useAccessibility();

  return (
    <div className={pageStyles.page} data-theme={tema}>
      <Sidebar />

      <main className={pageStyles.main}>
        <Header tema={tema} toggleTema={toggleTema} denunciasAbertas={0} />

        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Configurações</h2>
          <p className={styles.sectionSubtitle}>
            Ajuste acessibilidade e aparência. Preferências ficam salvas neste navegador.
          </p>
        </div>

        <section className={styles.panel} aria-labelledby="acessibilidade-titulo">
          <h3 id="acessibilidade-titulo" className={styles.panelTitulo}>
            Acessibilidade
          </h3>
          <p className={styles.panelHint}>
            Recursos para leitura, navegação por teclado e tradução em Libras.
          </p>

          <div className={styles.grupo}>
            <span className={styles.label} id="fonte-label">
              Tamanho da fonte
            </span>
            <div className={styles.opcoes} role="group" aria-labelledby="fonte-label">
              {OPCOES_FONTE.map((op) => (
                <button
                  key={op.valor}
                  type="button"
                  className={`${styles.opcaoBtn} ${fonte === op.valor ? styles.opcaoAtiva : ""}`}
                  aria-pressed={fonte === op.valor}
                  onClick={() => setFonte(op.valor)}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.grupo}>
            <div className={styles.switchRow}>
              <div className={styles.switchTexto}>
                <p className={styles.switchTitulo}>Tradução em Libras (VLibras)</p>
                <p className={styles.switchDesc}>
                  Ativa o tradutor oficial do governo federal para conteúdo em Libras.
                </p>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={libras}
                  onChange={(e) => setLibras(e.target.checked)}
                  aria-label="Ativar tradução em Libras"
                />
                <span className={styles.slider} />
              </label>
            </div>
          </div>

          <p className={styles.dicaTab}>
            Navegação por teclado: use <kbd className={styles.kbd}>Tab</kbd> e{" "}
            <kbd className={styles.kbd}>Shift+Tab</kbd> para mover o foco.{" "}
            <kbd className={styles.kbd}>Enter</kbd> ou{" "}
            <kbd className={styles.kbd}>Espaço</kbd> ativa botões e links. No início da página,
            o atalho &quot;Ir para o conteúdo&quot; aparece ao focar com Tab.
          </p>
        </section>

        <section className={styles.panel} aria-labelledby="aparencia-titulo">
          <h3 id="aparencia-titulo" className={styles.panelTitulo}>
            Aparência
          </h3>
          <p className={styles.panelHint}>Escolha o tema visual do painel.</p>

          <div className={styles.grupo}>
            <span className={styles.label} id="tema-label">
              Tema
            </span>
            <div className={styles.opcoes} role="group" aria-labelledby="tema-label">
              <button
                type="button"
                className={`${styles.opcaoBtn} ${tema === "claro" ? styles.opcaoAtiva : ""}`}
                aria-pressed={tema === "claro"}
                onClick={() => {
                  if (tema !== "claro") toggleTema();
                }}
              >
                Claro
              </button>
              <button
                type="button"
                className={`${styles.opcaoBtn} ${tema === "escuro" ? styles.opcaoAtiva : ""}`}
                aria-pressed={tema === "escuro"}
                onClick={() => {
                  if (tema !== "escuro") toggleTema();
                }}
              >
                Escuro
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
