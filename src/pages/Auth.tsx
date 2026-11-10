import { useState, type FormEvent } from "react";
import {
  Radar,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  UserRound,
  Check,
  ArrowLeft,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { supabase, setupError, authReturnUrl } from "../lib/supabase";
import { authError } from "../lib/auth-errors";
type Mode = "login" | "signup" | "forgot" | "reset";
export function Auth({
  recovery = false,
  onRecovered,
}: {
  recovery?: boolean;
  onRecovered?: () => void;
}) {
  const [mode, setMode] = useState<Mode>(recovery ? "reset" : "login");
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmPassword, setConfirmPassword] = useState(""),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [sentTo, setSentTo] = useState("");
  const change = (m: Mode) => {
    if (busy) return;
    setMode(m);
    setError("");
    setMessage("");
    setPassword("");
    setConfirmPassword("");
    setShow(false);
  };
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setMessage("");
    if (!supabase) {
      setError(setupError ?? "Configure o Supabase para continuar.");
      return;
    }
    if (
      (mode === "signup" || mode === "reset") &&
      (password.length < 8 || password !== confirmPassword)
    ) {
      setError(
        password.length < 8
          ? "A senha precisa ter pelo menos 8 caracteres."
          : "As senhas não coincidem.",
      );
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      setError("Digite seu nome com pelo menos 2 caracteres.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: name.trim() },
            emailRedirectTo: authReturnUrl(),
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSentTo(email.trim());
          setMessage(
            "Se o cadastro puder ser concluído, você receberá um link para confirmar seu e-mail. Confira também a caixa de spam.",
          );
          setPassword("");
          setConfirmPassword("");
        }
      }
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: `${authReturnUrl()}?flow=recovery` },
        );
        if (error) throw error;
        setSentTo(email.trim());
        setMessage(
          "Se houver uma conta para este e-mail, você receberá as instruções para criar uma nova senha.",
        );
      }
      if (mode === "reset") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setPassword("");
        setConfirmPassword("");
        setMessage("Senha atualizada.");
        onRecovered?.();
      }
    } catch (err) {
      setError(authError(err));
    } finally {
      setBusy(false);
    }
  }
  const title =
    mode === "signup"
      ? "Seu próximo capítulo."
      : mode === "forgot"
        ? "Vamos recuperar seu acesso."
        : mode === "reset"
          ? "Uma nova senha."
          : "Bom ter você de volta.";
  return (
    <div className="auth-page">
      <section className="auth-story">
        <a className="brand auth-brand" href="#login">
          <span className="brand-mark">
            <Radar size={27} />
          </span>
          Nota<span>Radar</span>
        </a>
        <div className="auth-story-content">
          <span className="auth-kicker">
            <span className="dot violet" /> SEU FUTURO COMEÇA NO PRESENTE
          </span>
          <h1>
            Mais clareza.
            <br />
            Mais direção.
            <br />
            <span>Mais conquistas.</span>
          </h1>
          <p>
            Suas notas, metas e próximos passos.
            <br />
            Tudo no mesmo lugar, no seu ritmo.
          </p>
          <div className="auth-illustration" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <div className="orbit-core">
              <Radar size={52} strokeWidth={1} />
            </div>
            <span className="orbit-label label-one">
              <Target size={16} /> Seu objetivo, mais perto
            </span>
            <span className="orbit-label label-two">
              <Sparkles size={16} /> Cada ponto faz diferença
            </span>
            <div className="orbit-dot" />
          </div>
        </div>
        <div className="auth-story-foot">
          <ShieldCheck size={16} />
          <span>Um espaço só seu. Uma conta para acompanhar sua evolução.</span>
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-mobile-brand">
          <Radar size={24} /> NotaRadar
        </div>
        <div className="auth-form-wrap">
          <div className="auth-step">
            NOTARADAR <span>/</span> DEEP VIOLET EDITION
          </div>
          <h2>{title}</h2>
          <p className="auth-description">
            {mode === "signup"
              ? "Crie sua conta e organize um ano de possibilidades."
              : mode === "forgot"
                ? "Informe seu e-mail para receber um link de recuperação."
                : mode === "reset"
                  ? "Escolha uma senha segura para continuar."
                  : "Entre na sua conta e continue de onde parou."}
          </p>
          {(mode === "login" || mode === "signup") && (
            <div className="auth-tabs">
              <button
                className={mode === "login" ? "active" : ""}
                onClick={() => change("login")}
                disabled={busy}
              >
                Entrar
              </button>
              <button
                className={mode === "signup" ? "active" : ""}
                onClick={() => change("signup")}
                disabled={busy}
              >
                Criar conta
              </button>
            </div>
          )}
          {setupError && (
            <div className="setup-notice" role="status">
              <b>Conexão pendente</b>
              <p>{setupError}</p>
            </div>
          )}
          {message ? (
            <div className="auth-confirm" role="status">
              <span className="auth-confirm-icon">
                <Mail size={27} />
              </span>
              <h3>Confira seu e-mail</h3>
              <strong>{sentTo}</strong>
              <p>{message}</p>
              <button className="secondary" onClick={() => change("login")}>
                <ArrowLeft size={15} /> Voltar para entrar
              </button>
            </div>
          ) : (
            <form key={mode} className="auth-form" onSubmit={submit}>
              {mode === "signup" && (
                <label className="auth-field">
                  Como podemos chamar você?
                  <span>
                    <UserRound size={17} />
                    <input
                      autoComplete="given-name"
                      placeholder="Seu nome"
                      required
                      minLength={2}
                      maxLength={60}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={busy}
                    />
                  </span>
                </label>
              )}
              {mode !== "reset" && (
                <label className="auth-field">
                  E-mail
                  <span>
                    <Mail size={17} />
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="voce@exemplo.com"
                      required
                      maxLength={254}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={busy}
                    />
                  </span>
                </label>
              )}
              {mode !== "forgot" && (
                <>
                  <label className="auth-field">
                    {mode === "reset" ? "Nova senha" : "Senha"}
                    <span>
                      <LockKeyhole size={17} />
                      <input
                        type={show ? "text" : "password"}
                        autoComplete={
                          mode === "login" ? "current-password" : "new-password"
                        }
                        placeholder={
                          mode === "login"
                            ? "Sua senha"
                            : "Pelo menos 8 caracteres"
                        }
                        required
                        minLength={mode === "login" ? 1 : 8}
                        maxLength={128}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={busy}
                      />
                      <button
                        type="button"
                        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                        aria-pressed={show}
                        onClick={() => setShow(!show)}
                      >
                        {show ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </span>
                  </label>
                  {(mode === "signup" || mode === "reset") && (
                    <>
                      <div className="password-guide">
                        <span className={password.length >= 8 ? "green" : ""}>
                          <Check size={12} /> 8 ou mais caracteres
                        </span>
                        <span
                          className={
                            password && password === confirmPassword
                              ? "green"
                              : ""
                          }
                        >
                          <Check size={12} /> Senhas iguais
                        </span>
                      </div>
                      <label className="auth-field">
                        Confirmar senha
                        <span>
                          <LockKeyhole size={17} />
                          <input
                            type={show ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Repita sua senha"
                            required
                            minLength={8}
                            maxLength={128}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={busy}
                          />
                        </span>
                      </label>
                    </>
                  )}
                </>
              )}
              {mode === "login" && (
                <button
                  type="button"
                  className="auth-forgot"
                  onClick={() => change("forgot")}
                >
                  Esqueci minha senha
                </button>
              )}
              {error && (
                <div className="auth-error" role="alert">
                  {error}
                </div>
              )}
              <button className="auth-submit" disabled={busy || !!setupError}>
                {busy ? (
                  <>
                    <LoaderCircle className="spin" size={18} /> Aguarde...
                  </>
                ) : (
                  <>
                    {mode === "login"
                      ? "Entrar no meu espaço"
                      : mode === "signup"
                        ? "Criar minha conta"
                        : mode === "forgot"
                          ? "Enviar link de recuperação"
                          : "Salvar nova senha"}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
              {mode === "forgot" && (
                <button
                  type="button"
                  className="auth-back"
                  onClick={() => change("login")}
                >
                  <ArrowLeft size={14} /> Voltar para entrar
                </button>
              )}
              {mode === "reset" && (
                <button
                  type="button"
                  className="auth-back"
                  disabled={busy}
                  onClick={async () => {
                    if (supabase) {
                      const { error } = await supabase.auth.signOut({
                        scope: "local",
                      });
                      if (error) {
                        setError(authError(error));
                        return;
                      }
                    }
                    onRecovered?.();
                  }}
                >
                  Sair da recuperação
                </button>
              )}
            </form>
          )}
          <p className="auth-privacy">
            <ShieldCheck size={13} /> Seus dados acadêmicos ficam vinculados à
            sua conta.
          </p>
        </div>
        <p className="auth-bottom">Feito para acompanhar cada conquista.</p>
      </section>
    </div>
  );
}
