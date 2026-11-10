import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
function configurationError(): string | null {
  if (!url || !publicKey)
    return "Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env.local. Veja o guia INICIAR_AQUI.md.";
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" &&
      parsed.hostname !== "localhost" &&
      parsed.hostname !== "127.0.0.1"
    )
      return "Use a URL HTTPS do seu projeto Supabase.";
  } catch {
    return "A URL do projeto Supabase é inválida.";
  }
  if (publicKey.startsWith("sb_secret_"))
    return "Chave administrativa detectada. Use somente a chave publishable (ou anon) e revogue a chave secreta exposta.";
  if (publicKey.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(
        atob(publicKey.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      if (payload.role !== "anon")
        return "Use somente a chave pública anon ou publishable.";
    } catch {
      return "A chave pública Supabase é inválida.";
    }
  } else if (!publicKey.startsWith("sb_publishable_"))
    return "Use a chave publishable (sb_publishable_...) ou a chave anon do Supabase.";
  return null;
}
export const setupError = configurationError();
export const supabase = setupError
  ? null
  : createClient(url!, publicKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "implicit",
      },
    });
export const authReturnUrl = () =>
  new URL(import.meta.env.BASE_URL, window.location.origin).href;
