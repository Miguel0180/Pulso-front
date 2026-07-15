"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Script from "next/script";
import { useAccessibility } from "../context/AccessibilityContext";

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url?: string) => unknown;
    };
  }
}

export default function VLibrasWidget() {
  const { libras } = useAccessibility();
  const [montado, setMontado] = useState(false);
  const [scriptPronto, setScriptPronto] = useState(false);
  const widgetIniciado = useRef(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!libras) return;
    if (typeof window !== "undefined" && window.VLibras) {
      setScriptPronto(true);
    }
  }, [libras]);

  useEffect(() => {
    if (!libras) {
      widgetIniciado.current = false;
      document.getElementById("vlibras-portal")?.remove();
      return;
    }

    if (!montado || !scriptPronto) return;

    let tentativas = 0;
    const id = window.setInterval(() => {
      tentativas += 1;

      if (widgetIniciado.current) {
        window.clearInterval(id);
        return;
      }

      if (!window.VLibras?.Widget || !document.querySelector("#vlibras-portal [vw]")) {
        if (tentativas > 40) window.clearInterval(id);
        return;
      }

      try {
        // eslint-disable-next-line no-new
        new window.VLibras.Widget("https://vlibras.gov.br/app");
        widgetIniciado.current = true;
        window.clearInterval(id);
      } catch (e) {
        console.warn("VLibras: falha ao iniciar o widget", e);
        window.clearInterval(id);
      }
    }, 100);

    return () => window.clearInterval(id);
  }, [libras, scriptPronto, montado]);

  if (!montado || !libras) return null;

  return (
    <>
      <Script
        id="vlibras-plugin"
        src="https://vlibras.gov.br/app/vlibras-plugin.js"
        strategy="afterInteractive"
        onLoad={() => setScriptPronto(true)}
        onReady={() => setScriptPronto(true)}
      />
      {createPortal(
        <div id="vlibras-portal">
          <div {...{ vw: "true" }} className="enabled">
            <div {...{ "vw-access-button": "true" }} className="active" />
            <div {...{ "vw-plugin-wrapper": "true" }}>
              <div className="vw-plugin-top-wrapper" />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
