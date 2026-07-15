"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "@/lib/api";
import { Loader2 } from "lucide-react";
import styles from "./verificar-codigo.module.css";

const TAMANHO_CODIGO = 6;

export default function VerificarCodigoConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const { confirmarCodigo } = useAuth();

  const [digitos, setDigitos] = useState<string[]>(Array(TAMANHO_CODIGO).fill(""));
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [reenviando, setReenviando] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  function atualizarDigito(index: number, valor: string) {
    const v = valor.replace(/\D/g, "").slice(-1);
    const novos = [...digitos];
    novos[index] = v;
    setDigitos(novos);
    setErro(null);

    if (v && index < TAMANHO_CODIGO - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (v && index === TAMANHO_CODIGO - 1) {
      const codigoCompleto = novos.join("");
      if (codigoCompleto.length === TAMANHO_CODIGO) {
        verificarCodigo(codigoCompleto);
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digitos[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const texto = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, TAMANHO_CODIGO);
    if (!texto) return;

    const novos = Array(TAMANHO_CODIGO).fill("");
    texto.split("").forEach((c, i) => (novos[i] = c));
    setDigitos(novos);

    const proximoVazio = novos.findIndex((d) => !d);
    const focoIndex = proximoVazio === -1 ? TAMANHO_CODIGO - 1 : proximoVazio;
    inputsRef.current[focoIndex]?.focus();

    if (texto.length === TAMANHO_CODIGO) {
      verificarCodigo(texto);
    }
  }

  async function verificarCodigo(codigo: string) {
    setCarregando(true);
    setErro(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/verificar-codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });

      if (!res.ok) {
        setErro("Código inválido ou expirado. Tente novamente.");
        setDigitos(Array(TAMANHO_CODIGO).fill(""));
        inputsRef.current[0]?.focus();
        return;
      }

      const data = await res.json();

      confirmarCodigo(data.token, {
        nome: data.nome,
        email: data.email ?? email ?? undefined,
        papel: data.papel,
      }, data.dispositivoToken ?? data.dispositivo_token);

      router.push("/inicio");
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  async function reenviarCodigo() {
    if (!email) return;
    setReenviando(true);
    setErro(null);

    try {
      await fetch(`${API_URL}/api/auth/reenviar-codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // ajuste essa rota se o endpoint real de reenvio tiver outro nome
    } catch {
      setErro("Não foi possível reenviar o código.");
    } finally {
      setReenviando(false);
    }
  }

  const codigoCompleto = digitos.every((d) => d !== "");

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          PULSO <span>ÉTICO</span>
        </div>

        <h1 className={styles.titulo}>Verifique seu e-mail</h1>
        <p className={styles.subtitulo}>
          Enviamos um código de 6 dígitos{email ? <> para <strong>{email}</strong></> : null}.
          Digite abaixo para confirmar.
        </p>

        <div className={styles.codigoRow} onPaste={handlePaste}>
          {digitos.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => atualizarDigito(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`${styles.digitoInput} ${erro ? styles.digitoErro : ""}`}
              disabled={carregando}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {erro && <p className={styles.mensagemErro}>{erro}</p>}

        <button
          className={styles.botaoPrimario}
          disabled={!codigoCompleto || carregando}
          onClick={() => verificarCodigo(digitos.join(""))}
        >
          {carregando ? <Loader2 size={18} className={styles.spinner} /> : "Confirmar código"}
        </button>

        <button
          type="button"
          className={styles.botaoLink}
          onClick={reenviarCodigo}
          disabled={reenviando || !email}
        >
          {reenviando ? "Reenviando..." : "Reenviar código"}
        </button>
      </div>
    </div>
  );
}