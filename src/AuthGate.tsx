import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Radar, LoaderCircle } from "lucide-react";
import { Auth } from "./pages/Auth";
import { supabase } from "./lib/supabase";
import { loadAccount, type Snapshot } from "./lib/cloud";
import App from "./App";
export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null),
    [ready, setReady] = useState(!supabase),
    [recovery, setRecovery] = useState(
      new URLSearchParams(location.search).get("flow") === "recovery",
    ),
    [error, setError] = useState("");
  useEffect(() => {
    if (!supabase) return;
    let live = true;
    // Never await Supabase calls inside the auth callback (SDK holds an auth lock).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      if (!live) return;
      setSession(next);
      setReady(true);
      setError("");
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") setRecovery(false);
    });
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!live) return;
        if (error)
          setError(
            "Não foi possível recuperar sua sessão. Recarregue a página.",
          );
        setSession(data.session);
        setReady(true);
      })
      .catch(() => {
        if (live) {
          setError(
            "Não foi possível verificar sua sessão. Confira a conexão e recarregue.",
          );
          setReady(true);
        }
      });
    return () => {
      live = false;
      subscription.unsubscribe();
    };
  }, []);
  function recovered() {
    setRecovery(false);
    history.replaceState(null, "", location.pathname + "#dashboard");
  }
  if (!ready) return <Loading text="Preparando seu espaço..." />;
  if (error) return <Loading text={error} retry={() => location.reload()} />;
  if (!session) return <Auth key="logged-out" />;
  if (recovery)
    return <Auth key="password-recovery" recovery onRecovered={recovered} />;
  return <Account key={session.user.id} session={session} />;
}
function Account({ session }: { session: Session }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setError("");
    loadAccount(session.user.id)
      .then((s) => {
        if (live) setSnapshot(s);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [session.user.id, attempt]);
  if (error)
    return <Loading text={error} retry={() => setAttempt(attempt + 1)} exit />;
  if (!snapshot) return <Loading text="Buscando suas notas..." />;
  return <App initial={snapshot} user={session.user} />;
}
function Loading({
  text,
  retry,
  exit = false,
}: {
  text: string;
  retry?: () => void;
  exit?: boolean;
}) {
  return (
    <div className="loading-screen">
      <Radar size={42} />
      <h1>NotaRadar</h1>
      <p role="status">{text}</p>
      {retry ? (
        <button className="primary" onClick={retry}>
          Tentar novamente
        </button>
      ) : (
        <LoaderCircle className="spin" size={22} />
      )}{" "}
      {exit && (
        <button
          className="secondary"
          onClick={() => void supabase?.auth.signOut({ scope: "local" })}
        >
          Sair da conta
        </button>
      )}
    </div>
  );
}
