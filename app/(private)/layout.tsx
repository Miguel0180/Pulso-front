"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const { token, carregando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && !token) {
      router.replace("/login");
    }
  }, [carregando, token, router]);

  // Enquanto ainda não sabemos se há sessão salva, ou se já sabemos que não há,
  // não renderiza a página protegida (evita "piscar" conteúdo privado).
  if (carregando || !token) return null;

  return <>{children}</>;
}