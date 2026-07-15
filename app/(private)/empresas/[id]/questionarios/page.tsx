"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Sidebar from "../../../../components/menu";
import Header from "../../../../components/header";
import { useTheme } from "../../../../context/ThemeContext";
import { useAuth } from "../../../../context/AuthContext";
import { API_URL } from "@/lib/api";
import { ClipboardList, Plus, X, StopCircle, ListChecks } from "lucide-react";

import pageStyles from "../dashboard/gestao.module.css";
import styles from "./questionario.module.css";

/* ---------------- Tipos ---------------- */

interface Pergunta {
  id: number;
  texto: string;
  ordem: number;
}

interface Aplicacao {
  id: number;
  empresaId: number;
  formularioId: number;
  tipo: string;
  titulo: string;
  descricao: string;
  setorIds: number[];
  inicioEm: string;
  fimEm: string;
  canceladoEm: string | null;
  encerradoEm: string | null;
  minimoRespostas: number;
  status: string;
  perguntas: Pergunta[];
}

interface Modelo {
  id: number;
  tipo: string;
  titulo: string;
  descricao: string;
  ativo: boolean;
  quantidadePerguntas: number;
  perguntas: Pergunta[];
}

type FiltroStatus = "TODAS" | "AGENDADO" | "ATIVO" | "ENCERRADO";

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

