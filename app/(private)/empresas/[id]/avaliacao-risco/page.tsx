"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Sidebar from "../../../../components/menu";
import Header from "../../../../components/header";
import { useTheme } from "../../../../context/ThemeContext";
import { useAuth } from "../../../../context/AuthContext";
import { API_URL } from "@/lib/api";
import { ShieldAlert, RefreshCw, TrendingUp } from "lucide-react";

import pageStyles from "../dashboard/gestao.module.css";
import styles from "./avaliacao-risco.module.css";

/* ---------------- Tipos ---------------- */

interface Setor {
  id: number;
  nome: string;
}

type NivelRisco = "BAIXO" | "ATENCAO" | "ALTO" | string;
type Tendencia = "SUBINDO" | "ESTAVEL" | "CAINDO" | string;

interface AvaliacaoRisco {
  id: number;
  setorId: number;
  setorNome: string;
  indiceRisco: number;
  nivelRisco: NivelRisco;
  mediaHorasExtras?: number;
  mediaSeveridadeHumor?: number;
  taxaRotatividade?: number;
  quantidadeDenunciasAnonimas?: number;
  calculadoEm?: string;
}

interface PrevisaoRisco {
  setorId: number;
  setorNome: string;
  dadosSuficientes: boolean;
  indiceAtual?: number;
  tendencia?: Tendencia;
  indiceProjetadoEm45Dias?: number;
  diasEstimadosAteAltoRisco?: number | null;
  mensagem?: string;
}

/* ---------------- Helpers ---------------- */

