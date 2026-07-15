"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { API_URL } from "@/lib/api";
import { Loader2 } from "lucide-react";
import styles from "./empresa-loading.module.css";

/**
 * Seleciona a empresa ativa e atualiza o token de sessão.
 * Endpoints /api/app/ exigem o vínculo da empresa (POST /selecionar).
 */
export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const empresaId = params?.id as string | undefined;
  const { token, atualizarToken } = useAuth();
  const [pronto, setPronto] = useState(false);
  const empresaSelecionada = useRef<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function selecionarEmpresa() {
      if (!token || !empresaId) {
        if (!cancelado) setPronto(true);
        return;
      }

      if (empresaSelecionada.current === empresaId) {
        if (!cancelado) setPronto(true);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/empresas/${empresaId}/selecionar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.token && !cancelado) {
            atualizarToken(data.token);
          }
        }
        empresaSelecionada.current = empresaId;
      } catch {
        /* segue com token atual; páginas tratam erro individualmente */
      } finally {
        if (!cancelado) setPronto(true);
      }
    }

    setPronto(false);
    selecionarEmpresa();

    return () => {
      cancelado = true;
    };
  }, [empresaId, token, atualizarToken]);

  if (!pronto) {
    return (
      <div className={styles.estado}>
        <Loader2 size={22} className={styles.spinner} />
        <span>Preparando ambiente da empresa...</span>
      </div>
    );
  }

  return <>{children}</>;
}
