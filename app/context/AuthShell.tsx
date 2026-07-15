"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

interface AuthShellProps {
  children: React.ReactNode;
}

export default function AuthShell({ children }: AuthShellProps) {
  const { token, carregando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && !token) {
      router.replace("/login");
    }
  }, [carregando, token, router]);

  // Enquanto o AuthContext ainda está lendo o localStorage/sessionStorage,
  // não renderiza nada pra evitar "flash" de conteúdo protegido
  if (carregando) {
    return null;
  }

  // Sem token: não renderiza (o useEffect acima já disparou o redirect pro /login)
  if (!token) {
    return null;
  }

  return <>{children}</>;
}