function formatarData(iso?: string | null) {
  if (!iso) return "—";
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

function rotuloNivel(nivel?: string) {
  if (nivel === "BAIXO") return "Baixo";
  if (nivel === "ATENCAO") return "Atenção";
  if (nivel === "ALTO") return "Alto";
  return nivel || "—";
}

function badgeNivel(nivel?: string) {
  if (nivel === "BAIXO") return styles.badgeBaixo;
  if (nivel === "ATENCAO") return styles.badgeAtencao;
  if (nivel === "ALTO") return styles.badgeAlto;
  return styles.badgeAtencao;
}

function rotuloTendencia(t?: string) {
  if (t === "SUBINDO") return "Subindo";
  if (t === "CAINDO") return "Caindo";
  if (t === "ESTAVEL") return "Estável";
  return t || "—";
}

function formatNum(v?: number | null, casas = 1) {
  if (v == null || Number.isNaN(v)) return "—";
  return Number(v).toFixed(casas);
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

/* ---------------- Gestao ---------------- */

function GestaoAvaliacaoRisco({
  empresaId,
  token,
}: {
  empresaId: string;
  token: string | null;
}) {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [mapa, setMapa] = useState<AvaliacaoRisco[]>([]);
  const [setorId, setSetorId] = useState<string>("");
  const [atual, setAtual] = useState<AvaliacaoRisco | null>(null);
  const [historico, setHistorico] = useState<AvaliacaoRisco[]>([]);
  const [previsao, setPrevisao] = useState<PrevisaoRisco | null>(null);
  const [diasJanela, setDiasJanela] = useState(30);

  const [carregandoMapa, setCarregandoMapa] = useState(true);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [calculando, setCalculando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [acessoNegado, setAcessoNegado] = useState(false);

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const buscarMapa = useCallback(async () => {
    if (!empresaId) return;
    try {
      setCarregandoMapa(true);
      setErro(null);

      const [resMapa, resSetores] = await Promise.all([
        fetch(`${API_URL}/api/painel/empresas/${empresaId}/avaliacoes-risco/mapa`, {
          headers: headers(),
        }),
        fetch(`${API_URL}/api/empresas/${empresaId}/setores`, { headers: headers() }),
      ]);

      if (resMapa.status === 401 || resMapa.status === 403) {
        setAcessoNegado(true);
        return;
      }

      if (!resMapa.ok) {
        const corpo = await resMapa.text().catch(() => "");
        setErro(extrairMensagemErro(corpo, "Não foi possível carregar o mapa de risco."));
        return;
      }

      const dadosMapa: AvaliacaoRisco[] = await resMapa.json();
      const listaMapa = Array.isArray(dadosMapa) ? dadosMapa : [];
      setMapa(listaMapa);

      if (resSetores.ok) {
        const dadosSetores: Setor[] = await resSetores.json();
        setSetores(Array.isArray(dadosSetores) ? dadosSetores : []);
      }

      if (!setorId && listaMapa.length > 0) {
        setSetorId(String(listaMapa[0].setorId));
      }
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregandoMapa(false);
    }
  }, [empresaId, headers, setorId]);

  useEffect(() => {
    buscarMapa();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial
  }, [empresaId]);

  const buscarDetalhe = useCallback(async () => {
    if (!empresaId || !setorId || acessoNegado) return;
    try {
      setCarregandoDetalhe(true);
      setErro(null);

      const [resAtual, resHist, resPrev] = await Promise.all([
        fetch(
          `${API_URL}/api/painel/empresas/${empresaId}/avaliacoes-risco/setor/${setorId}`,
          { headers: headers() }
        ),
        fetch(
          `${API_URL}/api/painel/empresas/${empresaId}/avaliacoes-risco/setor/${setorId}/historico`,
          { headers: headers() }
        ),
        fetch(
          `${API_URL}/api/painel/empresas/${empresaId}/avaliacoes-risco/setor/${setorId}/previsao`,
          { headers: headers() }
        ),
      ]);

      if (
        resAtual.status === 401 ||
        resAtual.status === 403 ||
        resHist.status === 401 ||
        resHist.status === 403
      ) {
        setAcessoNegado(true);
        return;
      }

      if (resAtual.ok) {
        setAtual(await resAtual.json());
      } else if (resAtual.status === 404) {
        setAtual(null);
      } else {
        const corpo = await resAtual.text().catch(() => "");
        setErro(extrairMensagemErro(corpo, "Não foi possível carregar a avaliação do setor."));
      }

      if (resHist.ok) {
        const dados: AvaliacaoRisco[] = await resHist.json();
        setHistorico(Array.isArray(dados) ? dados : []);
      } else {
        setHistorico([]);
      }

      if (resPrev.ok) {
        setPrevisao(await resPrev.json());
      } else {
        setPrevisao(null);
      }
    } catch {
      setErro("Não foi possível carregar o detalhe do setor.");
    } finally {
      setCarregandoDetalhe(false);
    }
  }, [empresaId, setorId, acessoNegado, headers]);

  useEffect(() => {
    if (setorId) buscarDetalhe();
  }, [setorId, buscarDetalhe]);

  async function calcular() {
    if (!setorId) return;
    setCalculando(true);
    setErro(null);
    setSucesso(null);
    try {
      const res = await fetch(
        `${API_URL}/api/painel/empresas/${empresaId}/avaliacoes-risco`,
        {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            setorId: Number(setorId),
            diasJanela: Number(diasJanela) || 30,
          }),
        }
      );

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setAcessoNegado(true);
          return;
        }
        const corpo = await res.text().catch(() => "");
        setErro(extrairMensagemErro(corpo, "Não foi possível calcular o risco."));
        return;
      }

      const nova: AvaliacaoRisco = await res.json();
      setAtual(nova);
      setSucesso("Avaliação de risco recalculada.");
      await buscarMapa();
      await buscarDetalhe();
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCalculando(false);
    }
  }

  if (acessoNegado) {
    return (
      <div className={styles.panel}>
        <div className={styles.acessoRestrito}>
          <ShieldAlert size={36} className={styles.acessoRestritoIcone} />
          <p className={styles.acessoRestritoTitulo}>Acesso restrito a administradores</p>
          <p className={styles.vazio}>
            A avaliação de risco psicossocial é uma visão gerencial. Colaboradores não têm
            acesso aos índices por setor.
          </p>
        </div>
      </div>
    );
  }

  const setoresSelect =
    setores.length > 0
      ? setores
      : mapa.map((m) => ({ id: m.setorId, nome: m.setorNome }));

  return (
    <>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Avaliação de risco</h2>
          <p className={styles.sectionSubtitle}>
            Mapa de risco psicossocial por setor, histórico e tendência projetada.
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
            disabled={setoresSelect.length === 0}
          >
            {setoresSelect.length === 0 && <option value="">Nenhum setor</option>}
            {setoresSelect.map((s) => (
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
        <h3 className={styles.panelTitulo}>Mapa geral</h3>
        <p className={styles.panelHint}>Última avaliação conhecida de cada setor.</p>

        {carregandoMapa && <p className={styles.carregandoTexto}>Carregando mapa...</p>}

        {!carregandoMapa && mapa.length === 0 && (
          <div className={styles.vazioBox}>
            <ShieldAlert size={22} />
            <p className={styles.vazio}>
              Ainda não há avaliações. Selecione um setor e calcule o risco.
            </p>
          </div>
        )}

        {mapa.length > 0 && (
          <div className={styles.mapaGrid}>
            {mapa.map((m) => (
              <button
                key={m.id ?? m.setorId}
                type="button"
                className={`${styles.mapaCard} ${
                  String(m.setorId) === setorId ? styles.mapaCardAtivo : ""
                }`}
                onClick={() => setSetorId(String(m.setorId))}
              >
                <span className={styles.mapaNome}>{m.setorNome}</span>
                <span className={styles.mapaIndice}>{formatNum(m.indiceRisco, 0)}</span>
                <span className={`${styles.badge} ${badgeNivel(m.nivelRisco)}`}>
                  {rotuloNivel(m.nivelRisco)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.panel}>
        <h3 className={styles.panelTitulo}>Detalhe do setor</h3>
        <p className={styles.panelHint}>
          Indicadores da última avaliação e opção de recalcular com uma janela de dias.
        </p>

        {carregandoDetalhe && <p className={styles.carregandoTexto}>Carregando detalhe...</p>}

        {!carregandoDetalhe && !atual && (
          <p className={styles.vazio}>
            Sem avaliação atual para este setor. Calcule abaixo para gerar a primeira leitura.
          </p>
        )}

        {atual && (
          <div className={styles.detalheGrid}>
            <div className={styles.metrica}>
              <span className={styles.metricaLabel}>Índice</span>
              <span className={styles.metricaValor}>{formatNum(atual.indiceRisco, 0)}</span>
            </div>
            <div className={styles.metrica}>
              <span className={styles.metricaLabel}>Nível</span>
              <span className={`${styles.badge} ${badgeNivel(atual.nivelRisco)}`}>
                {rotuloNivel(atual.nivelRisco)}
              </span>
            </div>
            <div className={styles.metrica}>
              <span className={styles.metricaLabel}>Horas extras (média)</span>
              <span className={styles.metricaValor}>{formatNum(atual.mediaHorasExtras)}</span>
            </div>
            <div className={styles.metrica}>
              <span className={styles.metricaLabel}>Severidade humor</span>
              <span className={styles.metricaValor}>
                {formatNum(atual.mediaSeveridadeHumor)}
              </span>
            </div>
            <div className={styles.metrica}>
              <span className={styles.metricaLabel}>Rotatividade</span>
              <span className={styles.metricaValor}>{formatNum(atual.taxaRotatividade)}</span>
            </div>
            <div className={styles.metrica}>
              <span className={styles.metricaLabel}>Denúncias anônimas</span>
              <span className={styles.metricaValor}>
                {atual.quantidadeDenunciasAnonimas ?? "—"}
              </span>
            </div>
            <div className={styles.metrica}>
              <span className={styles.metricaLabel}>Calculado em</span>
              <span className={styles.metricaValor} style={{ fontSize: 13, fontWeight: 500 }}>
                {formatarData(atual.calculadoEm)}
              </span>
            </div>
          </div>
        )}

        <div className={styles.acoes}>
          <label className={styles.campo}>
            <span className={styles.blocoLabel}>Janela (dias)</span>
            <input
              className={styles.input}
              type="number"
              min={7}
              max={365}
              value={diasJanela}
              onChange={(e) => setDiasJanela(Number(e.target.value))}
            />
          </label>
          <button
            type="button"
            className={styles.btnPrimario}
            onClick={calcular}
            disabled={!setorId || calculando}
          >
            <RefreshCw size={14} />
            {calculando ? "Calculando..." : "Calcular risco"}
          </button>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.panel}>
          <h3 className={styles.panelTitulo}>Previsão</h3>
          <p className={styles.panelHint}>Tendência com base no histórico recente.</p>

          {carregandoDetalhe && <p className={styles.carregandoTexto}>Carregando...</p>}

          {!carregandoDetalhe && !previsao && (
            <p className={styles.vazio}>Sem dados de previsão para este setor.</p>
          )}

          {previsao && !previsao.dadosSuficientes && (
            <p className={styles.vazio}>
              {previsao.mensagem || "Dados insuficientes para projetar o risco."}
            </p>
          )}

          {previsao?.dadosSuficientes && (
            <>
              {previsao.mensagem && <p className={styles.previsaoMsg}>{previsao.mensagem}</p>}
              <div className={styles.detalheGrid}>
                <div className={styles.metrica}>
                  <span className={styles.metricaLabel}>Índice atual</span>
                  <span className={styles.metricaValor}>
                    {formatNum(previsao.indiceAtual, 0)}
                  </span>
                </div>
                <div className={styles.metrica}>
                  <span className={styles.metricaLabel}>Tendência</span>
                  <span className={`${styles.badge} ${styles.badgeTendencia}`}>
                    <TrendingUp size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                    {rotuloTendencia(previsao.tendencia)}
                  </span>
                </div>
                <div className={styles.metrica}>
                  <span className={styles.metricaLabel}>Projetado (45 dias)</span>
                  <span className={styles.metricaValor}>
                    {formatNum(previsao.indiceProjetadoEm45Dias, 0)}
                  </span>
                </div>
                <div className={styles.metrica}>
                  <span className={styles.metricaLabel}>Dias até alto risco</span>
                  <span className={styles.metricaValor}>
                    {previsao.diasEstimadosAteAltoRisco ?? "—"}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.panel}>
          <h3 className={styles.panelTitulo}>Histórico</h3>
          <p className={styles.panelHint}>Avaliações anteriores deste setor.</p>

          {carregandoDetalhe && <p className={styles.carregandoTexto}>Carregando...</p>}

          {!carregandoDetalhe && historico.length === 0 && (
            <p className={styles.vazio}>Nenhum histórico ainda.</p>
          )}

          {historico.length > 0 && (
            <ul className={styles.lista}>
              {historico.map((h) => (
                <li key={h.id} className={styles.histItem}>
                  <div className={styles.histMeta}>
                    <span className={styles.histIndice}>{formatNum(h.indiceRisco, 0)}</span>
                    <span className={styles.histData}>{formatarData(h.calculadoEm)}</span>
                  </div>
                  <span className={`${styles.badge} ${badgeNivel(h.nivelRisco)}`}>
                    {rotuloNivel(h.nivelRisco)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------------- Página ---------------- */

export default function AvaliacaoRiscoPage() {
  const { tema, toggleTema } = useTheme();
  const { token } = useAuth();
  const params = useParams();
  const empresaId = params?.id as string;

  return (
    <div className={pageStyles.page} data-theme={tema}>
      <Sidebar />
      <main className={pageStyles.main}>
        <Header tema={tema} toggleTema={toggleTema} denunciasAbertas={0} />
        <GestaoAvaliacaoRisco empresaId={empresaId} token={token} />
      </main>
    </div>
  );
}
