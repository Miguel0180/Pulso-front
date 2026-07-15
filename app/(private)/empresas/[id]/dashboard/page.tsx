"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import styles from "./gestao.module.css";
import Menu from "../../../../components/menu";
import Header from "../../../../components/header";
import { useTheme } from "../../../../context/ThemeContext";
import { useAuth } from "../../../../context/AuthContext";
import { useEmpresa } from "../../../../context/EmpresaContext";
import { API_URL } from "@/lib/api";
import {
  Copy,
  Check,
  KeyRound,
  ClipboardList,
  Clock,
  AlertTriangle,
  Settings,
} from "lucide-react";

type Estado = "bom" | "atencao" | "critico";

type NivelHumor =
  | "MUITO_BEM"
  | "BEM"
  | "CANSADO"
  | "SOBRECARREGADO"
  | "PRECISA_AJUDA";

interface DashboardResumo {
  colaboradoresAtivos: number;
  scoreMedioBemEstar: number;
}

interface SetorStatus {
  setorId: number;
  setorNome: string;
  quantidadeColaboradores: number;
  scoreBemEstar: number;
  statusLabel: string;
  tendenciaBemEstar: number[];
}

interface AlertaApi {
  id: number;
  origem: string;
  setorNome: string;
  mensagem: string;
  criadoEm: string;
}

interface RecomendacaoApi {
  id: number;
  mensagem: string;
  tipo: string;
  reconhecida: boolean;
  criadoEm: string;
  setorNome?: string;
}

interface Membro {
  id: number;
  nome: string;
  cargoNome: string;
  setorNome: string;
}

interface CodigoConvite {
  empresaId: number;
  codigo: string;
  geradoEm: string;
  expiraEm: string;
}

const LIMITE_MEMBROS = 8;
const LIMITE_SETORES_RECS = 5;
const LIMITE_RECS = 5;

const NIVEIS_HUMOR: { valor: NivelHumor; label: string; emoji: string }[] = [
  { valor: "MUITO_BEM", label: "Muito bem", emoji: "😄" },
  { valor: "BEM", label: "Bem", emoji: "🙂" },
  { valor: "CANSADO", label: "Cansado", emoji: "😮‍💨" },
  { valor: "SOBRECARREGADO", label: "Sobrecarregado", emoji: "😰" },
  { valor: "PRECISA_AJUDA", label: "Precisa de ajuda", emoji: "🆘" },
];

const TIPO_LABEL: Record<string, string> = {
  REDUZIR_HORAS_EXTRAS: "Reduzir horas extras",
  REDISTRIBUIR_TAREFAS: "Redistribuir tarefas",
  CONVERSA_COM_EQUIPE: "Conversa com a equipe",
  APOIO_PSICOLOGICO: "Apoio psicológico",
  TREINAMENTO_LIDERANCA: "Treinamento de liderança",
};

function mapearEstado(label?: string): Estado {
  const s = (label || "").toLowerCase();
  if (s.includes("crít") || s.includes("crit") || s.includes("alto") || s.includes("ruim")) {
    return "critico";
  }
  if (s.includes("aten") || s.includes("watch") || s.includes("médi") || s.includes("medi")) {
    return "atencao";
  }
  return "bom";
}

function estadoLabel(estado: Estado) {
  if (estado === "bom") return "Estável";
  if (estado === "atencao") return "Atenção";
  return "Crítico";
}

function badgeClass(estado: Estado, stylesMap: typeof styles) {
  if (estado === "bom") return stylesMap.badgeGood;
  if (estado === "atencao") return stylesMap.badgeWatch;
  return stylesMap.badgeCritical;
}

function scoreColor(estado: Estado) {
  if (estado === "bom") return "var(--state-good)";
  if (estado === "atencao") return "var(--state-watch)";
  return "var(--state-critical)";
}

