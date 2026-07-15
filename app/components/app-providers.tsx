"use client";

import { AccessibilityProvider } from "../context/AccessibilityContext";
import { EmpresaProvider } from "../context/EmpresaContext";
import VLibrasWidget from "./vlibras";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AccessibilityProvider>
      <EmpresaProvider>
        {children}
        <VLibrasWidget />
      </EmpresaProvider>
    </AccessibilityProvider>
  );
}
