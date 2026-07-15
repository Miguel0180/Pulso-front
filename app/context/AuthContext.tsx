"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { API_URL } from "@/lib/api";

interface Usuario {
  nome?: string;
  email?: string;
  papel?: string;
}

interface Credenciais {
  email: string;
  senha: string;
}

interface CadastroDados {
  nomeCompleto: string;
  email: string;
  senha: string;
}

interface ResultadoAuth {
  ok: boolean;
  erro?: string;
  precisaVerificacao?: boolean;
}

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  carregando: boolean;
  login: (credenciais: Credenciais, manterConectado?: boolean) => Promise<ResultadoAuth>;
  cadastrar: (dados: CadastroDados) => Promise<ResultadoAuth>;
  confirmarCodigo: (token: string, usuario: Usuario) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CHAVE_TOKEN = "pulso_token";
const CHAVE_USUARIO = "pulso_usuario";
const CHAVE_MANTER = "pulso_manter_conectado";

function lerStorage(chave: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(chave) ?? window.sessionStorage.getItem(chave);
}

function limparStorage() {
  window.localStorage.removeItem(CHAVE_TOKEN);
  window.localStorage.removeItem(CHAVE_USUARIO);
  window.sessionStorage.removeItem(CHAVE_TOKEN);
  window.sessionStorage.removeItem(CHAVE_USUARIO);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const tokenSalvo = lerStorage(CHAVE_TOKEN);
    const usuarioBruto = lerStorage(CHAVE_USUARIO);

    if (tokenSalvo) setToken(tokenSalvo);

    if (usuarioBruto) {
      try {
        setUser(JSON.parse(usuarioBruto));
      } catch {
        setUser(null);
      }
    }

    setCarregando(false);
  }, []);

  function salvarSessao(novoToken: string, novoUsuario: Usuario, manterConectado: boolean) {
    const storage = manterConectado ? window.localStorage : window.sessionStorage;
    storage.setItem(CHAVE_TOKEN, novoToken);
    storage.setItem(CHAVE_USUARIO, JSON.stringify(novoUsuario));
    window.localStorage.setItem(CHAVE_MANTER, manterConectado ? "1" : "0");

    setToken(novoToken);
    setUser(novoUsuario);
  }

  async function login({ email, senha }: Credenciais, manterConectado = false): Promise<ResultadoAuth> {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 400) {
          return { ok: false, erro: "E-mail ou senha incorretos." };
        }
        return { ok: false, erro: "Não foi possível entrar agora. Tente novamente em instantes." };
      }

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      const novoToken =
        data?.token ?? data?.accessToken ?? data?.jwt ?? data?.access_token ?? null;

      // Guarda a preferência mesmo se o token ainda não veio (precisa do código primeiro)
      window.localStorage.setItem(CHAVE_MANTER, manterConectado ? "1" : "0");

      if (!novoToken) {
        // API só confirmou o envio do código de verificação por e-mail
        return { ok: true, precisaVerificacao: true };
      }

      const novoUsuario: Usuario = { nome: data?.nome, email: data?.email, papel: data?.papel };
      salvarSessao(novoToken, novoUsuario, manterConectado);
      return { ok: true };
    } catch {
      return { ok: false, erro: "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente." };
    }
  }

  async function cadastrar({ nomeCompleto, email, senha }: CadastroDados): Promise<ResultadoAuth> {
    try {
      const res = await fetch(`${API_URL}/api/auth/cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomeCompleto, email, senha }),
      });

      if (!res.ok) {
        if (res.status === 409) {
          return { ok: false, erro: "Já existe uma conta com este e-mail." };
        }
        if (res.status === 400) {
          return { ok: false, erro: "Verifique os dados informados e tente novamente." };
        }
        return { ok: false, erro: "Não foi possível criar a conta agora. Tente novamente em instantes." };
      }

      const data = await res.json();
      const novoToken = data?.token ?? null;

      if (!novoToken) {
        return { ok: true, precisaVerificacao: true };
      }

      const novoUsuario: Usuario = { nome: data?.nome, email: data?.email, papel: data?.papel };
      salvarSessao(novoToken, novoUsuario, true); // cadastro sempre mantém conectado, como já era antes

      return { ok: true };
    } catch {
      return { ok: false, erro: "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente." };
    }
  }

  // Usado pela tela de verificar-código, depois do POST /api/auth/verificar-codigo
  function confirmarCodigo(novoToken: string, novoUsuario: Usuario) {
    const manterConectado = window.localStorage.getItem(CHAVE_MANTER) === "1";
    salvarSessao(novoToken, novoUsuario, manterConectado);
  }

  async function logout() {
    const tokenAtual = token ?? lerStorage(CHAVE_TOKEN);

    try {
      if (tokenAtual) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${tokenAtual}` },
        });
      }
    } catch {
      // Mesmo se o backend falhar/estiver fora, seguimos limpando a sessão local
    } finally {
      limparStorage();
      window.localStorage.removeItem(CHAVE_MANTER);
      setToken(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, token, carregando, login, cadastrar, confirmarCodigo, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}