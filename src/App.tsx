import { useState, useEffect, useRef } from "react";
import {
  Radar,
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  Target,
  GitCompareArrows,
  Settings as SettingsIcon,
  Menu,
  X,
  ChevronDown,
  Check,
  CalendarDays,
  ArrowUpRight,
  Cloud,
  LogOut,
  LoaderCircle,
} from "lucide-react";
import type { Data, Subject, Term } from "./lib/types";
import { downloadBackup } from "./lib/storage";
import { saveAccount, type Snapshot } from "./lib/cloud";
import { supabase } from "./lib/supabase";
import type { User } from "@supabase/supabase-js";
import { TargetSelector } from "./components/TargetSelector";
import { summary, fmt } from "./lib/calculations";
import { Dashboard } from "./pages/Dashboard";
import { Notes } from "./pages/Notes";
import { Simulator } from "./pages/Simulator";
import { Goals } from "./pages/Goals";
import { Parallels } from "./pages/Parallels";
import { GradeEditor } from "./components/GradeEditor";
import { Settings } from "./components/Settings";
import { Modal, NumberField } from "./components/UI";
const pages = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "notas", label: "Minhas Notas", icon: BookOpen },
  { id: "simulador", label: "Simulador", icon: FlaskConical },
  { id: "metas", label: "Metas", icon: Target },
  { id: "paralelas", label: "Paralelas", icon: GitCompareArrows },
];
export default function App({
  initial,
  user,
}: {
  initial: Snapshot;
  user: User;
}) {
  const [data, setData] = useState(initial.data),
    [revision, setRevision] = useState(initial.revision),
    [saving, setSaving] = useState(false),
    [failed, setFailed] = useState<Data | null>(null),
    [error, setError] = useState<string | null>(null),
    [page, setPage] = useState(() =>
      pages.some((p) => p.id === location.hash.slice(1))
        ? location.hash.slice(1)
        : "dashboard",
    ),
    [mobile, setMobile] = useState(false),
    [editor, setEditor] = useState<{ s: Subject; t: Term } | null>(null),
    [settings, setSettings] = useState(false),
    [toast, setToast] = useState(""),
    [recovery, setRecovery] = useState<Subject | null>(null),
    [recValue, setRecValue] = useState<number | null>(null);
  useEffect(() => {
    const handler = () =>
      setPage(
        pages.some((p) => p.id === location.hash.slice(1))
          ? location.hash.slice(1)
          : "dashboard",
      );
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const lock = useRef(false);
  const active = useRef(true);
  const displayName =
    typeof user.user_metadata.display_name === "string"
      ? user.user_metadata.display_name.slice(0, 60)
      : "Estudante";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function save(d: Data, message: string): Promise<boolean> {
    if (lock.current) return false;
    lock.current = true;
    setSaving(true);
    setError(null);
    try {
      const nextRevision = await saveAccount(d, revision);
      if (!active.current) return false;
      setData(d);
      setRevision(nextRevision);
      setFailed(null);
      setToast(message);
      return true;
    } catch (err) {
      if (active.current) {
        setFailed(d);
        setError(
          err instanceof Error ? err.message : "Não foi possível salvar.",
        );
      }
      return false;
    } finally {
      lock.current = false;
      if (active.current) setSaving(false);
    }
  }
  async function signOut() {
    if (lock.current) return;
    if (
      failed &&
      !confirm(
        "Existe uma alteração não salva. Exporte a tentativa antes de sair. Sair mesmo assim?",
      )
    )
      return;
    const result = await supabase?.auth.signOut({ scope: "local" });
    if (result?.error) setError("Não foi possível sair. Tente novamente.");
  }
  function navigate(id: string) {
    location.hash = id;
    setPage(id);
    setMobile(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function add() {
    setEditor({ s: data.subjects[10], t: 1 });
  }
  const current = pages.find((p) => p.id === page)!;
  return (
    <>
      <div className="app-shell" inert={saving || undefined}>
        {mobile && (
          <div className="sidebar-shade" onClick={() => setMobile(false)} />
        )}
        <aside className={`sidebar ${mobile ? "open" : ""}`}>
          <div className="brand">
            <a
              href="#dashboard"
              className="brand-link"
              onClick={() => navigate("dashboard")}
            >
              <span className="brand-mark">
                <Radar size={26} />
              </span>
              Nota<span>Radar</span>
            </a>
            <button
              className="mobile-close icon-button"
              aria-label="Fechar menu"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMobile(false);
              }}
            >
              <X size={20} />
            </button>
          </div>
          <div className="workspace-tag">
            <span className="workspace-avatar">{initials}</span>
            <div>
              <b>Meu espaço de estudos</b>
              <small>Minhas notas e metas</small>
            </div>
          </div>
          <div className="nav-label">ACOMPANHAMENTO</div>
          <nav>
            {pages.map((p) => (
              <a
                href={`#${p.id}`}
                key={p.id}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(p.id);
                }}
                className={page === p.id ? "active" : ""}
                aria-current={page === p.id ? "page" : undefined}
              >
                <p.icon size={19} />
                {p.label}
                {page === p.id && <span className="nav-active-dot" />}
              </a>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="year-card">
              <div>
                <CalendarDays size={17} />
                <b>Ano letivo 2026</b>
              </div>
              <p>
                Um passo de cada vez.
                <br />
                Cada conquista importa.
              </p>
              <div className="year-line">
                <span />
              </div>
            </div>
            <button
              className="settings-button"
              onClick={() => {
                setSettings(true);
                setMobile(false);
              }}
            >
              <SettingsIcon size={18} /> Configurações
            </button>
            <div className="profile">
              <div className="profile-avatar">{initials}</div>
              <div>
                <b>{displayName}</b>
                <small title={user.email}>{user.email}</small>
              </div>
              <button
                className="icon-button"
                aria-label="Sair da conta"
                onClick={() => void signOut()}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="mobile-toggle icon-button"
                aria-label="Abrir menu"
                onClick={() => setMobile(true)}
              >
                <Menu size={22} />
              </button>
              <span>Meu espaço</span>
              <span className="slash">/</span>
              <strong>{current.label}</strong>
            </div>
            <div className="top-right">
              <span className="local-indicator">
                <span className={`dot ${error ? "red" : "green"}`} />
                {error ? "Verifique os dados" : "Salvo na nuvem"}
              </span>
              <span className="top-year">
                2026 <ChevronDown size={13} />
              </span>
            </div>
          </header>
          <main>
            {error && (
              <div className="error-banner" role="alert">
                {error}
                <div className="inline">
                  {failed && (
                    <button
                      className="secondary"
                      onClick={() =>
                        downloadBackup(
                          failed,
                          "notaradar-alteracao-nao-salva.json",
                        )
                      }
                    >
                      Baixar tentativa
                    </button>
                  )}
                  <button
                    className="secondary"
                    onClick={() => {
                      if (
                        confirm(
                          "Recarregar os dados da nuvem? Exporte a tentativa se houver uma alteração não salva.",
                        )
                      )
                        location.reload();
                    }}
                  >
                    Recarregar dados
                  </button>
                </div>
              </div>
            )}
            <TargetSelector data={data} onSave={save} />
            {page === "dashboard" && (
              <Dashboard
                data={data}
                onAdd={add}
                onNotes={() => navigate("notas")}
              />
            )}
            {page === "notas" && (
              <Notes
                data={data}
                onEdit={(s, t) => setEditor({ s, t })}
                onRecovery={(s) => {
                  setRecovery(s);
                  setRecValue(data.recoveries[s.id] ?? null);
                }}
              />
            )}
            {page === "simulador" && <Simulator data={data} />}{" "}
            {page === "metas" && <Goals data={data} onSave={save} />}{" "}
            {page === "paralelas" && <Parallels data={data} />}
            <footer>
              <span>
                NotaRadar <span className="muted">/</span> Deep Violet Edition
              </span>
              <span>
                <Cloud size={12} /> Seus dados, na sua conta.
              </span>
            </footer>
          </main>
        </div>
        {editor && (
          <GradeEditor
            data={data}
            initial={editor}
            onSave={save}
            onClose={() => setEditor(null)}
          />
        )}{" "}
        {settings && (
          <Settings
            data={data}
            onSave={save}
            onClose={() => setSettings(false)}
          />
        )}{" "}
        {recovery && (
          <Modal title="Recuperação final" onClose={() => setRecovery(null)}>
            <h3>{recovery.name}</h3>
            <p className="muted small">
              A recuperação é separada do acumulado. A nota mínima para
              aprovação é {fmt(data.settings.recoveryMinimum)}.
            </p>
            {summary(data, recovery).complete < recovery.terms.length ? (
              <div className="notice">
                Conclua os bimestres desta disciplina antes de registrar a
                recuperação final.
              </div>
            ) : summary(data, recovery).sum >= summary(data, recovery).min ? (
              <div className="notice green">
                O acumulado mínimo já foi atingido. Não é necessária
                recuperação.
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    recValue === null &&
                    data.recoveries[recovery.id] !== undefined &&
                    !confirm("Remover a nota de recuperação?")
                  )
                    return;
                  const d = structuredClone(data);
                  if (recValue === null) delete d.recoveries[recovery.id];
                  else d.recoveries[recovery.id] = recValue;
                  const saved = await save(
                    d,
                    recValue === null
                      ? "Recuperação removida."
                      : "Recuperação registrada.",
                  );
                  if (saved) setRecovery(null);
                }}
              >
                <NumberField
                  label="Nota da recuperação"
                  value={recValue}
                  onChange={setRecValue}
                />
                {recValue !== null && (
                  <p
                    className={
                      recValue >= data.settings.recoveryMinimum
                        ? "green"
                        : "yellow"
                    }
                  >
                    {recValue >= data.settings.recoveryMinimum
                      ? "Aprovado por recuperação"
                      : "Nota mínima ainda não atingida."}
                  </p>
                )}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setRecovery(null)}
                  >
                    Cancelar
                  </button>
                  <button className="primary">
                    Salvar recuperação <ArrowUpRight size={16} />
                  </button>
                </div>
              </form>
            )}
          </Modal>
        )}
        {toast && (
          <div className="toast" role="status">
            <Check size={18} />
            {toast}
          </div>
        )}
      </div>
      {saving && (
        <div className="saving-overlay" role="status">
          <LoaderCircle className="spin" size={21} /> Salvando na sua conta...
        </div>
      )}
    </>
  );
}
