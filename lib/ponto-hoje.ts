"use client";

import { useCallback, useEffect, useState } from "react";

export interface PontoHoje {
  data: string;
  entrada: string | null;
  saida: string | null;
}

const EVENTO = "etico:ponto-hoje";

function chaveStorage(empresaId: string) {
  return `etico:ponto-hoje:${empresaId}`;
}

export function hojeISOLocal() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function lerStorage(empresaId: string): PontoHoje | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(chaveStorage(empresaId));
    if (!raw) return null;
    const dados = JSON.parse(raw) as PontoHoje;
    if (!dados?.data) return null;
    if (dados.data !== hojeISOLocal()) return null;
    return {
      data: dados.data,
      entrada: dados.entrada ?? null,
      saida: dados.saida ?? null,
    };
  } catch {
    return null;
  }
}

function gravarStorage(empresaId: string, ponto: PontoHoje) {
  window.localStorage.setItem(chaveStorage(empresaId), JSON.stringify(ponto));
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: { empresaId, ponto } }));
}

export function formatarHoraPonto(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Formata duração em milissegundos como "8h 30m". */
export function formatarDuracao(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return "0h 00m";
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function calcularTotalMs(ponto: PontoHoje | null, agora = Date.now()) {
  if (!ponto?.entrada) return 0;
  const inicio = new Date(ponto.entrada).getTime();
  if (!Number.isFinite(inicio)) return 0;
  const fim = ponto.saida ? new Date(ponto.saida).getTime() : agora;
  if (!Number.isFinite(fim) || fim < inicio) return 0;
  return fim - inicio;
}

function tipoeEntrada(tipo: string | null | undefined) {
  if (!tipo) return null;
  const t = tipo
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  if (t.includes("entrada") || t === "in" || t === "checkin") return "entrada" as const;
  if (t.includes("saida") || t === "out" || t === "checkout") return "saida" as const;
  return null;
}

/**
 * Atualiza o ponto do dia a partir da resposta da API (ou do horário atual).
 * Se o tipo não vier, assume a próxima batida lógica (entrada → saída).
 */
export function registrarBatidaLocal(
  empresaId: string,
  opts: { tipo?: string | null; horario?: string | null } = {}
): PontoHoje {
  const atual = lerStorage(empresaId) ?? {
    data: hojeISOLocal(),
    entrada: null,
    saida: null,
  };

  const horario = opts.horario || new Date().toISOString();
  const tipo = tipoeEntrada(opts.tipo);

  let proximo: PontoHoje;
  if (tipo === "entrada" || (!tipo && !atual.entrada)) {
    proximo = { ...atual, data: hojeISOLocal(), entrada: horario, saida: null };
  } else if (tipo === "saida" || (!tipo && atual.entrada && !atual.saida)) {
    proximo = { ...atual, data: hojeISOLocal(), saida: horario };
  } else if (!atual.entrada) {
    proximo = { ...atual, data: hojeISOLocal(), entrada: horario, saida: null };
  } else {
    // Já tem entrada e saída: nova batida reinicia o ciclo do dia.
    proximo = { data: hojeISOLocal(), entrada: horario, saida: null };
  }

  gravarStorage(empresaId, proximo);
  return proximo;
}

export function usePontoHoje(empresaId: string | undefined) {
  const [ponto, setPonto] = useState<PontoHoje | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  const recarregar = useCallback(() => {
    if (!empresaId) {
      setPonto(null);
      return;
    }
    setPonto(lerStorage(empresaId));
  }, [empresaId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (!empresaId) return;
      if (e.key === chaveStorage(empresaId)) recarregar();
    }
    function onCustom(e: Event) {
      const detail = (e as CustomEvent<{ empresaId: string }>).detail;
      if (detail?.empresaId === empresaId) recarregar();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener(EVENTO, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVENTO, onCustom);
    };
  }, [empresaId, recarregar]);

  // Relógio vivo enquanto estiver com entrada e sem saída.
  useEffect(() => {
    if (!ponto?.entrada || ponto.saida) return;
    const id = window.setInterval(() => setAgora(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [ponto?.entrada, ponto?.saida]);

  const totalMs = calcularTotalMs(ponto, agora);
  const totalFormatado = ponto?.entrada ? formatarDuracao(totalMs) : "—";
  const proximaBatida: "entrada" | "saida" =
    ponto?.entrada && !ponto.saida ? "saida" : "entrada";
  const emAndamento = Boolean(ponto?.entrada && !ponto.saida);

  return {
    ponto,
    totalMs,
    totalFormatado,
    proximaBatida,
    emAndamento,
    registrarBatida: (opts?: { tipo?: string | null; horario?: string | null }) => {
      if (!empresaId) return null;
      const novo = registrarBatidaLocal(empresaId, opts ?? {});
      setPonto(novo);
      return novo;
    },
    recarregar,
  };
}
