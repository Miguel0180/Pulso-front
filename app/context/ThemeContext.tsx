"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Tema = "claro" | "escuro";

interface ThemeContextType {
  tema: Tema;
  toggleTema: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>("claro");

  // Puxa o tema salvo no navegador quando a página carrega
  useEffect(() => {
    const temaSalvo = localStorage.getItem("app-tema") as Tema;
    if (temaSalvo) {
      setTema(temaSalvo);
    }
  }, []);

  const toggleTema = () => {
    setTema((prev) => {
      const novoTema = prev === "claro" ? "escuro" : "claro";
      localStorage.setItem("app-tema", novoTema);
      return novoTema;
    });
  };

  return (
    <ThemeContext.Provider value={{ tema, toggleTema }}>
      {/* Aqui o tema é injetado globalmente */}
      <div data-theme={tema} style={{ minHeight: "100vh" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  }
  return context;
}