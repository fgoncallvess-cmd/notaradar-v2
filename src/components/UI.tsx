import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, ArrowUpRight, Inbox } from "lucide-react";
import { fmt, tone } from "../lib/calculations";
export const Badge = ({ status }: { status: string }) => (
  <span className={`badge ${tone(status)}`}>
    <i />
    {status}
  </span>
);
export const Score = ({ value }: { value: number | null }) => (
  <span
    className={`score ${value === null ? "muted" : value >= 6 ? "blue" : "red"}`}
  >
    {fmt(value)}
  </span>
);
export const Progress = ({ value }: { value: number }) => (
  <div className="progress">
    <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);
export const Empty = ({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: () => void;
}) => (
  <div className="empty">
    <div className="empty-icon">
      <Inbox size={24} />
    </div>
    <h3>{title}</h3>
    <p>{children}</p>
    {action && (
      <button className="primary" onClick={action}>
        Cadastrar primeira nota <ArrowUpRight size={16} />
      </button>
    )}
  </div>
);
export const Panel = ({
  title,
  subtitle,
  children,
  action,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) => (
  <section className={`panel ${className}`}>
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <dialog
        open
        aria-modal="true"
        aria-label={title}
        ref={(el) => {
          if (el && !el.dataset.ready) {
            el.dataset.ready = "true";
            el.querySelector<HTMLElement>("button,input,select")?.focus();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Tab") {
            const els = Array.from(
              e.currentTarget.querySelectorAll<HTMLElement>(
                'button,input,select,textarea,[tabindex="0"]',
              ),
            ).filter((el) => !el.hasAttribute("disabled"));
            const first = els[0],
              last = els.at(-1);
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <header>
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>
        {children}
      </dialog>
    </div>
  );
}
export function NumberField({
  label,
  value,
  onChange,
  max = 10,
  min = 0,
  required = false,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  max?: number;
  min?: number;
  required?: boolean;
}) {
  const [text, setText] = useState(value === null ? "" : String(value)),
    [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setText(value === null ? "" : String(value));
    setError("");
    ref.current?.setCustomValidity("");
  }, [value]);
  return (
    <label className="field">
      {label}
      <input
        ref={ref}
        type="number"
        min={min}
        max={max}
        step="0.1"
        required={required}
        value={text}
        placeholder="—"
        aria-invalid={!!error}
        onChange={(e) => {
          const raw = e.target.value;
          setText(raw);
          const n = Number(raw);
          const message =
            raw !== "" &&
            (!Number.isFinite(n) ||
              n < min ||
              n > max ||
              Math.abs(n * 10 - Math.round(n * 10)) >= 1e-8)
              ? `Informe de ${min} a ${max}, com até uma casa decimal.`
              : "";
          setError(message);
          e.target.setCustomValidity(message);
          if (!message) onChange(raw === "" ? null : n);
        }}
      />
      {error && (
        <span className="red small" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
