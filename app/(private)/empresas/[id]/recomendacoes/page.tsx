"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Sidebar from "../../../../components/menu";
import Header from "../../../../components/header";
import { useTheme } from "../../../../context/ThemeContext";
import { useAuth } from "../../../../context/AuthContext";
import { API_URL } from "@/lib/api";
import { Sparkles, Check } from "lucide-react";

import pageStyles from "../dashboard/gestao.module.css";
import styles from "./recomendacoes.module.css";

/* ---------------- Tipos ---------------- */

interface Setor {
  id: number;
  nome: string;
}

interface Recomendacao {
  id: number;
  mensagem: string;
  tipo: string;
  reconhecida: boolean;
  criadoEm: string;
}

const TIPO_LABEL: Record<string, string> = {
  REDUZIR_HORAS_EXTRAS: "Reduzir horas extras",
  REDISTRIBUIR_TAREFAS: "Redistribuir tarefas",
  CONVERSA_COM_EQUIPE: "Conversa com a equipe",
  APOIO_PSICOLOGICO: "Apoio psicológico",
  TREINAMENTO_LIDERANCA: "Treinamento de liderança",
};

/* ---------------- Helpers ---------------- */

function formatarData(iso?: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function rotuloTipo(tipo: string) {
  return TIPO_LABEL[tipo] ?? tipo?.replace(/_/g, " ") ?? "Recomendação";
}

function extrairMensagemErro(corpo: string, fallback: string) {
  try {
    const json = JSON.parse(corpo);
    if (json?.mensagem) return json.mensagem;
    return fallback;
  } catch {
    return fallback;
  }
}

/* ---------------- Admin: recomendações por setor ---------------- */

function GestaoRecomendacoes({
  empresaId,
  token,
}: {
  empresaId: string;
  token: string | null;
}) {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [setorId, setSetorId] = useState<string>("");
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[]>([]);
  const [carregandoSetores, setCarregandoSetores] = useState(true);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [acessoNegado, setAcessoNegado] = useState(false);
  const [reconhecendoId, setReconhecendoId] = useState<number | null>(null);

  const headers = useCallback(
    () => ({ ...(token ? { Authorization: `Bearer ${token}` } : {}) }),
    [token]
  );

  useEffect(() => {
    async function buscarSetores() {
      if (!empresaId) return;
      try {
        setCarregandoSetores(true);
        const res = await fetch(`${API_URL}/api/empresas/${empresaId}/setores`, {
          headers: headers(),
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setAcessoNegado(true);
          }
          return;
        }
        const dados: Setor[] = await res.json();
        const lista = Array.isArray(dados) ? dados : [];
        setSetores(lista);
        if (lista.length > 0) {
          setSetorId(String(lista[0].id));
        }
      } catch {
        setErro("Não foi possível carregar os setores.");
      } finally {
        setCarregandoSetores(false);
      }
    }
    buscarSetores();
  }, [empresaId, headers]);

  const buscarPendentes = useCallback(async () => {
    if (!empresaId || !setorId) return;
    try {
      setCarregandoLista(true);
      setErro(null);
      const res = await fetch(
        `${API_URL}/api/painel/empresas/${empresaId}/recomendacoes/setor/${setorId}/pendentes`,
        { headers: headers() }
      );

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setAcessoNegado(true);
          return;
        }
        const corpo = await res.text().catch(() => "");
        setErro(extrairMensagemErro(corpo, "Não foi possível carregar as recomendações."));
        return;
      }

      const dados: Recomendacao[] = await res.json();
      setRecomendacoes(Array.isArray(dados) ? dados : []);
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregandoLista(false);
    }
  }, [empresaId, setorId, headers]);

  useEffect(() => {
    if (setorId && !acessoNegado) {
      buscarPendentes();
    }
  }, [setorId, acessoNegado, buscarPendentes]);

  const reconhecer = async (recomendacaoId: number) => {
    setReconhecendoId(recomendacaoId);
    setErro(null);
    setSucesso(null);
    try {
      const res = await fetch(
        `${API_URL}/api/painel/empresas/${empresaId}/recomendacoes/${recomendacaoId}/reconhecer`,
        {
          method: "PATCH",
          headers: headers(),
        }
      );

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setAcessoNegado(true);
          return;
        }
        const corpo = await res.text().catch(() => "");
        setErro(extrairMensagemErro(corpo, "Não foi possível reconhecer a recomendação."));
        return;
      }

      setRecomendacoes((prev) => prev.filter((r) => r.id !== recomendacaoId));
      setSucesso("Recomendação reconhecida com sucesso.");
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setReconhecendoId(null);
    }
  };

  if (acessoNegado) {
    return (
      <div className={styles.panel}>
        <div className={styles.acessoRestrito}>
          <Sparkles size={36} className={styles.acessoRestritoIcone} />
          <p className={styles.acessoRestritoTitulo}>Acesso restrito a administradores</p>
          <p className={styles.vazio}>
            As recomendações são uma visão gerencial por setor. Peça ao administrador
            da empresa se precisar de orientações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Recomendações</h2>
          <p className={styles.sectionSubtitle}>
            Ações preventivas sugeridas com base no risco psicossocial de cada setor.
          </p>
        </div>
        <label className={styles.campo}>
          <span className={styles.blocoLabel}>Setor</span>
          <select
            className={styles.select}
            value={setorId}
            onChange={(e) => {
              setSucesso(null);
              setSetorId(e.target.value);
            }}
            disabled={carregandoSetores || setores.length === 0}
          >
            {setores.length === 0 && <option value="">Nenhum setor</option>}
            {setores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      {sucesso && <p className={styles.msgSucesso}>{sucesso}</p>}
      {erro && <p className={styles.msgErro}>{erro}</p>}

      <div className={styles.panel}>
        <h3 className={styles.panelTitulo}>Pendentes</h3>
        <p className={styles.panelHint}>
          Recomendações aguardando reconhecimento para o setor selecionado.
        </p>

        {(carregandoSetores || carregandoLista) && (
          <p className={styles.carregandoTexto}>Carregando recomendações...</p>
        )}

        {!carregandoSetores && !carregandoLista && setores.length === 0 && (
          <div className={styles.vazioBox}>
            <Sparkles size={22} />
            <p className={styles.vazio}>
              Cadastre setores em Colaboradores para receber recomendações por área.
            </p>
          </div>
        )}

        {!carregandoSetores && !carregandoLista && setores.length > 0 && recomendacoes.length === 0 && (
          <div className={styles.vazioBox}>
            <Check size={22} />
            <p className={styles.vazio}>
              Nenhuma recomendação pendente neste setor no momento.
            </p>
          </div>
        )}

        {!carregandoLista && recomendacoes.length > 0 && (
          <ul className={styles.lista}>
            {recomendacoes.map((r) => (
              <li key={r.id} className={styles.item}>
                <div className={styles.itemTopo}>
                  <span className={styles.pillTipo}>{rotuloTipo(r.tipo)}</span>
                  <span className={styles.itemData}>{formatarData(r.criadoEm)}</span>
                </div>

                <p className={styles.itemMensagem}>{r.mensagem}</p>

                <div className={styles.itemRodape}>
                  <span className={styles.pillPendente}>Pendente</span>
                  <button
                    type="button"
                    className={styles.reconhecerBtn}
                    onClick={() => reconhecer(r.id)}
                    disabled={reconhecendoId === r.id}
                  >
                    <Check size={14} />
                    {reconhecendoId === r.id ? "Reconhecendo..." : "Reconhecer"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

/* ---------------- Página ---------------- */

export default function RecomendacoesPage() {
  const { tema, toggleTema } = useTheme();
  const { token } = useAuth();
  const params = useParams();
  const empresaId = params?.id as string;

  return (
    <div className={pageStyles.page} data-theme={tema}>
      <Sidebar />

      <main className={pageStyles.main}>
        <Header tema={tema} toggleTema={toggleTema} denunciasAbertas={0} />
        <GestaoRecomendacoes empresaId={empresaId} token={token} />
      </main>
    </div>
  );
}
