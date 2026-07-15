const FALLBACK_API = "https://pulsoetico.onrender.com";

function resolverApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;

  if (
    !raw || 
    raw === "undefined" || 
    raw === "null" ||
    raw.trim() === ""
  ) {
    return FALLBACK_API;
  }

  // Remove barras do final da URL.
  return raw.trim().replace(/\/+$/, "");
}

/**
 * Base da API.
 * No Netlify, defina NEXT_PUBLIC_API_URL e execute
 * "Clear cache and deploy site".
 * Variáveis NEXT_PUBLIC_* são incluídas durante o build do Next.js.
 */
export const API_URL = resolverApiUrl();