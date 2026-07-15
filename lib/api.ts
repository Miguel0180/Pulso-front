/**
 * Base da API. Em produção no Netlify, defina NEXT_PUBLIC_API_URL
 * nas Environment variables e faça um novo deploy (variáveis NEXT_PUBLIC_*
 * são embutidas no build).
 */
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://pulsoetico.onrender.com"
).replace(/\/$/, "");
