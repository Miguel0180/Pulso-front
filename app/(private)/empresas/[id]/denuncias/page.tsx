"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Sidebar from "../../../../components/menu";
import Header from "../../../../components/header";
import { useTheme } from "../../../../context/ThemeContext";
import { useAuth } from "../../../../context/AuthContext";
import { API_URL } from "@/lib/api";
import { MessageSquareWarning, Send, X } from "lucide-react";

import pageStyles from "../dashboard/gestao.module.css";
import styles from "./denuncias.module.css";

interface Denuncia {
  id: number;
  setorId: number;
  setorNome: string;
  tipo: string;
  descricao: string;
  status: string;
  criadoEm: string;
}

type FiltroStatus = "TODAS" | "ABERTA" | "RESPONDIDA";

function formatarData(iso: string) {
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
  if (!status) return styles.pillNeutro;
  const s = status.toLowerCase();
  if (s.includes("aberta") || s.includes("pendente")) return styles.pillAberta;
  if (s.includes("andamento")) return styles.pillAndamento;
  if (s.includes("respond") || s.includes("fechad") || s.includes("resolvid")) return styles.pillRespondida;
  return styles.pillNeutro;
}

function ehAberta(status: string) {
  if (!status) return true;
  const s = status.toLowerCase();
  return !s.includes("respond") && !s.includes("fechad") && !s.includes("resolvid");
}

/* ---------------- Painel lateral de resposta ---------------- */

