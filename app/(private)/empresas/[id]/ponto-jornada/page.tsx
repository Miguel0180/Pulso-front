"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Sidebar from "../../../../components/menu";
import Header from "../../../../components/header";
import { useTheme } from "../../../../context/ThemeContext";
import { useAuth } from "../../../../context/AuthContext";
import { API_URL } from "@/lib/api";
import {
  formatarHoraPonto,
  usePontoHoje,
} from "@/lib/ponto-hoje";
import { Camera, X, Check, RefreshCw, LogIn, LogOut, Timer } from "lucide-react";

import pageStyles from "../dashboard/gestao.module.css";
import styles from "./ponto-jornada.module.css";

interface ResumoJornada {
  horasExtrasMes: number;
  faltasMes: number;
  jornadaMediaFormatada: string;
  complianceNR1Percentual: number;
  horasTrabalhadasPorDiaDaSemana: { diaAbreviado: string; mediaHoras: number }[];
}

interface RegistroDia {
  colaborador: string;
  setorNome: string;
  entrada: string;
  saida: string | null;
  horasExtras: number;
  status: string;
}

interface RespostaPonto {
  tipo?: string;
  horario?: string;
  colaborador?: string;
  [key: string]: unknown;
}

function hojeISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function formatarHora(iso: string | null) {
  return formatarHoraPonto(iso);
}

function statusClasse(status: string) {
  const s = status.toLowerCase();
  if (s.includes("atraso") || s.includes("falta") || s.includes("critico")) return styles.pillCritical;
  if (s.includes("extra") || s.includes("atencao")) return styles.pillWatch;
  return styles.pillGood;
}

/* ---------------- Widget: Bater Ponto (aparece pra todos) ---------------- */

