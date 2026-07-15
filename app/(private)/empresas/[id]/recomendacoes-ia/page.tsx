"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Rota antiga — redireciona para /recomendacoes */
export default function RecomendacoesIaRedirect() {
  const params = useParams();
  const router = useRouter();
  const empresaId = params?.id as string;

  useEffect(() => {
    if (empresaId) {
      router.replace(`/empresas/${empresaId}/recomendacoes`);
    }
  }, [empresaId, router]);

  return null;
}
