const FALLBACK_API = "https://pulsoetico.onrender.com";

function resolverApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw || raw === "undefined" || raw.trim() === "") {
    return FALLBACK_API;
  }
  return raw.replace(/\/$/, "");
}

/**
 * Base da API. No Netlify, defina NEXT_PUBLIC_API_URL e faça
 * "Clear cache and deploy" — variáveis NEXT_PUBLIC_* entram no build.
 */
export const API_URL = resolverApiUrl();
