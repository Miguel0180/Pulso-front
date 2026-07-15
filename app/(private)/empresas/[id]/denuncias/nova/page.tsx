"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "../../../../../components/menu";
import Header from "../../../../../components/header";
import { useTheme } from "@/app/context/ThemeContext";
import { useAuth } from "../../../../../context/AuthContext";
import { API_URL } from "@/lib/api";
import { Send, CheckCircle2 } from "lucide-react";

import pageStyles from "../../dashboard/gestao.module.css";
import styles from "./nova-denuncia.module.css";

/**
 * Página para QUALQUER usuário autenticado (colaborador ou admin)
 * enviar uma nova denúncia.
 *
 * Endpoint: POST /api/app/empresas/{empresaId}/denuncias
 * Body: { tipo: string, descricao: string }
 */

export default function NovaDenunciaPage() {
  const { tema, toggleTema } = useTheme();
  const { token } = useAuth();
  const params = useParams();
  const empresaId = params?.id as string;

  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const enviarDenuncia = async () => {
    if (!tipo.trim() || !descricao.trim()) {
      setErro("Preencha o tipo e a descrição da denúncia.");
      return;
    }

    setEnviando(true);
    setErro(null);

    try {
      const res = await fetch(
        `${API_URL}/api/app/empresas/${empresaId}/denuncias`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ tipo, descricao }),
        }
      );

      if (!res.ok) {
        const corpo = await res.text().catch(() => "");
        let mensagem = "Não foi possível enviar a denúncia agora. Tente novamente.";
        try {
          const json = JSON.parse(corpo);
          if (json?.mensagem) mensagem = json.mensagem;
        } catch {
          /* corpo não é JSON, mantém mensagem padrão */
        }
        setErro(mensagem);
        return;
      }

      setSucesso(true);
      setTipo("");
      setDescricao("");
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={pageStyles.page} data-theme={tema}>
      <Sidebar />

      <main className={pageStyles.main}>
        <Header tema={tema} toggleTema={toggleTema} />

        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>Nova denúncia</h2>
            <p className={pageStyles.sectionSubtitle}>
              Relate uma situação. Sua denúncia será encaminhada ao administrador.
            </p>
          </div>
        </div>

        <div className={styles.card}>
          {sucesso ? (
            <div className={styles.sucessoBox}>
              <CheckCircle2 size={32} />
              <p>Denúncia enviada com sucesso!</p>
              <button
                type="button"
                className={styles.novaBtn}
                onClick={() => setSucesso(false)}
              >
                Enviar outra denúncia
              </button>
            </div>
          ) : (
            <>
              <label className={styles.label}>
                Tipo
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Ex: Assédio, Discriminação, Conduta inadequada..."
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  disabled={enviando}
                />
              </label>

              <label className={styles.label}>
                Descrição
                <textarea
                  className={styles.textarea}
                  placeholder="Descreva o ocorrido com o máximo de detalhes possível..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={6}
                  disabled={enviando}
                />
              </label>

              {erro && <p className={styles.msgErro}>{erro}</p>}

              <button
                type="button"
                className={styles.enviarBtn}
                onClick={enviarDenuncia}
                disabled={enviando}
              >
                <Send size={16} />
                {enviando ? "Enviando..." : "Enviar denúncia"}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}