function tempoRelativo(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "agora";
    if (min < 60) return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h}h`;
    const d = Math.floor(h / 24);
    if (d === 1) return "ontem";
    return `há ${d} dias`;
  } catch {
    return iso;
  }
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

function PulseLine({ pontos, estado }: { pontos: number[]; estado: Estado }) {
  const width = 220;
  const height = 36;
  const serie = pontos.length >= 2 ? pontos : [0, 0];
  const max = Math.max(...serie);
  const min = Math.min(...serie);
  const range = max - min || 1;
  const step = width / (serie.length - 1);

  const path = serie
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * (height - 8) - 4;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.pulseWrap} preserveAspectRatio="none">
      <path
        d={path}
        fill="none"
        stroke={scoreColor(estado)}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------------- Check-in de humor (app) ---------------- */

function CheckinHumor({
  empresaId,
  token,
}: {
  empresaId: string;
  token: string | null;
}) {
  const [selecionado, setSelecionado] = useState<NivelHumor | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(nivel: NivelHumor) {
    setSelecionado(nivel);
    setEnviando(true);
    setErro(null);
    setSucesso(null);
    try {
      const res = await fetch(`${API_URL}/api/app/empresas/${empresaId}/checkins-humor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ nivelHumor: nivel }),
      });

      if (!res.ok) {
        const corpo = await res.text().catch(() => "");
        let mensagem = "Não foi possível registrar seu check-in agora.";
        try {
          const json = JSON.parse(corpo);
          if (json?.mensagem) mensagem = json.mensagem;
        } catch {
          /* ignore */
        }
        setErro(mensagem);
        return;
      }

      setSucesso("Check-in registrado. Obrigado por compartilhar!");
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={`${styles.panel} ${styles.humorPanel}`}>
      <div className={styles.panelHeader}>
        <div>
          <div className={styles.panelTitle}>Como você está hoje?</div>
          <div className={styles.panelHint}>
            Registre seu humor de forma anônima. Leva menos de 5 segundos.
          </div>
        </div>
      </div>

      <div className={styles.humorOpcoes} role="group" aria-label="Nível de humor">
        {NIVEIS_HUMOR.map((op) => (
          <button
            key={op.valor}
            type="button"
            className={`${styles.humorBtn} ${selecionado === op.valor ? styles.humorBtnAtivo : ""}`}
            onClick={() => enviar(op.valor)}
            disabled={enviando}
            aria-pressed={selecionado === op.valor}
          >
            <span className={styles.humorEmoji} aria-hidden>
              {op.emoji}
            </span>
            <span className={styles.humorLabel}>{op.label}</span>
          </button>
        ))}
      </div>

      {sucesso && <p className={`${styles.humorMsg} ${styles.humorMsgOk}`}>{sucesso}</p>}
      {erro && <p className={`${styles.humorMsg} ${styles.humorMsgErro}`}>{erro}</p>}
    </div>
  );
}

/* ---------------- Visão colaborador ---------------- */

