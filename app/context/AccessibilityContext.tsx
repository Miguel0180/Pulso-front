"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type TamanhoFonte = "normal" | "grande" | "extra";

interface AccessibilityContextType {
  fonte: TamanhoFonte;
  setFonte: (fonte: TamanhoFonte) => void;
  libras: boolean;
  setLibras: (ligado: boolean) => void;
}

const CHAVE_FONTE = "pulso_fonte";
const CHAVE_LIBRAS = "pulso_libras";
const ESCALAS: Record<TamanhoFonte, string> = {
  normal: "1",
  grande: "1.15",
  extra: "1.3",
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

function aplicarFonteNoHtml(fonte: TamanhoFonte) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-font-scale", fonte);
  document.documentElement.style.setProperty("--font-scale", ESCALAS[fonte]);
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [fonte, setFonteState] = useState<TamanhoFonte>("normal");
  const [libras, setLibrasState] = useState(false);

  useEffect(() => {
    const fonteSalva = localStorage.getItem(CHAVE_FONTE) as TamanhoFonte | null;
    if (fonteSalva === "normal" || fonteSalva === "grande" || fonteSalva === "extra") {
      setFonteState(fonteSalva);
      aplicarFonteNoHtml(fonteSalva);
    } else {
      aplicarFonteNoHtml("normal");
    }

    setLibrasState(localStorage.getItem(CHAVE_LIBRAS) === "1");
  }, []);

  const setFonte = useCallback((nova: TamanhoFonte) => {
    setFonteState(nova);
    localStorage.setItem(CHAVE_FONTE, nova);
    aplicarFonteNoHtml(nova);
  }, []);

  const setLibras = useCallback((ligado: boolean) => {
    setLibrasState(ligado);
    localStorage.setItem(CHAVE_LIBRAS, ligado ? "1" : "0");
  }, []);

  return (
    <AccessibilityContext.Provider value={{ fonte, setFonte, libras, setLibras }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error("useAccessibility deve ser usado dentro de um AccessibilityProvider");
  }
  return ctx;
}
