"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Sidebar from "../../../../components/menu";
import Header from "../../../../components/header";
import { useTheme } from "../../../../context/ThemeContext";
import { useAuth } from "../../../../context/AuthContext";
import { API_URL } from "@/lib/api";
import { ClipboardList, Plus, X, StopCircle, ListChecks, Send } from "lucide-react";

import pageStyles from "../dashboard/gestao.module.css";
import styles from "./questionario.module.css";

/* ---------------- Tipos ---------------- */

interface Pergunta {
  id: number;
  texto: string;
  ordem: number;
  alternativas?: { valor: number; texto: string }[];
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

interface Setor {
  id: number;
  nome: string;
}

type FiltroStatus = "TODAS" | "AGENDADO" | "ATIVO" | "ENCERRADO";

const LIKERT = [
  { valor: 1, rotulo: "Discordo totalmente" },
  { valor: 2, rotulo: "Discordo" },
  { valor: 3, rotulo: "Neutro" },
  { valor: 4, rotulo: "Concordo" },
  { valor: 5, rotulo: "Concordo totalmente" },
] as const;

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

function perguntasOrdenadas(perguntas: Pergunta[] | undefined) {
  return (perguntas ?? []).slice().sort((a, b) => a.ordem - b.ordem);
}

function estaAtiva(status: string) {
  return (status || "").toLowerCase().includes("ativ");
}

/* ---------------- Colaborador: responder ---------------- */

function PainelResponder({
  aplicacao,
  empresaId,
  token,
  onFechar,
  onRespondida,
}: {
  aplicacao: Aplicacao;
  empresaId: string;
  token: string | null;
  onFechar: () => void;
  onRespondida: (aplicacaoId: number) => void;
}) {
  const perguntas = perguntasOrdenadas(aplicacao.perguntas);
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const selecionar = (perguntaId: number, valor: number) => {
    setRespostas((prev) => ({ ...prev, [perguntaId]: valor }));
  };

  const enviar = async () => {
    const faltando = perguntas.filter((p) => respostas[p.id] == null);
    if (faltando.length > 0) {
      setErro("Responda todas as perguntas antes de enviar.");
      return;
    }

    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch(
        `${API_URL}/api/app/empresas/${empresaId}/formularios/aplicacoes/${aplicacao.id}/respostas`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            respostas: perguntas.map((p) => ({
              perguntaId: p.id,
              valor: respostas[p.id],
            })),
          }),
        }
      );

      if (!res.ok) {
        const corpo = await res.text().catch(() => "");
        setErro(
          extrairMensagemErro(corpo, "Não foi possível enviar suas respostas. Tente novamente.")
        );
        return;
      }

      // API responde 204 No Content em sucesso
      onRespondida(aplicacao.id);
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
            <span className={statusClasse(aplicacao.status)}>{aplicacao.status}</span>
            <h3 className={styles.painelTitulo}>{aplicacao.titulo}</h3>
            <p className={styles.painelMeta}>
              Disponível até {formatarData(aplicacao.fimEm)}
            </p>
          </div>
          <button type="button" className={styles.fecharBtn} onClick={onFechar} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className={styles.painelCorpo}>
          {aplicacao.descricao && (
            <div className={styles.blocoDescricao}>
              <span className={styles.blocoLabel}>Sobre este questionário</span>
              <p className={styles.descricaoTexto}>{aplicacao.descricao}</p>
            </div>
          )}

          <p className={styles.likertLegenda}>
            Selecione a alternativa que melhor representa sua experiência.
          </p>

          {perguntas.map((p, index) => {
            const opcoes =
              Array.isArray(p.alternativas) && p.alternativas.length > 0
                ? [...p.alternativas].sort((a, b) => a.valor - b.valor)
                : LIKERT.map((l) => ({ valor: l.valor, texto: l.rotulo }));

            return (
              <div key={p.id} className={styles.perguntaBloco}>
                <span className={styles.blocoLabel}>
                  Pergunta {index + 1} de {perguntas.length}
                </span>
                <p className={styles.perguntaTexto}>{p.texto}</p>
                <div className={styles.likertGrupo} role="radiogroup" aria-label={p.texto}>
                  {opcoes.map((opcao) => {
                    const selecionado = respostas[p.id] === opcao.valor;
                    return (
                      <button
                        key={`${p.id}-${opcao.valor}`}
                        type="button"
                        className={`${styles.likertBtn} ${selecionado ? styles.likertBtnAtivo : ""}`}
                        onClick={() => selecionar(p.id, opcao.valor)}
                        disabled={enviando}
                        aria-pressed={selecionado}
                        title={opcao.texto}
                      >
                        <span className={styles.likertNumero}>{opcao.valor}</span>
                        <span className={styles.likertRotulo}>{opcao.texto}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {erro && <p className={styles.msgErro}>{erro}</p>}

          <button
            type="button"
            className={styles.enviarBtn}
            onClick={enviar}
            disabled={enviando}
          >
            <Send size={16} />
            {enviando ? "Enviando..." : "Enviar respostas"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResponderQuestionarios({
  empresaId,
  token,
}: {
  empresaId: string;
  token: string | null;
}) {
  const [disponiveis, setDisponiveis] = useState<Aplicacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [respondendo, setRespondendo] = useState<Aplicacao | null>(null);

  const buscarDisponiveis = useCallback(async () => {
    if (!empresaId || !token) return;
    try {
      setCarregando(true);
      setErro(null);
      const res = await fetch(
        `${API_URL}/api/app/empresas/${empresaId}/formularios/disponiveis`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        const corpo = await res.text().catch(() => "");
        if (res.status === 403) {
          setErro(
            "Você não tem permissão para responder questionários nesta empresa. Verifique se está vinculado a um setor incluído na aplicação."
          );
          return;
        }
        setErro(
          extrairMensagemErro(corpo, "Não foi possível carregar os questionários disponíveis.")
        );
        return;
      }

      const dados: Aplicacao[] = await res.json();
      const lista = Array.isArray(dados) ? dados : [];
      setDisponiveis(lista.filter((a) => estaAtiva(a.status)));
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }, [empresaId, token]);

  useEffect(() => {
    buscarDisponiveis();
  }, [buscarDisponiveis]);

  const handleRespondida = (aplicacaoId: number) => {
    setDisponiveis((prev) => prev.filter((a) => a.id !== aplicacaoId));
    setRespondendo(null);
    setSucesso("Respostas enviadas com sucesso. Obrigado!");
  };

  return (
    <>
      <div className={pageStyles.sectionHeader}>
        <div>
          <h2 className={pageStyles.sectionTitle}>Questionários</h2>
          <p className={pageStyles.sectionSubtitle}>
            Responda os questionários disponíveis para você. Suas respostas são anônimas.
          </p>
        </div>
      </div>

      <div className={styles.panel}>
        {carregando && <p className={styles.carregandoTexto}>Carregando questionários...</p>}
        {erro && <p className={styles.msgErro}>{erro}</p>}
        {sucesso && <p className={styles.msgSucesso}>{sucesso}</p>}

        {!carregando && !erro && (
          disponiveis.length === 0 ? (
            <div className={styles.vazioBox}>
              <ClipboardList size={22} />
              <p className={styles.vazio}>
                Nenhum questionário disponível no momento. Confirme se há uma aplicação ativa
                para o seu setor e se você já não respondeu este questionário.
              </p>
            </div>
          ) : (
            <ul className={styles.lista}>
              {disponiveis.map((a) => (
                <li key={a.id} className={styles.item}>
                  <div className={styles.itemTopo}>
                    <span className={statusClasse(a.status)}>{a.status}</span>
                    <span className={styles.itemData}>
                      Até {formatarData(a.fimEm)}
                    </span>
                  </div>

                  <div className={styles.itemTipo}>{a.titulo}</div>
                  <p className={styles.itemDescricao}>{a.descricao}</p>

                  <div className={styles.itemRodape}>
                    <div className={styles.itemMetaGrupo}>
                      <span className={styles.itemMeta}>
                        <ListChecks size={14} /> {a.perguntas?.length ?? 0} pergunta(s)
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.abrirBtn}
                      onClick={() => {
                        setSucesso(null);
                        setRespondendo(a);
                      }}
                    >
                      Responder
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
      </div>

      {respondendo && (
        <PainelResponder
          aplicacao={respondendo}
          empresaId={empresaId}
          token={token}
          onFechar={() => setRespondendo(null)}
          onRespondida={handleRespondida}
        />
      )}
    </>
  );
}

function extrairMensagemErro(corpo: string, fallback: string) {
  try {
    const json = JSON.parse(corpo);
    const partes: string[] = [];
    if (json?.mensagem) partes.push(json.mensagem);
    if (Array.isArray(json?.erros)) {
      partes.push(...json.erros.map(String));
    } else if (json?.erros && typeof json.erros === "object") {
      partes.push(
        ...Object.entries(json.erros).map(([campo, msg]) => `${campo}: ${String(msg)}`)
      );
    }
    return partes.length > 0 ? partes.join(" ") : fallback;
  } catch {
    return fallback;
  }
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
  const [setores, setSetores] = useState<Setor[]>([]);
  const [setorIdsSelecionados, setSetorIdsSelecionados] = useState<number[]>([]);
  const [carregandoSetores, setCarregandoSetores] = useState(true);
  const [inicioEm, setInicioEm] = useState("");
  const [duracaoHoras, setDuracaoHoras] = useState("24");
  const [minimoRespostas, setMinimoRespostas] = useState("5");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const modeloSelecionado = modelos.find((m) => String(m.id) === modeloId);

  useEffect(() => {
    async function buscarSetores() {
      try {
        setCarregandoSetores(true);
        const res = await fetch(`${API_URL}/api/empresas/${empresaId}/setores`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!res.ok) return;
        const dados: Setor[] = await res.json();
        setSetores(Array.isArray(dados) ? dados : []);
      } catch {
        /* setores carregados sob demanda */
      } finally {
        setCarregandoSetores(false);
      }
    }
    buscarSetores();
  }, [empresaId, token]);

  const alternarSetor = (setorId: number) => {
    setSetorIdsSelecionados((prev) =>
      prev.includes(setorId) ? prev.filter((id) => id !== setorId) : [...prev, setorId]
    );
  };

  const criarAplicacao = async () => {
    if (!modeloSelecionado) {
      setErro("Selecione um modelo de questionário.");
      return;
    }
    if (!inicioEm) {
      setErro("Defina a data e hora de início.");
      return;
    }
    if (setorIdsSelecionados.length === 0) {
      setErro("Selecione ao menos um setor.");
      return;
    }

    const duracao = Number(duracaoHoras);
    if (!duracao || duracao < 1 || duracao > 720) {
      setErro("A duração deve ser entre 1 e 720 horas.");
      return;
    }

    const minimo = Number(minimoRespostas);
    if (!minimo || minimo < 5) {
      setErro("O mínimo de respostas deve ser pelo menos 5.");
      return;
    }

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
            tipo: modeloSelecionado.tipo,
            setorIds: setorIdsSelecionados,
            inicioEm: new Date(inicioEm).toISOString(),
            duracaoHoras: duracao,
            minimoRespostas: minimo,
          }),
        }
      );

      if (!res.ok) {
        const corpo = await res.text().catch(() => "");
        setErro(
          extrairMensagemErro(corpo, "Não foi possível criar a aplicação agora. Tente novamente.")
        );
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
                {perguntasOrdenadas(modeloSelecionado.perguntas).map((p) => (
                  <li key={p.id}>{p.texto}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.campo}>
            <span className={styles.blocoLabel}>Setores</span>
            {carregandoSetores && (
              <p className={styles.carregandoTexto}>Carregando setores...</p>
            )}
            {!carregandoSetores && setores.length === 0 && (
              <p className={styles.vazio}>
                Nenhum setor cadastrado. Crie setores em Colaboradores antes de liberar.
              </p>
            )}
            {!carregandoSetores && setores.length > 0 && (
              <div className={styles.setoresLista}>
                {setores.map((s) => (
                  <label key={s.id} className={styles.setorOpcao}>
                    <input
                      type="checkbox"
                      checked={setorIdsSelecionados.includes(s.id)}
                      onChange={() => alternarSetor(s.id)}
                      disabled={enviando}
                    />
                    <span>{s.nome}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

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
              <span className={styles.blocoLabel}>Duração (horas)</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                max={720}
                value={duracaoHoras}
                onChange={(e) => setDuracaoHoras(e.target.value)}
                disabled={enviando}
              />
            </label>
          </div>

          <label className={styles.campo}>
            <span className={styles.blocoLabel}>Mínimo de respostas</span>
            <input
              className={styles.input}
              type="number"
              min={5}
              value={minimoRespostas}
              onChange={(e) => setMinimoRespostas(e.target.value)}
              disabled={enviando}
            />
            <span className={styles.campoHint}>Mínimo permitido: 5 respostas.</span>
          </label>

          {erro && <p className={styles.msgErro}>{erro}</p>}

          <button
            type="button"
            className={styles.enviarBtn}
            onClick={criarAplicacao}
            disabled={enviando || carregandoSetores || setores.length === 0}
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
              {perguntasOrdenadas(aplicacao.perguntas).map((p) => (
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

/* ---------------- Admin: gestão de aplicações ---------------- */

function GestaoQuestionariosAdmin({
  empresaId,
  token,
}: {
  empresaId: string;
  token: string | null;
}) {
  const [aplicacoes, setAplicacoes] = useState<Aplicacao[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [acessoNegado, setAcessoNegado] = useState(false);
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

      if (!resAplicacoes.ok) {
        if (resAplicacoes.status === 401 || resAplicacoes.status === 403) {
          setAcessoNegado(true);
        } else {
          setErro("Não foi possível carregar as aplicações.");
        }
        return;
      }

      const dadosAplicacoes: Aplicacao[] = await resAplicacoes.json();
      setAplicacoes(Array.isArray(dadosAplicacoes) ? dadosAplicacoes : []);

      if (resModelos.ok) {
        const dadosModelos: Modelo[] = await resModelos.json();
        setModelos(Array.isArray(dadosModelos) ? dadosModelos : []);
      }
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }, [empresaId, token]);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  if (acessoNegado) return null;

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
    <>
      <div className={`${pageStyles.sectionHeader} ${styles.secaoGestao}`}>
        <div>
          <h3 className={pageStyles.sectionTitle}>Gestão de aplicações</h3>
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

        {carregando && <p className={styles.carregandoTexto}>Carregando aplicações...</p>}
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
    </>
  );
}

/* ---------------- Página principal ---------------- */

export default function QuestionarioPage() {
  const { tema, toggleTema } = useTheme();
  const { token } = useAuth();
  const params = useParams();
  const empresaId = params?.id as string;

  return (
    <div className={pageStyles.page} data-theme={tema}>
      <Sidebar />

      <main className={pageStyles.main}>
        <Header tema={tema} toggleTema={toggleTema} denunciasAbertas={0} />

        <ResponderQuestionarios empresaId={empresaId} token={token} />
        <GestaoQuestionariosAdmin empresaId={empresaId} token={token} />
      </main>
    </div>
  );
}
