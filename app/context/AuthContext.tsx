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
  confirmarCodigo: (token: string, usuario: Usuario, dispositivoToken?: string | null) => void;
  atualizarToken: (novoToken: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CHAVE_TOKEN = "pulso_token";
const CHAVE_USUARIO = "pulso_usuario";
const CHAVE_MANTER = "pulso_manter_conectado";
/** Token do dispositivo confiável (backend: ~90 dias). Não limpa no logout. */
const CHAVE_DISPOSITIVO = "pulso_dispositivo_token";

function lerStorage(chave: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(chave) ?? window.sessionStorage.getItem(chave);
}

function limparSessaoStorage() {
  window.localStorage.removeItem(CHAVE_TOKEN);
  window.localStorage.removeItem(CHAVE_USUARIO);
  window.sessionStorage.removeItem(CHAVE_TOKEN);
  window.sessionStorage.removeItem(CHAVE_USUARIO);
}

function lerDispositivoToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CHAVE_DISPOSITIVO);
}

function salvarDispositivoToken(dispositivoToken?: string | null) {
  if (!dispositivoToken || typeof window === "undefined") return;
  window.localStorage.setItem(CHAVE_DISPOSITIVO, dispositivoToken);
}

function requerVerificacaoNoPayload(data: Record<string, unknown> | null) {
  if (!data) return false;
  const flag = data.requerVerificacao ?? data.requer_verificacao;
  return flag === true || flag === "true";
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
      const dispositivoToken = lerDispositivoToken();

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(dispositivoToken ? { "X-Dispositivo-Token": dispositivoToken } : {}),
        },
        body: JSON.stringify({
          email,
          senha,
          ...(dispositivoToken ? { dispositivoToken } : {}),
        }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 400) {
          return { ok: false, erro: "E-mail ou senha incorretos." };
        }
        return { ok: false, erro: "Não foi possível entrar agora. Tente novamente em instantes." };
      }

      let data: Record<string, unknown> | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      window.localStorage.setItem(CHAVE_MANTER, manterConectado ? "1" : "0");

      // Backend indica se precisa da tela de código (dispositivo novo / não confiável)
      if (requerVerificacaoNoPayload(data)) {
        return { ok: true, precisaVerificacao: true };
      }

      const novoToken =
        (data?.token as string | undefined) ??
        (data?.accessToken as string | undefined) ??
        (data?.jwt as string | undefined) ??
        (data?.access_token as string | undefined) ??
        null;

      if (!novoToken) {
        // Sem token e sem flag explícita: trata como verificação necessária
        return { ok: true, precisaVerificacao: true };
      }

      salvarDispositivoToken(
        (data?.dispositivoToken as string | undefined) ??
          (data?.dispositivo_token as string | undefined)
      );

      const novoUsuario: Usuario = {
        nome: data?.nome as string | undefined,
        email: (data?.email as string | undefined) ?? email,
        papel: data?.papel as string | undefined,
      };
      salvarSessao(novoToken, novoUsuario, manterConectado);
      return { ok: true, precisaVerificacao: false };
    } catch {
      return {
        ok: false,
        erro: "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
      };
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

      // Cadastro sempre exige verificação por e-mail
      window.localStorage.setItem(CHAVE_MANTER, "1");
      return { ok: true, precisaVerificacao: true };
    } catch {
      return {
        ok: false,
        erro: "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
      };
    }
  }

  function confirmarCodigo(
    novoToken: string,
    novoUsuario: Usuario,
    dispositivoToken?: string | null
  ) {
    const manterConectado = window.localStorage.getItem(CHAVE_MANTER) === "1";
    salvarDispositivoToken(dispositivoToken);
    salvarSessao(novoToken, novoUsuario, manterConectado);
  }

  function atualizarToken(novoToken: string) {
    const manterConectado = window.localStorage.getItem(CHAVE_MANTER) === "1";
    const storage = manterConectado ? window.localStorage : window.sessionStorage;
    storage.setItem(CHAVE_TOKEN, novoToken);
    setToken(novoToken);
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
      /* limpa sessão local mesmo se o backend falhar */
    } finally {
      limparSessaoStorage();
      window.localStorage.removeItem(CHAVE_MANTER);
      setToken(null);
      setUser(null);
      // Mantém CHAVE_DISPOSITIVO — dispositivo continua confiável (~90 dias)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, token, carregando, login, cadastrar, confirmarCodigo, atualizarToken, logout }}
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
