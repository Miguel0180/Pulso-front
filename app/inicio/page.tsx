"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./inicio.module.css";
import Header from "../components/header";
import { useTheme } from "../context/ThemeContext";

interface Empresa {
  id: string;
  nome: string;
  papel: "Admin" | "Membro";
  colaboradores: number;
  plano: string;
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

export default function Inicio() {
  const { tema, toggleTema } = useTheme();

  const [empresas, setEmpresas] = useState<Empresa[]>([
    { id: "e1", nome: "Grupo Vertente Comércio", papel: "Admin", colaboradores: 34, plano: "Plano Gestão" },
    { id: "e2", nome: "Studio Alba Serviços", papel: "Membro", colaboradores: 12, plano: "Plano Essencial" },
    { id: "e3", nome: "Nortis Alimentos", papel: "Membro", colaboradores: 58, plano: "Plano Gestão" },
  ]);

  const [modalAberto, setModalAberto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [entrandoComCodigo, setEntrandoComCodigo] = useState(false);
  const [erroCodigo, setErroCodigo] = useState("");

  function formatarCodigo(valor: string) {
    const limpo = valor.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
    if (limpo.length <= 4) return limpo;
    return `${limpo.slice(0, 4)}-${limpo.slice(4)}`;
  }

  function fecharModal() {
    setModalAberto(false);
    setCodigo("");
    setErroCodigo("");
  }

  function handleEntrarComCodigo(e: React.FormEvent) {
    e.preventDefault();
    const limpo = codigo.replace(/[^a-zA-Z0-9]/g, "");
    if (limpo.length < 6) {
      setErroCodigo("O código tem 8 caracteres. Confira e tente novamente.");
      return;
    }

    setErroCodigo("");
    setEntrandoComCodigo(true);
    setTimeout(() => {
      const nova: Empresa = {
        id: `e${Date.now()}`,
        nome: "Empresa via convite",
        papel: "Membro",
        colaboradores: 27,
        plano: "Plano Gestão",
      };
      setEmpresas((prev) => [nova, ...prev]);
      setEntrandoComCodigo(false);
      fecharModal();
    }, 600);
  }

  return (
    <div className={styles.page} data-theme={tema}>
      <main className={styles.shell}>
        <Header
          tema={tema}
          toggleTema={toggleTema}
          denunciasAbertas={0}
          actions={
            <>
              <Link href="/empresas/nova" className={styles.createButton}>
                Criar empresa
              </Link>
              <button type="button" className={styles.codeButton} onClick={() => setModalAberto(true)}>
                Entrar com código
              </button>
            </>
          }
        />

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <div className={styles.panelTitle}>Suas empresas</div>
              <div className={styles.panelHint}>Organizações em que você participa</div>
            </div>
          </div>

          {empresas.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyTitle}>Nenhuma empresa por aqui ainda</div>
              <div className={styles.emptyBody}>Crie uma empresa nova ou entre com um código de convite acima.</div>
            </div>
          ) : (
            <div className={styles.companyGrid}>
              {empresas.map((emp) => (
                <div className={styles.companyCard} key={emp.id}>
                  <div className={styles.companyCardTop}>
                    <div className={styles.companyAvatar}>{iniciais(emp.nome)}</div>
                    <span className={emp.papel === "Admin" ? styles.rolePillAdmin : styles.rolePillMember}>
                      {emp.papel}
                    </span>
                  </div>

                  <div>
                    <div className={styles.companyName}>{emp.nome}</div>
                    <div className={styles.companyMeta}>
                      {emp.colaboradores} colaboradores · {emp.plano}
                    </div>
                  </div>

                  <div className={styles.companyFooter}>
                    <Link href="/gestao" className={styles.enterButton}>
                      Entrar
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {modalAberto && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.panelTitle}>Entrar com código</div>
                <div className={styles.panelHint}>Use o código de convite enviado pela administração da empresa</div>
              </div>
              <button type="button" className={styles.modalClose} onClick={fecharModal} aria-label="Fechar">
                ✕
              </button>
            </div>

            <form className={styles.form} onSubmit={handleEntrarComCodigo}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Código de convite</span>
                <input
                  className={`${styles.input} ${styles.codeInput}`}
                  type="text"
                  placeholder="XXXX-XXXX"
                  value={codigo}
                  onChange={(e) => setCodigo(formatarCodigo(e.target.value))}
                  maxLength={9}
                  autoFocus
                />
              </label>

              {erroCodigo && <div className={styles.errorNote}>{erroCodigo}</div>}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={fecharModal}>
                  Cancelar
                </button>
                <button className={styles.secondaryButton} type="submit" disabled={entrandoComCodigo}>
                  {entrandoComCodigo ? "Verificando código..." : "Entrar com código"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}