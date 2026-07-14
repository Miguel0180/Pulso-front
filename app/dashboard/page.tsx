"use client";

import styles from "./gestao.module.css";
import Menu from "../components/menu";
import Header from "../components/header";
import { useTheme } from "../context/ThemeContext";

type Estado = "bom" | "atencao" | "critico";

interface Setor {
  nome: string;
  colaboradores: number;
  score: number;
  estado: Estado;
  pulso: number[];
}

interface Colaborador {
  nome: string;
  cargo: string;
  setor: string;
  jornadaMedia: string;
  ultimoQuestionario: string;
  estado: Estado;
}

interface Alerta {
  texto: string;
  tempo: string;
  estado: Estado;
}

interface Recomendacao {
  titulo: string;
  corpo: string;
  tag: string;
}

const setores: Setor[] = [
  { nome: "Comercial", colaboradores: 34, score: 82, estado: "bom", pulso: [40, 42, 41, 43, 42, 44, 43, 45, 44, 46] },
  { nome: "Operações", colaboradores: 58, score: 61, estado: "atencao", pulso: [40, 46, 38, 50, 36, 48, 34, 44, 38, 42] },
  { nome: "TI", colaboradores: 21, score: 74, estado: "bom", pulso: [42, 40, 44, 41, 43, 40, 45, 42, 41, 44] },
  { nome: "Atendimento", colaboradores: 46, score: 48, estado: "critico", pulso: [40, 52, 30, 56, 26, 58, 24, 54, 28, 50] },
  { nome: "Financeiro", colaboradores: 17, score: 79, estado: "bom", pulso: [41, 43, 42, 44, 43, 45, 42, 44, 43, 45] },
];

const colaboradores: Colaborador[] = [
  { nome: "Marina Souza", cargo: "Analista Sênior", setor: "Comercial", jornadaMedia: "8h20", ultimoQuestionario: "Hoje", estado: "bom" },
  { nome: "Pedro Lins", cargo: "Coordenador", setor: "Operações", jornadaMedia: "9h45", ultimoQuestionario: "Ontem", estado: "atencao" },
  { nome: "Bianca Ferraz", cargo: "Atendente", setor: "Atendimento", jornadaMedia: "10h10", ultimoQuestionario: "3 dias atrás", estado: "critico" },
  { nome: "Rafael Tude", cargo: "Dev. Backend", setor: "TI", jornadaMedia: "8h05", ultimoQuestionario: "Hoje", estado: "bom" },
  { nome: "Camila Reis", cargo: "Analista Financeiro", setor: "Financeiro", jornadaMedia: "8h30", ultimoQuestionario: "2 dias atrás", estado: "bom" },
  { nome: "João Prado", cargo: "Atendente", setor: "Atendimento", jornadaMedia: "9h50", ultimoQuestionario: "5 dias atrás", estado: "atencao" },
];

const alertas: Alerta[] = [
  { texto: "Denúncia anônima registrada no setor Atendimento — assédio moral relatado por terceiros.", tempo: "há 2h", estado: "critico" },
  { texto: "Setor Operações com 4 colaboradores sem responder ao questionário nos últimos 7 dias.", tempo: "há 6h", estado: "atencao" },
  { texto: "Jornada média do setor Atendimento ultrapassou 10h por 3 dias seguidos.", tempo: "ontem", estado: "atencao" },
  { texto: "Nova denúncia anônima recebida — categoria sobrecarga de trabalho.", tempo: "há 2 dias", estado: "critico" },
];

const recomendacoes: Recomendacao[] = [
  {
    titulo: "Reunião 1:1 sugerida — Atendimento",
    corpo: "Score do setor caiu 12 pontos nas últimas 2 semanas. Recomendamos conversa com a liderança direta antes da próxima aplicação de questionário.",
    tag: "Prioridade alta",
  },
  {
    titulo: "Redistribuir carga — Operações",
    corpo: "3 colaboradores concentram 40% das horas extras do setor. Redistribuir tarefas pode reduzir o risco de esgotamento.",
    tag: "Carga horária",
  },
  {
    titulo: "Campanha de escuta — geral",
    corpo: "Taxa de resposta aos questionários caiu para 71%. Uma comunicação reforçando o anonimato tende a aumentar a adesão.",
    tag: "Engajamento",
  },
];

const estadoLabel: Record<Estado, string> = {
  bom: "Estável",
  atencao: "Atenção",
  critico: "Crítico",
};

function badgeClass(estado: Estado) {
  if (estado === "bom") return styles.badgeGood;
  if (estado === "atencao") return styles.badgeWatch;
  return styles.badgeCritical;
}

function pillClass(estado: Estado) {
  if (estado === "bom") return styles.pillGood;
  if (estado === "atencao") return styles.pillWatch;
  return styles.pillCritical;
}