function paraDatetimeLocal(iso?: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function statusClasse(status: string) {
  const s = (status || "").toLowerCase();
  if (s.includes("agend")) return styles.pillAgendado;
  if (s.includes("ativ")) return styles.pillAtivo;
  if (s.includes("encerr")) return styles.pillEncerrado;
  if (s.includes("cancel")) return styles.pillCancelado;
  return styles.pillNeutro;
}

function estaEncerravel(status: string) {
  const s = (status || "").toLowerCase();
  return !s.includes("encerr") && !s.includes("cancel");
}

/* ---------------- Painel: Nova aplicação ---------------- */

function PainelNovaAplicacao({
  empresaId,
  token,
  modelos,
  onFechar,
  onCriada,
}: {
  empresaId: string;
  token: string | null;
  modelos: Modelo[];
  onFechar: () => void;
  onCriada: (nova: Aplicacao) => void;
}) {
  const [modeloId, setModeloId] = useState<string>("");
  const [setorIdsTexto, setSetorIdsTexto] = useState("");
  const [inicioEm, setInicioEm] = useState("");
  const [fimEm, setFimEm] = useState("");
  const [minimoRespostas, setMinimoRespostas] = useState("1");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const modeloSelecionado = modelos.find((m) => String(m.id) === modeloId);

  const criarAplicacao = async () => {
    if (!modeloId) {
      setErro("Selecione um modelo de questionário.");
      return;
    }
    if (!inicioEm || !fimEm) {
      setErro("Defina o período de início e fim.");
      return;
    }

    const setorIds = setorIdsTexto
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => !Number.isNaN(n));

    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch(
        `${API_URL}/api/painel/empresas/${empresaId}/formularios/aplicacoes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            formularioId: Number(modeloId),
            setorIds,
            inicioEm: new Date(inicioEm).toISOString(),
            fimEm: new Date(fimEm).toISOString(),
            minimoRespostas: Number(minimoRespostas) || 0,
          }),
        }
      );

      if (!res.ok) {
        const corpo = await res.text().catch(() => "");
        let mensagem = "Não foi possível criar a aplicação agora. Tente novamente.";
        try {
          const json = JSON.parse(corpo);
          if (json?.mensagem) mensagem = json.mensagem;
        } catch {
          /* corpo não é JSON */
        }
        setErro(mensagem);
        return;
      }

      const nova: Aplicacao = await res.json();
      onCriada(nova);
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={styles.painel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.painelHeader}>
          <div>
            <h3 className={styles.painelTitulo}>Nova aplicação de questionário</h3>
            <p className={styles.painelMeta}>
              Escolha um modelo e defina para quem e por quanto tempo ele ficará disponível.
            </p>
          </div>
          <button type="button" className={styles.fecharBtn} onClick={onFechar} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className={styles.painelCorpo}>
          <label className={styles.campo}>
            <span className={styles.blocoLabel}>Modelo</span>
            <select
              className={styles.select}
              value={modeloId}
              onChange={(e) => setModeloId(e.target.value)}
              disabled={enviando}
            >
              <option value="">Selecione um modelo...</option>
              {modelos
                .filter((m) => m.ativo)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.titulo} · {m.quantidadePerguntas} pergunta(s)
                  </option>
                ))}
            </select>
          </label>

          {modeloSelecionado && (
            <div className={styles.previewModelo}>
              <span className={styles.blocoLabel}>Perguntas deste modelo</span>
              <ul className={styles.previewLista}>
                {modeloSelecionado.perguntas
                  .slice()
                  .sort((a, b) => a.ordem - b.ordem)
                  .map((p) => (
                    <li key={p.id}>{p.texto}</li>
                  ))}
              </ul>
            </div>
          )}

          <label className={styles.campo}>
            <span className={styles.blocoLabel}>Setores (IDs separados por vírgula)</span>
            <input
              className={styles.input}
              type="text"
              placeholder="Ex: 1, 2, 3 — deixe em branco para todos os setores"
              value={setorIdsTexto}
              onChange={(e) => setSetorIdsTexto(e.target.value)}
              disabled={enviando}
            />
          </label>

          <div className={styles.linhaDupla}>
            <label className={styles.campo}>
              <span className={styles.blocoLabel}>Início</span>
              <input
                className={styles.input}
                type="datetime-local"
                value={inicioEm}
                onChange={(e) => setInicioEm(e.target.value)}
                disabled={enviando}
              />
            </label>
            <label className={styles.campo}>
              <span className={styles.blocoLabel}>Fim</span>
              <input
                className={styles.input}
                type="datetime-local"
                value={fimEm}
                onChange={(e) => setFimEm(e.target.value)}
                disabled={enviando}
              />
            </label>
          </div>

          <label className={styles.campo}>
            <span className={styles.blocoLabel}>Mínimo de respostas</span>
            <input
              className={styles.input}
              type="number"
              min={0}
              value={minimoRespostas}
              onChange={(e) => setMinimoRespostas(e.target.value)}
              disabled={enviando}
            />
          </label>

          {erro && <p className={styles.msgErro}>{erro}</p>}

          <button
            type="button"
            className={styles.enviarBtn}
            onClick={criarAplicacao}
            disabled={enviando}
          >
            <Plus size={16} />
            {enviando ? "Criando..." : "Criar aplicação"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Painel: Detalhes da aplicação ---------------- */

function PainelDetalhes({
  aplicacao,
  empresaId,
  token,
  onFechar,
  onEncerrada,
}: {
  aplicacao: Aplicacao;
  empresaId: string;
  token: string | null;
  onFechar: () => void;
  onEncerrada: (atualizada: Aplicacao) => void;
}) {
  const [encerrando, setEncerrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const encerrar = async () => {
    setEncerrando(true);
    setErro(null);
    try {
      const res = await fetch(
        `${API_URL}/api/painel/empresas/${empresaId}/formularios/aplicacoes/${aplicacao.id}/encerrar`,
        {
          method: "PATCH",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!res.ok) {
        setErro("Não foi possível encerrar a aplicação agora. Tente novamente.");
        return;
      }

      const atualizada: Aplicacao = await res.json().catch(() => ({
        ...aplicacao,
        status: "ENCERRADO",
        encerradoEm: new Date().toISOString(),
      }));
      onEncerrada(atualizada);
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setEncerrando(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={styles.painel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.painelHeader}>
          <div>
            <span className={statusClasse(aplicacao.status)}>{aplicacao.status}</span>
            <h3 className={styles.painelTitulo}>{aplicacao.titulo}</h3>
            <p className={styles.painelMeta}>
              {formatarData(aplicacao.inicioEm)} até {formatarData(aplicacao.fimEm)}
            </p>
          </div>
          <button type="button" className={styles.fecharBtn} onClick={onFechar} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className={styles.painelCorpo}>
          <div className={styles.blocoDescricao}>
            <span className={styles.blocoLabel}>Descrição</span>
            <p className={styles.descricaoTexto}>{aplicacao.descricao || "Sem descrição."}</p>
          </div>

          <div className={styles.linhaDupla}>
            <div>
              <span className={styles.blocoLabel}>Mínimo de respostas</span>
              <p className={styles.descricaoTexto}>{aplicacao.minimoRespostas}</p>
            </div>
            <div>
              <span className={styles.blocoLabel}>Setores</span>
              <p className={styles.descricaoTexto}>
                {aplicacao.setorIds?.length ? aplicacao.setorIds.join(", ") : "Todos"}
              </p>
            </div>
          </div>

          <div>
            <span className={styles.blocoLabel}>Perguntas ({aplicacao.perguntas?.length ?? 0})</span>
            <ul className={styles.previewLista}>
              {(aplicacao.perguntas ?? [])
                .slice()
                .sort((a, b) => a.ordem - b.ordem)
                .map((p) => (
                  <li key={p.id}>{p.texto}</li>
                ))}
            </ul>
          </div>

          {erro && <p className={styles.msgErro}>{erro}</p>}

          {estaEncerravel(aplicacao.status) ? (
            <button
              type="button"
              className={styles.encerrarBtn}
              onClick={encerrar}
              disabled={encerrando}
            >
              <StopCircle size={16} />
              {encerrando ? "Encerrando..." : "Encerrar aplicação"}
            </button>
          ) : (
            <p className={styles.vazio}>Esta aplicação já foi encerrada.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Página principal ---------------- */

export default function QuestionarioPage() {
  const { tema, toggleTema } = useTheme();
  const { token } = useAuth();
  const params = useParams();
  const empresaId = params?.id as string;

  const [aplicacoes, setAplicacoes] = useState<Aplicacao[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroStatus>("TODAS");
  const [selecionada, setSelecionada] = useState<Aplicacao | null>(null);
  const [mostrarNova, setMostrarNova] = useState(false);

  const buscarDados = useCallback(async () => {
    if (!empresaId) return;
    try {
      setCarregando(true);
      setErro(null);
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const [resAplicacoes, resModelos] = await Promise.all([
        fetch(`${API_URL}/api/painel/empresas/${empresaId}/formularios/aplicacoes`, { headers }),
        fetch(`${API_URL}/api/painel/empresas/${empresaId}/formularios/modelos`, { headers }),
      ]);

      if (!resAplicacoes.ok) throw new Error();
      const dadosAplicacoes: Aplicacao[] = await resAplicacoes.json();
      setAplicacoes(Array.isArray(dadosAplicacoes) ? dadosAplicacoes : []);

      if (resModelos.ok) {
        const dadosModelos: Modelo[] = await resModelos.json();
        setModelos(Array.isArray(dadosModelos) ? dadosModelos : []);
      }
    } catch {
      setErro("Não foi possível carregar os questionários.");
    } finally {
      setCarregando(false);
    }
  }, [empresaId, token]);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  const aplicacoesFiltradas = aplicacoes.filter((a) => {
    if (filtro === "TODAS") return true;
    const s = (a.status || "").toLowerCase();
    if (filtro === "AGENDADO") return s.includes("agend");
    if (filtro === "ATIVO") return s.includes("ativ");
    return s.includes("encerr") || s.includes("cancel");
  });

  const contagem = (chave: FiltroStatus) => {
    if (chave === "TODAS") return aplicacoes.length;
    return aplicacoes.filter((a) => {
      const s = (a.status || "").toLowerCase();
      if (chave === "AGENDADO") return s.includes("agend");
      if (chave === "ATIVO") return s.includes("ativ");
      return s.includes("encerr") || s.includes("cancel");
    }).length;
  };

  const handleCriada = (nova: Aplicacao) => {
    setAplicacoes((prev) => [nova, ...prev]);
    setMostrarNova(false);
  };

  const handleEncerrada = (atualizada: Aplicacao) => {
    setAplicacoes((prev) => prev.map((a) => (a.id === atualizada.id ? atualizada : a)));
    setSelecionada(atualizada);
  };

  return (
    <div className={pageStyles.page} data-theme={tema}>
      <Sidebar />

      <main className={pageStyles.main}>
        <Header tema={tema} toggleTema={toggleTema} />

        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>Questionários</h2>
            <p className={pageStyles.sectionSubtitle}>
              Crie e acompanhe as aplicações de questionários para os colaboradores.
            </p>
          </div>
          <button type="button" className={styles.novaBtn} onClick={() => setMostrarNova(true)}>
            <Plus size={16} />
            Nova aplicação
          </button>
        </div>

        <div className={styles.panel}>
          <div className={styles.filtros}>
            <button
              type="button"
              className={`${styles.filtroBtn} ${filtro === "TODAS" ? styles.filtroAtivo : ""}`}
              onClick={() => setFiltro("TODAS")}
            >
              Todas ({contagem("TODAS")})
            </button>
            <button
              type="button"
              className={`${styles.filtroBtn} ${filtro === "AGENDADO" ? styles.filtroAtivo : ""}`}
              onClick={() => setFiltro("AGENDADO")}
            >
              Agendadas ({contagem("AGENDADO")})
            </button>
            <button
              type="button"
              className={`${styles.filtroBtn} ${filtro === "ATIVO" ? styles.filtroAtivo : ""}`}
              onClick={() => setFiltro("ATIVO")}
            >
              Ativas ({contagem("ATIVO")})
            </button>
            <button
              type="button"
              className={`${styles.filtroBtn} ${filtro === "ENCERRADO" ? styles.filtroAtivo : ""}`}
              onClick={() => setFiltro("ENCERRADO")}
            >
              Encerradas ({contagem("ENCERRADO")})
            </button>
          </div>

          {carregando && <p className={styles.carregandoTexto}>Carregando questionários...</p>}
          {erro && <p className={styles.msgErro}>{erro}</p>}

          {!carregando && !erro && (
            aplicacoesFiltradas.length === 0 ? (
              <div className={styles.vazioBox}>
                <ClipboardList size={22} />
                <p className={styles.vazio}>Nenhuma aplicação encontrada para este filtro.</p>
              </div>
            ) : (
              <ul className={styles.lista}>
                {aplicacoesFiltradas.map((a) => (
                  <li key={a.id} className={styles.item}>
                    <div className={styles.itemTopo}>
                      <span className={statusClasse(a.status)}>{a.status}</span>
                      <span className={styles.itemData}>
                        {formatarData(a.inicioEm)} — {formatarData(a.fimEm)}
                      </span>
                    </div>

                    <div className={styles.itemTipo}>{a.titulo}</div>
                    <p className={styles.itemDescricao}>{a.descricao}</p>

                    <div className={styles.itemRodape}>
                      <div className={styles.itemMetaGrupo}>
                        <span className={styles.itemMeta}>
                          <ListChecks size={14} /> {a.perguntas?.length ?? 0} pergunta(s)
                        </span>
                        <span className={styles.itemMeta}>
                          Mín. {a.minimoRespostas} resposta(s)
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.abrirBtn}
                        onClick={() => setSelecionada(a)}
                      >
                        Ver detalhes
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </main>

      {mostrarNova && (
        <PainelNovaAplicacao
          empresaId={empresaId}
          token={token}
          modelos={modelos}
          onFechar={() => setMostrarNova(false)}
          onCriada={handleCriada}
        />
      )}

      {selecionada && (
        <PainelDetalhes
          aplicacao={selecionada}
          empresaId={empresaId}
          token={token}
          onFechar={() => setSelecionada(null)}
          onEncerrada={handleEncerrada}
        />
      )}
    </div>
  );
}