function BaterPontoWidget({ empresaId, token }: { empresaId: string; token: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const {
    ponto,
    totalFormatado,
    proximaBatida,
    emAndamento,
    registrarBatida,
  } = usePontoHoje(empresaId);

  const [cameraAberta, setCameraAberta] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const pararCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const abrirCamera = async () => {
    setErro(null);
    setSucesso(null);
    setFotoCapturada(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraAberta(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 0);
    } catch {
      setErro("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
    }
  };

  const fecharCamera = () => {
    pararCamera();
    setCameraAberta(false);
    setFotoCapturada(null);
  };

  const capturarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setFotoCapturada(dataUrl);
    pararCamera();
  };

  const refazerFoto = () => {
    abrirCamera();
  };

  const confirmarPonto = async () => {
    if (!fotoCapturada) return;
    setEnviando(true);
    setErro(null);

    const base64Puro = fotoCapturada.split(",")[1] ?? fotoCapturada;

    try {
      const res = await fetch(`${API_URL}/api/app/empresas/${empresaId}/ponto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fotoBase64: base64Puro }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setErro("Sua sessão expirou ou você não tem permissão para bater ponto.");
        } else {
          const corpo = await res.text().catch(() => "");
          console.error("DEBUG — corpo erro ao bater ponto:", corpo);
          setErro("Não foi possível registrar o ponto agora. Tente novamente.");
        }
        return;
      }

      // A API pode devolver dados do registro (tipo/horário/colaborador).
      // Se vier algo utilizável, mostramos uma mensagem mais específica;
      // caso contrário, caímos numa mensagem genérica de sucesso.
      let mensagemSucesso = "Ponto registrado com sucesso!";
      let tipoApi: string | null = null;
      let horarioIso: string | null = null;
      try {
        const corpo = await res.text();
        if (corpo) {
          const dados: RespostaPonto = JSON.parse(corpo);
          tipoApi = dados.tipo ? String(dados.tipo) : null;
          horarioIso = dados.horario ? String(dados.horario) : null;
          const horarioFmt = horarioIso ? formatarHora(horarioIso) : null;
          if (tipoApi && horarioFmt) {
            mensagemSucesso = `${tipoApi} registrada às ${horarioFmt}.`;
          } else if (horarioFmt) {
            mensagemSucesso = `Ponto registrado às ${horarioFmt}.`;
          }
        }
      } catch {
        /* corpo vazio ou não-JSON, mantém mensagem genérica */
      }

      registrarBatida({ tipo: tipoApi, horario: horarioIso });
      setSucesso(mensagemSucesso);
      setCameraAberta(false);
      setFotoCapturada(null);
    } catch (e) {
      console.error("DEBUG — erro de rede/CORS:", e);
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    return () => pararCamera();
  }, [pararCamera]);

  return (
    <div className={styles.pontoCard}>
      <div className={styles.pontoHeader}>
        <div>
          <div className={pageStyles.sectionTitle}>Bater Ponto</div>
          <p className={pageStyles.sectionSubtitle}>Registre sua entrada ou saída com uma foto.</p>
        </div>
      </div>

      <div className={styles.statusDia}>
        <div className={styles.statusItem}>
          <div className={styles.statusIcon} aria-hidden>
            <LogIn size={16} />
          </div>
          <div>
            <div className={styles.statusLabel}>Entrada</div>
            <div className={styles.statusValue}>{formatarHora(ponto?.entrada ?? null)}</div>
          </div>
        </div>
        <div className={styles.statusItem}>
          <div className={styles.statusIcon} aria-hidden>
            <LogOut size={16} />
          </div>
          <div>
            <div className={styles.statusLabel}>Saída</div>
            <div className={styles.statusValue}>{formatarHora(ponto?.saida ?? null)}</div>
          </div>
        </div>
        <div className={`${styles.statusItem} ${styles.statusItemDestaque}`}>
          <div className={styles.statusIcon} aria-hidden>
            <Timer size={16} />
          </div>
          <div>
            <div className={styles.statusLabel}>
              {emAndamento ? "Horas hoje (em andamento)" : "Total de horas hoje"}
            </div>
            <div className={styles.statusValue}>{totalFormatado}</div>
          </div>
        </div>
      </div>

      {!cameraAberta && !fotoCapturada && (
        <button type="button" className={styles.abrirCameraBtn} onClick={abrirCamera}>
          <Camera size={18} />
          {proximaBatida === "entrada"
            ? "Abrir câmera e registrar entrada"
            : "Abrir câmera e registrar saída"}
        </button>
      )}

      {cameraAberta && !fotoCapturada && (
        <div className={styles.cameraBox}>
          <video ref={videoRef} autoPlay playsInline muted className={styles.videoPreview} />
          <div className={styles.cameraActions}>
            <button type="button" className={styles.secundarioBtn} onClick={fecharCamera}>
              <X size={16} /> Cancelar
            </button>
            <button type="button" className={styles.capturarBtn} onClick={capturarFoto}>
              <Camera size={16} /> Capturar
            </button>
          </div>
        </div>
      )}

      {fotoCapturada && (
        <div className={styles.cameraBox}>
          <img src={fotoCapturada} alt="Foto capturada" className={styles.fotoPreview} />
          <div className={styles.cameraActions}>
            <button type="button" className={styles.secundarioBtn} onClick={refazerFoto} disabled={enviando}>
              <RefreshCw size={16} /> Refazer
            </button>
            <button type="button" className={styles.confirmarBtn} onClick={confirmarPonto} disabled={enviando}>
              <Check size={16} /> {enviando ? "Enviando..." : "Confirmar ponto"}
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {erro && <p className={styles.msgErro}>{erro}</p>}
      {sucesso && <p className={styles.msgSucesso}>{sucesso}</p>}
    </div>
  );
}

/* ---------------- Bloco: Resumo + Detalhe do dia (só administrador) ---------------- */

function ResumoJornadaAdmin({ empresaId, token }: { empresaId: string; token: string | null }) {
  const [resumo, setResumo] = useState<ResumoJornada | null>(null);
  const [carregandoResumo, setCarregandoResumo] = useState(true);
  const [erroResumo, setErroResumo] = useState<string | null>(null);

  // Fonte da verdade é o backend: se ele negar acesso (401/403), entendemos
  // que este usuário não é administrador e escondemos a seção inteira,
  // sem mostrar mensagem de erro (não é uma falha, é o comportamento esperado).
  const [acessoNegado, setAcessoNegado] = useState(false);

  const [dataSelecionada, setDataSelecionada] = useState(hojeISO());
  const [registros, setRegistros] = useState<RegistroDia[]>([]);
  const [carregandoDia, setCarregandoDia] = useState(true);
  const [erroDia, setErroDia] = useState<string | null>(null);

  useEffect(() => {
    async function buscarResumo() {
      try {
        setCarregandoResumo(true);
        setErroResumo(null);
        const res = await fetch(`${API_URL}/api/painel/empresas/${empresaId}/jornada/resumo`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setAcessoNegado(true);
          } else {
            setErroResumo("Não foi possível carregar o resumo de jornada.");
          }
          return;
        }
        const data: ResumoJornada = await res.json();
        setResumo(data);
      } catch (e) {
        console.error("DEBUG — erro de rede/CORS ao buscar resumo:", e);
        setErroResumo("Não foi possível conectar ao servidor.");
      } finally {
        setCarregandoResumo(false);
      }
    }
    buscarResumo();
  }, [empresaId, token]);

  useEffect(() => {
    if (acessoNegado) return;

    async function buscarDia() {
      try {
        setCarregandoDia(true);
        setErroDia(null);
        const res = await fetch(
          `${API_URL}/api/painel/empresas/${empresaId}/jornada/dia?data=${dataSelecionada}`,
          { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
        );
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setAcessoNegado(true);
          } else {
            setErroDia("Não foi possível carregar os registros do dia.");
          }
          return;
        }
        const data: RegistroDia[] = await res.json();
        setRegistros(data);
      } catch (e) {
        console.error("DEBUG — erro de rede/CORS ao buscar registros do dia:", e);
        setErroDia("Não foi possível conectar ao servidor.");
      } finally {
        setCarregandoDia(false);
      }
    }
    buscarDia();
  }, [empresaId, token, dataSelecionada, acessoNegado]);

  const maxHoras = resumo
    ? Math.max(...resumo.horasTrabalhadasPorDiaDaSemana.map((d) => d.mediaHoras), 1)
    : 1;

  // Sem permissão no backend = simplesmente não mostra a seção,
  // sem mensagem de erro (usuário comum não deve ver isso como um problema).
  if (acessoNegado) return null;

  return (
    <>
      <div className={styles.panel}>
        <div className={pageStyles.sectionTitle} style={{ marginBottom: 4 }}>Resumo do mês</div>
        <p className={pageStyles.sectionSubtitle} style={{ marginBottom: 16 }}>
          Indicadores gerais de jornada da empresa.
        </p>

        {carregandoResumo && <p>Carregando resumo...</p>}
        {erroResumo && <p className={styles.msgErro}>{erroResumo}</p>}

        {resumo && !carregandoResumo && !erroResumo && (
          <>
            <div className={styles.kpiRow}>
              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Horas extras (mês)</div>
                <div className={styles.kpiValue}>{resumo.horasExtrasMes}h</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Faltas (mês)</div>
                <div className={styles.kpiValue}>{resumo.faltasMes}</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Jornada média</div>
                <div className={styles.kpiValue}>{resumo.jornadaMediaFormatada}</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Compliance NR-1</div>
                <div className={styles.kpiValue}>{resumo.complianceNR1Percentual}%</div>
              </div>
            </div>

            <div className={styles.semanaChart}>
              {resumo.horasTrabalhadasPorDiaDaSemana.map((d) => (
                <div className={styles.semanaCol} key={d.diaAbreviado}>
                  <div
                    className={styles.semanaBar}
                    style={{ height: `${Math.max((d.mediaHoras / maxHoras) * 100, 4)}%` }}
                    title={`${d.mediaHoras}h`}
                  />
                  <span className={styles.semanaLabel}>{d.diaAbreviado}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className={styles.panel}>
        <div className={styles.diaHeader}>
          <div>
            <div className={pageStyles.sectionTitle} style={{ marginBottom: 4 }}>Registros do dia</div>
            <p className={pageStyles.sectionSubtitle}>Entradas e saídas por colaborador.</p>
          </div>
          <input
            type="date"
            className={styles.dateInput}
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
            max={hojeISO()}
          />
        </div>

        {carregandoDia && <p>Carregando registros...</p>}
        {erroDia && <p className={styles.msgErro}>{erroDia}</p>}

        {!carregandoDia && !erroDia && (
          registros.length === 0 ? (
            <p className={styles.vazio}>Nenhum registro para esta data.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Setor</th>
                  <th>Entrada</th>
                  <th>Saída</th>
                  <th>H. extras</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r, i) => (
                  <tr key={i}>
                    <td>{r.colaborador}</td>
                    <td>{r.setorNome}</td>
                    <td>{formatarHora(r.entrada)}</td>
                    <td>{formatarHora(r.saida)}</td>
                    <td>{r.horasExtras}h</td>
                    <td>
                      <span className={statusClasse(r.status)}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </>
  );
}

/* ---------------- Página principal ---------------- */

export default function PontoJornadaPage() {
  const { tema, toggleTema } = useTheme();
  const { token } = useAuth();
  const params = useParams();
  const empresaId = params?.id as string;

  return (
    <div className={pageStyles.page} data-theme={tema}>
      <Sidebar />

      <main className={pageStyles.main}>
        <Header tema={tema} toggleTema={toggleTema} denunciasAbertas={2} />

        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>Ponto & Jornada</h2>
            <p className={pageStyles.sectionSubtitle}>
              Registre o ponto e acompanhe a jornada da equipe.
            </p>
          </div>
        </div>

        <BaterPontoWidget empresaId={empresaId} token={token} />

        <ResumoJornadaAdmin empresaId={empresaId} token={token} />
      </main>
    </div>
  );
}