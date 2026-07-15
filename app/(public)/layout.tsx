"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { token, carregando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && token) {
      router.replace("/inicio");
    }
  }, [carregando, token, router]);

  if (carregando) return null;

  return <>{children}</>;
}
