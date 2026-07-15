"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useEmpresa } from "../../../context/EmpresaContext";
import { API_URL } from "@/lib/api";
import { Loader2 } from "lucide-react";
import styles from "./empresa-loading.module.css";

/**
 * Seleciona a empresa ativa, atualiza o token e carrega permissões do vínculo.
 */
export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const empresaId = params?.id as string | undefined;
  const { token, atualizarToken } = useAuth();
  const { setEmpresa, setCarregandoPermissoes } = useEmpresa();
  const [pronto, setPronto] = useState(false);
  const empresaSelecionada = useRef<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function selecionarEmpresa() {
      if (!token || !empresaId) {
        if (!cancelado) {
          setCarregandoPermissoes(false);
          setPronto(true);
        }
        return;
      }

      if (empresaSelecionada.current === empresaId) {
        if (!cancelado) setPronto(true);
        return;
      }

      setCarregandoPermissoes(true);

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

          const emp = data?.empresa;
          if (emp && !cancelado) {
            setEmpresa({
              id: emp.id,
              nome: emp.nome,
              permissoes: Array.isArray(emp.permissoes) ? emp.permissoes : [],
              proprietario: Boolean(emp.proprietario),
            });
          } else if (!cancelado) {
            // Fallback: GET empresa
            const resEmp = await fetch(`${API_URL}/api/empresas/${empresaId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (resEmp.ok) {
              const emp2 = await resEmp.json();
              setEmpresa({
                id: emp2.id,
                nome: emp2.nome,
                permissoes: Array.isArray(emp2.permissoes) ? emp2.permissoes : [],
                proprietario: Boolean(emp2.proprietario),
              });
            }
          }
        }
        empresaSelecionada.current = empresaId;
      } catch {
        /* segue; menu fica sem itens restritos até haver permissões */
      } finally {
        if (!cancelado) {
          setCarregandoPermissoes(false);
          setPronto(true);
        }
      }
    }

    setPronto(false);
    selecionarEmpresa();

    return () => {
      cancelado = true;
    };
  }, [empresaId, token, atualizarToken, setEmpresa, setCarregandoPermissoes]);

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
