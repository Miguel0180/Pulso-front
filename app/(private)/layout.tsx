"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import SkipLink from "../components/skip-link";

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const { token, carregando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && !token) {
      router.replace("/login");
    }
  }, [carregando, token, router]);

  if (carregando || !token) return null;

  return (
    <>
      <SkipLink />
      <div id="conteudo-principal" tabIndex={-1}>
        {children}
      </div>
    </>
  );
}