function PainelResposta({
  denuncia,
  empresaId,
  token,
  onFechar,
  onRespondida,
}: {
  denuncia: Denuncia;
  empresaId: string;
  token: string | null;
  onFechar: () => void;
  onRespondida: (atualizada: Denuncia) => void;
}) {
  const [resposta, setResposta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const jaRespondida = !ehAberta(denuncia.status);

  const enviarResposta = async () => {
    if (!resposta.trim()) {
      setErro("Escreva uma resposta antes de enviar.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch(
        `${API_URL}/api/painel/empresas/${empresaId}/denuncias/${denuncia.id}/responder`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ resposta: resposta }),
        }
      );

      if (!res.ok) {
        const corpo = await res.text().catch(() => "");
        let mensagem = "Não foi possível enviar a resposta agora. Tente novamente.";
        try {
          const json = JSON.parse(corpo);
          if (json?.mensagem) mensagem = json.mensagem;
        } catch {
          /* corpo não é JSON */
        }
        setErro(mensagem);
        return;
      }

      const atualizada: Denuncia = await res.json();
      onRespondida(atualizada);
      setResposta("");
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
            <span className={statusClasse(denuncia.status)}>{denuncia.status}</span>
            <h3 className={styles.painelTitulo}>{denuncia.tipo}</h3>
            <p className={styles.painelMeta}>
              Setor: {denuncia.setorNome} · Aberta em {formatarData(denuncia.criadoEm)}
            </p>
          </div>
          <button type="button" className={styles.fecharBtn} onClick={onFechar} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className={styles.painelCorpo}>
          <div className={styles.blocoDescricao}>
            <span className={styles.blocoLabel}>Descrição</span>
            <p className={styles.descricaoTexto}>{denuncia.descricao}</p>
          </div>

          {!jaRespondida ? (
            <div className={styles.blocoResposta}>
              <span className={styles.blocoLabel}>Sua resposta</span>
              <textarea
                className={styles.textarea}
                placeholder="Descreva as providências tomadas ou a resposta para esta denúncia..."
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                rows={6}
                disabled={enviando}
              />
              {erro && <p className={styles.msgErro}>{erro}</p>}
              <button
                type="button"
                className={styles.enviarBtn}
                onClick={enviarResposta}
                disabled={enviando}
              >
                <Send size={16} />
                {enviando ? "Enviando..." : "Enviar resposta"}
              </button>
            </div>
          ) : (
            <div className={styles.blocoResposta}>
              <span className={styles.blocoLabel}>Esta denúncia já foi respondida</span>
              <p className={styles.vazio}>Nenhuma ação adicional é necessária.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Página principal ---------------- */

export default function DenunciasPage() {
  const { tema, toggleTema } = useTheme();
  const { token } = useAuth();
  const params = useParams();
  const empresaId = params?.id as string;

  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroStatus>("TODAS");
  const [selecionada, setSelecionada] = useState<Denuncia | null>(null);

  const buscarDenuncias = useCallback(async () => {
    if (!empresaId) return;
    try {
      setCarregando(true);
      setErro(null);
      const res = await fetch(`${API_URL}/api/painel/empresas/${empresaId}/denuncias`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error();
      const data: Denuncia[] = await res.json();
      setDenuncias(Array.isArray(data) ? data : []);
    } catch {
      setErro("Não foi possível carregar as denúncias.");
    } finally {
      setCarregando(false);
    }
  }, [empresaId, token]);

  useEffect(() => {
    buscarDenuncias();
  }, [buscarDenuncias]);

  const denunciasFiltradas = denuncias.filter((d) => {
    if (filtro === "TODAS") return true;
    if (filtro === "ABERTA") return ehAberta(d.status);
    return !ehAberta(d.status);
  });

  const totalAbertas = denuncias.filter((d) => ehAberta(d.status)).length;

  const handleRespondida = (atualizada: Denuncia) => {
    setDenuncias((prev) => prev.map((d) => (d.id === atualizada.id ? atualizada : d)));
    setSelecionada(atualizada);
  };

  return (
    <div className={pageStyles.page} data-theme={tema}>
      <Sidebar />

      <main className={pageStyles.main}>
        <Header tema={tema} toggleTema={toggleTema} denunciasAbertas={totalAbertas} />

        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>Denúncias</h2>
            <p className={pageStyles.sectionSubtitle}>
              Acompanhe e responda as denúncias enviadas pela equipe.
            </p>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.filtros}>
            <button
              type="button"
              className={`${styles.filtroBtn} ${filtro === "TODAS" ? styles.filtroAtivo : ""}`}
              onClick={() => setFiltro("TODAS")}
            >
              Todas ({denuncias.length})
            </button>
            <button
              type="button"
              className={`${styles.filtroBtn} ${filtro === "ABERTA" ? styles.filtroAtivo : ""}`}
              onClick={() => setFiltro("ABERTA")}
            >
              Abertas ({totalAbertas})
            </button>
            <button
              type="button"
              className={`${styles.filtroBtn} ${filtro === "RESPONDIDA" ? styles.filtroAtivo : ""}`}
              onClick={() => setFiltro("RESPONDIDA")}
            >
              Respondidas ({denuncias.length - totalAbertas})
            </button>
          </div>

          {carregando && <p>Carregando denúncias...</p>}
          {erro && <p className={styles.msgErro}>{erro}</p>}

          {!carregando && !erro && (
            denunciasFiltradas.length === 0 ? (
              <div className={styles.vazioBox}>
                <MessageSquareWarning size={22} />
                <p className={styles.vazio}>Nenhuma denúncia encontrada para este filtro.</p>
              </div>
            ) : (
              <ul className={styles.lista}>
                {denunciasFiltradas.map((d) => (
                  <li
                    key={d.id}
                    className={styles.item}
                    onClick={() => setSelecionada(d)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelecionada(d);
                      }
                    }}
                  >
                    <div className={styles.itemTopo}>
                      <span className={statusClasse(d.status)}>{d.status}</span>
                      <span className={styles.itemData}>{formatarData(d.criadoEm)}</span>
                    </div>
                    <div className={styles.itemTipo}>{d.tipo}</div>
                    <p className={styles.itemDescricao}>{d.descricao}</p>
                    <div className={styles.itemSetor}>Setor: {d.setorNome}</div>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </main>

      {selecionada && (
        <PainelResposta
          denuncia={selecionada}
          empresaId={empresaId}
          token={token}
          onFechar={() => setSelecionada(null)}
          onRespondida={handleRespondida}
        />
      )}
    </div>
  );
}