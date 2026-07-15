"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Permissao =
  | "VISUALIZAR_DASHBOARD"
  | "GERENCIAR_EMPRESA"
  | "GERENCIAR_CARGOS"
  | "GERENCIAR_MEMBROS"
  | "GERENCIAR_SETORES"
  | "GERENCIAR_PESQUISAS"
  | "RESPONDER_PESQUISAS"
  | "GERENCIAR_DENUNCIAS"
  | "RESPONDER_DENUNCIAS"
  | "GERENCIAR_JORNADAS"
  | "REGISTRAR_PONTO"
  | string;

interface EmpresaContexto {
  id?: number;
  nome?: string;
  permissoes: Permissao[];
  proprietario?: boolean;
}

interface EmpresaContextType {
  empresa: EmpresaContexto | null;
  setEmpresa: (empresa: EmpresaContexto | null) => void;
  temPermissao: (...permissoes: Permissao[]) => boolean;
  ehGestor: boolean;
  carregandoPermissoes: boolean;
  setCarregandoPermissoes: (v: boolean) => void;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresa] = useState<EmpresaContexto | null>(null);
  const [carregandoPermissoes, setCarregandoPermissoes] = useState(true);

  const temPermissao = useCallback(
    (...necessarias: Permissao[]) => {
      if (!empresa) return false;
      if (empresa.proprietario) return true;
      const atuais = empresa.permissoes ?? [];
      if (atuais.length === 0) return false;
      return necessarias.some((p) => atuais.includes(p));
    },
    [empresa]
  );

  /** Tem alguma permissão de gestão (vê painel completo). */
  const ehGestor = useMemo(() => {
    if (!empresa) return false;
    if (empresa.proprietario) return true;
    return temPermissao(
      "GERENCIAR_EMPRESA",
      "GERENCIAR_MEMBROS",
      "GERENCIAR_SETORES",
      "GERENCIAR_PESQUISAS",
      "GERENCIAR_JORNADAS",
      "GERENCIAR_DENUNCIAS",
      "GERENCIAR_CARGOS"
    );
  }, [empresa, temPermissao]);

  const value = useMemo(
    () => ({
      empresa,
      setEmpresa,
      temPermissao,
      ehGestor,
      carregandoPermissoes,
      setCarregandoPermissoes,
    }),
    [empresa, temPermissao, ehGestor, carregandoPermissoes]
  );

  return <EmpresaContext.Provider value={value}>{children}</EmpresaContext.Provider>;
}

export function useEmpresa() {
  const ctx = useContext(EmpresaContext);
  if (!ctx) {
    throw new Error("useEmpresa deve ser usado dentro de um EmpresaProvider");
  }
  return ctx;
}
