"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Dashboard from "./dashboard/page";
import { useAuth } from "../../../context/AuthContext";
import { API_URL } from "@/lib/api";
import { Loader2 } from "lucide-react";
import styles from "./empresa-loading.module.css";

interface EmpresaInfo {
  id: number;
  nome: string;
  descricao?: string;
  codigoConvite?: string;
  cargoNome?: string;
  setorNome?: string;
  permissoes?: string[];
  totalMembros?: number;
  totalSetores?: number;
  criadoEm?: string;
}

export default function EmpresaPage() {
  const params = useParams();
  const router = useRouter();
  const empresaId = params?.id;
  const { token, logout } = useAuth();

  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarEmpresa() {
      // O layout de (private) já garante que não chegamos aqui sem token,
      // mas o guard abaixo cobre o instante entre montar e o layout redirecionar.
      if (!token) return;

      if (!empresaId) {
        setErro("Empresa inválida.");
        setCarregando(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/empresas/${empresaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          logout();
          router.push("/login");
          return;
        }

        if (res.status === 404) {
          setErro("Você não tem acesso a esta empresa ou ela não existe.");
          setCarregando(false);
          return;
        }

        if (!res.ok) {
          setErro("Não foi possível carregar os dados da empresa.");
          setCarregando(false);
          return;
        }

        const data: EmpresaInfo = await res.json();
        setEmpresa(data);
      } catch {
        setErro("Não foi possível conectar ao servidor.");
      } finally {
        setCarregando(false);
      }
    }

    carregarEmpresa();
  }, [empresaId, router, token]);

  if (carregando) {
    return (
      <div className={styles.estado}>
        <Loader2 size={22} className={styles.spinner} />
        <span>Carregando empresa...</span>
      </div>
    );
  }

  if (erro || !empresa) {
    return (
      <div className={styles.estado}>
        <p className={styles.erro}>{erro ?? "Empresa não encontrada."}</p>
      </div>
    );
  }

  return <Dashboard empresa={empresa} />;
}