function DashboardColaborador({
  empresaId,
  token,
}: {
  empresaId: string;
  token: string | null;
}) {
  const { temPermissao } = useEmpresa();
  const base = `/empresas/${empresaId}`;

  const atalhos = [
    {
      href: `${base}/questionarios`,
      titulo: "Questionários",
      desc: "Responder formulários disponíveis para você",
      show: temPermissao("RESPONDER_PESQUISAS", "GERENCIAR_PESQUISAS"),
      icon: ClipboardList,
    },
    {
      href: `${base}/ponto-jornada`,
      titulo: "Ponto & Jornada",
      desc: "Registrar entrada e saída",
      show: temPermissao("REGISTRAR_PONTO", "GERENCIAR_JORNADAS"),
      icon: Clock,
    },
    {
      href: `${base}/denuncias/nova`,
      titulo: "Denúncias",
      desc: "Enviar um relato anônimo",
      show: temPermissao("RESPONDER_DENUNCIAS", "GERENCIAR_DENUNCIAS"),
      icon: AlertTriangle,
    },
    {
      href: `${base}/configuracoes`,
      titulo: "Configurações",
      desc: "Acessibilidade e aparência",
      show: true,
      icon: Settings,
    },
  ].filter((a) => a.show);

  return (
    <>
      <CheckinHumor empresaId={empresaId} token={token} />

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <div className={styles.panelTitle}>Atalhos</div>
            <div className={styles.panelHint}>
              Acesse as áreas disponíveis para você. Dados gerenciais não são exibidos nesta visão.
            </div>
          </div>
        </div>

        <div className={styles.atalhosGrid}>
          {atalhos.map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.href} href={a.href} className={styles.atalhoCard}>
                <Icon size={18} color="var(--accent-violet)" />
                <span className={styles.atalhoTitulo}>{a.titulo}</span>
                <span className={styles.atalhoDesc}>{a.desc}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ---------------- Visão gestão ---------------- */

function DashboardGestao({
  empresaId,
  token,
}: {
  empresaId: string;
  token: string | null;
}) {
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [setores, setSetores] = useState<SetorStatus[]>([]);
  const [alertas, setAlertas] = useState<AlertaApi[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [recomendacoes, setRecomendacoes] = useState<RecomendacaoApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [acessoNegado, setAcessoNegado] = useState(false);

  const [gerandoCodigo, setGerandoCodigo] = useState(false);
  const [codigoConvite, setCodigoConvite] = useState<CodigoConvite | null>(null);
  const [erroCodigo, setErroCodigo] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const headers = useCallback(
    () => ({ ...(token ? { Authorization: `Bearer ${token}` } : {}) }),
    [token]
  );

  useEffect(() => {
    if (!empresaId) return;
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      setErro(null);
      setAcessoNegado(false);

      try {
        const [resResumo, resSetores, resAlertas, resMembros] = await Promise.all([
          fetch(`${API_URL}/api/painel/empresas/${empresaId}/dashboard/resumo`, {
            headers: headers(),
          }),
          fetch(`${API_URL}/api/painel/empresas/${empresaId}/dashboard/setores`, {
            headers: headers(),
          }),
          fetch(`${API_URL}/api/painel/empresas/${empresaId}/dashboard/alertas?limite=10`, {
            headers: headers(),
          }),
          fetch(`${API_URL}/api/empresas/${empresaId}/membros`, { headers: headers() }),
        ]);

        if (
          resResumo.status === 401 ||
          resResumo.status === 403 ||
          resSetores.status === 401 ||
          resSetores.status === 403
        ) {
          if (!cancelado) setAcessoNegado(true);
          return;
        }

        if (!resResumo.ok || !resSetores.ok || !resAlertas.ok) {
          if (!cancelado) setErro("Não foi possível carregar o dashboard.");
          return;
        }

        const dadosResumo: DashboardResumo = await resResumo.json();
        const dadosSetores: SetorStatus[] = await resSetores.json();
        const dadosAlertas: AlertaApi[] = await resAlertas.json();

        if (cancelado) return;

        setResumo(dadosResumo);
        const listaSetores = Array.isArray(dadosSetores) ? dadosSetores : [];
        setSetores(listaSetores);
        setAlertas(Array.isArray(dadosAlertas) ? dadosAlertas : []);

        if (resMembros.ok) {
          const dadosMembros: Membro[] = await resMembros.json();
          setMembros(Array.isArray(dadosMembros) ? dadosMembros : []);
        }

        const setoresParaRecs = listaSetores.slice(0, LIMITE_SETORES_RECS);
        if (setoresParaRecs.length > 0) {
          const resultados = await Promise.all(
            setoresParaRecs.map(async (s) => {
              try {
                const res = await fetch(
                  `${API_URL}/api/painel/empresas/${empresaId}/recomendacoes/setor/${s.setorId}/pendentes`,
                  { headers: headers() }
                );
                if (!res.ok) return [] as RecomendacaoApi[];
                const lista: RecomendacaoApi[] = await res.json();
                return (Array.isArray(lista) ? lista : []).map((r) => ({
                  ...r,
                  setorNome: s.setorNome,
                }));
              } catch {
                return [] as RecomendacaoApi[];
              }
            })
          );
          if (!cancelado) {
            setRecomendacoes(resultados.flat().slice(0, LIMITE_RECS));
          }
        }
      } catch {
        if (!cancelado) setErro("Não foi possível conectar ao servidor.");
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [empresaId, headers]);

  async function gerarCodigoConvite() {
    setGerandoCodigo(true);
    setErroCodigo(null);
    setCopiado(false);

    try {
      const res = await fetch(`${API_URL}/api/empresas/${empresaId}/codigo-convite`, {
        method: "POST",
        headers: headers(),
      });

      if (!res.ok) {
        setErroCodigo("Não foi possível gerar o código agora.");
        return;
      }

      const data: CodigoConvite = await res.json();
      setCodigoConvite(data);
    } catch {
      setErroCodigo("Não foi possível conectar ao servidor.");
    } finally {
      setGerandoCodigo(false);
    }
  }

  async function copiarCodigo() {
    if (!codigoConvite) return;
    try {
      await navigator.clipboard.writeText(codigoConvite.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* ignore */
    }
  }

  function formatarExpiracao(iso: string) {
    try {
      return new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  const membrosVisiveis = membros.slice(0, LIMITE_MEMBROS);
  const base = `/empresas/${empresaId}`;

  return (
    <>
      <CheckinHumor empresaId={empresaId} token={token} />

      {acessoNegado && (
        <p className={styles.codigoErro} style={{ marginBottom: 16 }}>
          Você não tem permissão para ver o painel gerencial desta empresa.
        </p>
      )}

      {erro && (
        <p className={styles.codigoErro} style={{ marginBottom: 16 }}>
          {erro}
        </p>
      )}

      <section className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Colaboradores ativos</div>
          <div className={styles.kpiValue}>
            {carregando ? "—" : (resumo?.colaboradoresAtivos ?? 0)}
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Score médio de bem-estar</div>
          <div className={styles.kpiValue}>
            {carregando
              ? "—"
              : resumo?.scoreMedioBemEstar != null
                ? Math.round(resumo.scoreMedioBemEstar)
                : "—"}
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiCardAction}`}>
          <div className={styles.kpiLabel}>Convidar colaboradores</div>

          {!codigoConvite ? (
            <button
              type="button"
              className={styles.gerarCodigoButton}
              onClick={gerarCodigoConvite}
              disabled={gerandoCodigo}
            >
              <KeyRound size={16} />
              {gerandoCodigo ? "Gerando..." : "Gerar código de convite"}
            </button>
          ) : (
            <div className={styles.codigoGerado}>
              <div className={styles.codigoValor}>
                {codigoConvite.codigo}
                <button
                  type="button"
                  className={styles.copiarBotao}
                  onClick={copiarCodigo}
                  title="Copiar código"
                  aria-label="Copiar código"
                >
                  {copiado ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <div className={styles.codigoExpira}>
                Expira em {formatarExpiracao(codigoConvite.expiraEm)}
              </div>
              <button
                type="button"
                className={styles.gerarNovoLink}
                onClick={gerarCodigoConvite}
                disabled={gerandoCodigo}
              >
                {gerandoCodigo ? "Gerando..." : "Gerar novo código"}
              </button>
            </div>
          )}

          {erroCodigo && <div className={styles.codigoErro}>{erroCodigo}</div>}
        </div>
      </section>

      <div className={styles.grid}>
        <div>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.panelTitle}>Status geral dos setores</div>
                <div className={styles.panelHint}>
                  A onda reflete a estabilidade do indicador de bem-estar no período
                </div>
              </div>
              <Link className={styles.panelLink} href={`${base}/avaliacao-risco`}>
                Ver avaliação completa
              </Link>
            </div>

            {carregando && <p className={styles.panelHint}>Carregando setores...</p>}
            {!carregando && setores.length === 0 && !acessoNegado && (
              <p className={styles.panelHint}>Nenhum setor com dados de bem-estar ainda.</p>
            )}

            <div className={styles.sectorList}>
              {setores.map((s) => {
                const estado = mapearEstado(s.statusLabel);
                const label = s.statusLabel || estadoLabel(estado);
                return (
                  <div className={styles.sectorRow} key={s.setorId}>
                    <div>
                      <span className={styles.sectorName}>{s.setorNome}</span>
                      <span className={styles.sectorCount}>
                        {s.quantidadeColaboradores} pessoas
                      </span>
                    </div>
                    <PulseLine
                      pontos={
                        Array.isArray(s.tendenciaBemEstar) && s.tendenciaBemEstar.length > 0
                          ? s.tendenciaBemEstar
                          : [s.scoreBemEstar ?? 0, s.scoreBemEstar ?? 0]
                      }
                      estado={estado}
                    />
                    <div className={styles.sectorScore} style={{ color: scoreColor(estado) }}>
                      {Math.round(s.scoreBemEstar ?? 0)}
                    </div>
                    <span className={`${styles.badge} ${badgeClass(estado, styles)}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>Colaboradores</div>
              <Link className={styles.addButton} href={`${base}/colaboradores`}>
                Ver todos
              </Link>
            </div>

            {carregando && <p className={styles.panelHint}>Carregando colaboradores...</p>}
            {!carregando && membrosVisiveis.length === 0 && (
              <p className={styles.panelHint}>Nenhum colaborador cadastrado.</p>
            )}

            {membrosVisiveis.length > 0 && (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Cargo</th>
                    <th>Setor</th>
                  </tr>
                </thead>
                <tbody>
                  {membrosVisiveis.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className={styles.tableNameCell}>
                          <div className={styles.miniAvatar}>{iniciais(m.nome)}</div>
                          <div className={styles.tableEmployeeName}>{m.nome}</div>
                        </div>
                      </td>
                      <td>{m.cargoNome || "—"}</td>
                      <td>{m.setorNome || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>Denúncias & alertas</div>
              <Link className={styles.panelLink} href={`${base}/denuncias`}>
                Ver todas
              </Link>
            </div>

            {carregando && <p className={styles.panelHint}>Carregando alertas...</p>}
            {!carregando && alertas.length === 0 && (
              <p className={styles.panelHint}>Nenhum alerta no momento.</p>
            )}

            <div className={styles.alertList}>
              {alertas.map((a) => {
                const estado: Estado = a.origem === "DENUNCIA" ? "critico" : "atencao";
                return (
                  <div className={styles.alertItem} key={a.id}>
                    <span
                      className={styles.alertMarker}
                      style={{ background: scoreColor(estado) }}
                    />
                    <div>
                      <div className={styles.alertText}>
                        {a.mensagem}
                        {a.setorNome ? ` · ${a.setorNome}` : ""}
                      </div>
                      <div className={styles.alertMeta}>{tempoRelativo(a.criadoEm)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.aiPanel}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.panelTitle}>Recomendações</div>
                <div className={styles.panelHint}>
                  Geradas a partir dos questionários, jornada e denúncias
                </div>
              </div>
              <Link className={styles.panelLink} href={`${base}/recomendacoes`}>
                Ver todas
              </Link>
            </div>

            {carregando && <p className={styles.panelHint}>Carregando recomendações...</p>}
            {!carregando && recomendacoes.length === 0 && (
              <p className={styles.panelHint}>Nenhuma recomendação pendente.</p>
            )}

            <div className={styles.aiList}>
              {recomendacoes.map((r) => (
                <div className={styles.aiItem} key={`${r.setorNome}-${r.id}`}>
                  <div className={styles.aiItemTitle}>
                    {r.setorNome ? `${r.setorNome}` : "Recomendação"}
                  </div>
                  <div className={styles.aiItemBody}>{r.mensagem}</div>
                  <span className={styles.aiItemTag}>
                    {TIPO_LABEL[r.tipo] ?? r.tipo?.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </>
  );
}

/* ---------------- Página ---------------- */

interface DashboardProps {
  empresa?: unknown;
}

export default function Dashboard(_props: DashboardProps) {
  const { tema, toggleTema } = useTheme();
  const { token } = useAuth();
  const { ehGestor, carregandoPermissoes } = useEmpresa();
  const params = useParams();
  const empresaId = params?.id as string;

  // Badge de denúncias só faz sentido na visão de gestão; colaborador fica em 0
  const [denunciasAbertas, setDenunciasAbertas] = useState(0);

  useEffect(() => {
    if (!ehGestor || !empresaId || !token) {
      setDenunciasAbertas(0);
      return;
    }
    let cancelado = false;
    async function contar() {
      try {
        const res = await fetch(
          `${API_URL}/api/painel/empresas/${empresaId}/dashboard/alertas?limite=20`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok || cancelado) return;
        const dados: AlertaApi[] = await res.json();
        if (!cancelado) {
          setDenunciasAbertas(
            (Array.isArray(dados) ? dados : []).filter((a) => a.origem === "DENUNCIA").length
          );
        }
      } catch {
        /* ignore */
      }
    }
    contar();
    return () => {
      cancelado = true;
    };
  }, [ehGestor, empresaId, token]);

  return (
    <div className={styles.page} data-theme={tema}>
      <Menu />

      <main className={styles.main}>
        <Header tema={tema} toggleTema={toggleTema} denunciasAbertas={denunciasAbertas} />

        {carregandoPermissoes ? (
          <p className={styles.panelHint}>Preparando visão geral...</p>
        ) : ehGestor ? (
          <DashboardGestao empresaId={empresaId} token={token} />
        ) : (
          <DashboardColaborador empresaId={empresaId} token={token} />
        )}
      </main>
    </div>
  );
}
