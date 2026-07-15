"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./inicio.module.css";
import Header from "../../components/header";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "@/lib/api";

interface Empresa {
  id: string;
  nome: string;
  descricao?: string;
  papel?: string;
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
  const { token } = useAuth();
  const router = useRouter();

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregandoEmpresas, setCarregandoEmpresas] = useState(true);
  const [erroEmpresas, setErroEmpresas] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [entrandoComCodigo, setEntrandoComCodigo] = useState(false);
  const [erroCodigo, setErroCodigo] = useState("");

  useEffect(() => {
    carregarEmpresas();
  }, []);

  async function carregarEmpresas() {
    setCarregandoEmpresas(true);
    setErroEmpresas(null);

    try {
      const res = await fetch(`${API_URL}/api/empresas/minhas`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setErroEmpresas("Sua sessão expirou. Faça login novamente.");
        } else {
          setErroEmpresas("Não foi possível carregar suas empresas agora.");
        }
        setEmpresas([]);
        return;
      }

      const data = await res.json();
      const lista: Empresa[] = Array.isArray(data) ? data : data?.empresas ?? [];
      setEmpresas(lista);
    } catch {
      setErroEmpresas("Não foi possível conectar ao servidor. Verifique sua internet.");
      setEmpresas([]);
    } finally {
      setCarregandoEmpresas(false);
    }
  }

  // Mantém letras e números, sem forçar maiúsculo/minúsculo, sem hífen
  function formatarCodigo(valor: string) {
    return valor.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  }

  function fecharModal() {
    setModalAberto(false);
    setCodigo("");
    setErroCodigo("");
  }

  async function handleEntrarComCodigo(e: React.FormEvent) {
    e.preventDefault();
    const limpo = codigo.trim();

    if (limpo.length !== 8) {
      setErroCodigo("O código tem 8 caracteres. Confira e tente novamente.");
      return;
    }

    setErroCodigo("");
    setEntrandoComCodigo(true);

    try {
      const res = await fetch(`${API_URL}/api/empresas/entrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ codigo: limpo }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          setErroCodigo("Código inválido ou expirado.");
        } else if (res.status === 401 || res.status === 403) {
          setErroCodigo("Sua sessão expirou. Faça login novamente.");
        } else {
          setErroCodigo("Não foi possível entrar com esse código agora.");
        }
        setEntrandoComCodigo(false);
        return;
      }

      await carregarEmpresas();
      setEntrandoComCodigo(false);
      fecharModal();
    } catch {
      setErroCodigo("Não foi possível conectar ao servidor.");
      setEntrandoComCodigo(false);
    }
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

          {carregandoEmpresas ? (
            <div className={styles.empty}>
              <div className={styles.emptyTitle}>Carregando suas empresas...</div>
            </div>
          ) : erroEmpresas ? (
            <div className={styles.empty}>
              <div className={styles.emptyTitle}>{erroEmpresas}</div>
              <div className={styles.emptyBody}>
                <button type="button" className={styles.codeButton} onClick={carregarEmpresas}>
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : empresas.length === 0 ? (
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
                    {emp.papel && (
                      <span className={emp.papel === "Admin" ? styles.rolePillAdmin : styles.rolePillMember}>
                        {emp.papel}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className={styles.companyName}>{emp.nome}</div>
                    {emp.descricao && <div className={styles.companyMeta}>{emp.descricao}</div>}
                  </div>

                  <div className={styles.companyFooter}>
                    <Link href={`/empresas/${emp.id}/dashboard`} className={styles.enterButton}>
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
                  placeholder="Ex: AXOey8b2"
                  value={codigo}
                  onChange={(e) => setCodigo(formatarCodigo(e.target.value))}
                  maxLength={8}
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