function scoreColor(estado: Estado) {
  if (estado === "bom") return "var(--state-good)";
  if (estado === "atencao") return "var(--state-watch)";
  return "var(--state-critical)";
}

function PulseLine({ pontos, estado }: { pontos: number[]; estado: Estado }) {
  const width = 220;
  const height = 36;
  const max = Math.max(...pontos);
  const min = Math.min(...pontos);
  const range = max - min || 1;
  const step = width / (pontos.length - 1);

  const path = pontos
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * (height - 8) - 4;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.pulseWrap} preserveAspectRatio="none">
      <path d={path} fill="none" stroke={scoreColor(estado)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Dashboard() {
  const { tema, toggleTema } = useTheme();

  const totalColaboradores = setores.reduce((acc, s) => acc + s.colaboradores, 0);
  const scoreMedio = Math.round(setores.reduce((acc, s) => acc + s.score, 0) / setores.length);
  const setoresCriticos = setores.filter((s) => s.estado === "critico").length;
  const denunciasAbertas = alertas.filter((a) => a.estado === "critico").length;

  return (
    <div className={styles.page} data-theme={tema}>
      <Menu />

      <main className={styles.main}>
        <Header
          tema={tema}
          toggleTema={toggleTema}
          denunciasAbertas={denunciasAbertas}
        />

        <section className={styles.kpiRow}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Colaboradores ativos</div>
            <div className={styles.kpiValue}>{totalColaboradores}</div>
            <div className={`${styles.kpiDelta} ${styles.deltaGood}`}>+3 este mês</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Score médio de bem-estar</div>
            <div className={styles.kpiValue}>{scoreMedio}</div>
            <div className={`${styles.kpiDelta} ${styles.deltaWatch}`}>-4 pts vs. mês anterior</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Setores em estado crítico</div>
            <div className={styles.kpiValue}>{setoresCriticos}</div>
            <div className={`${styles.kpiDelta} ${styles.deltaCritical}`}>Atendimento requer ação</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Denúncias abertas</div>
            <div className={styles.kpiValue}>2</div>
            <div className={`${styles.kpiDelta} ${styles.deltaWatch}`}>1 sem resposta há 48h</div>
          </div>
        </section>

        <div className={styles.grid}>
          <div>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <div className={styles.panelTitle}>Status geral dos setores</div>
                  <div className={styles.panelHint}>A onda reflete a estabilidade do indicador de bem-estar no período</div>
                </div>
                <a className={styles.panelLink} href="#">Ver avaliação completa</a>
              </div>

              <div className={styles.sectorList}>
                {setores.map((s) => (
                  <div className={styles.sectorRow} key={s.nome}>
                    <div>
                      <span className={styles.sectorName}>{s.nome}</span>
                      <span className={styles.sectorCount}>{s.colaboradores} pessoas</span>
                    </div>
                    <PulseLine pontos={s.pulso} estado={s.estado} />
                    <div className={styles.sectorScore} style={{ color: scoreColor(s.estado) }}>
                      {s.score}
                    </div>
                    <span className={`${styles.badge} ${badgeClass(s.estado)}`}>{estadoLabel[s.estado]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>Colaboradores</div>
                <button className={styles.addButton}>Cadastrar colaborador</button>
              </div>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Setor</th>
                    <th>Jornada média</th>
                    <th>Último questionário</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {colaboradores.map((c) => (
                    <tr key={c.nome}>
                      <td>
                        <div className={styles.tableNameCell}>
                          <div className={styles.miniAvatar}>
                            {c.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <div className={styles.tableEmployeeName}>{c.nome}</div>
                            <div className={styles.tableEmployeeRole}>{c.cargo}</div>
                          </div>
                        </div>
                      </td>
                      <td>{c.setor}</td>
                      <td>{c.jornadaMedia}</td>
                      <td>{c.ultimoQuestionario}</td>
                      <td>
                        <span className={pillClass(c.estado)}>{estadoLabel[c.estado]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>Denúncias & alertas</div>
                <a className={styles.panelLink} href="#">Ver todas</a>
              </div>

              <div className={styles.alertList}>
                {alertas.map((a, i) => (
                  <div className={styles.alertItem} key={i}>
                    <span
                      className={styles.alertMarker}
                      style={{ background: scoreColor(a.estado) }}
                    />
                    <div>
                      <div className={styles.alertText}>{a.texto}</div>
                      <div className={styles.alertMeta}>{a.tempo}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.aiPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <div className={styles.panelTitle}>Recomendações da IA</div>
                  <div className={styles.panelHint}>Geradas a partir dos questionários, jornada e denúncias</div>
                </div>
              </div>

              <div className={styles.aiList}>
                {recomendacoes.map((r, i) => (
                  <div className={styles.aiItem} key={i}>
                    <div className={styles.aiItemTitle}>{r.titulo}</div>
                    <div className={styles.aiItemBody}>{r.corpo}</div>
                    <span className={styles.aiItemTag}>{r.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}