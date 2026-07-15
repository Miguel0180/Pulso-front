import { Suspense } from "react";
import VerificarCodigoConteudo from "./verificar-codigo-conteudo";

export default function VerificarCodigoPage() {
  return (
    <Suspense fallback={null}>
      <VerificarCodigoConteudo />
    </Suspense>
  );
}