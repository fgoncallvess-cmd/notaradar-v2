import type { Data, Grade, Row, Subject } from "./types";
import { key, emptyGrade } from "./data";
export const round = (n: number) => Math.round((n + Number.EPSILON) * 10) / 10;
export const fmt = (n: number | null | undefined) =>
  n == null
    ? "—"
    : n.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
// Integer tenths keep decimal midpoint rounding predictable.
export const average = (a: number, b: number) =>
  Math.round((Math.round(a * 10) + Math.round(b * 10)) / 2) / 10;
export const original = (g: Grade | undefined): number | null =>
  !g
    ? null
    : g.mode === "direct"
      ? g.direct
      : g.partial === null || g.exam === null
        ? null
        : average(g.partial, g.exam);
export const parallel = (
  base: number | null,
  p: number | null,
): number | null =>
  base === null
    ? null
    : p === null || base >= 6
      ? base
      : Math.max(base, Math.min(6, average(base, p)));
export const threshold = (s: Subject) => (s.category === "regular" ? 22 : 11);
export const target = (data: Data, s: Subject) =>
  data.settings.targetMode === "desired"
    ? s.category === "regular"
      ? 24
      : 12
    : threshold(s);
export function rows(data: Data, s: Subject): Row[] {
  return s.terms.map((term, i) => {
    const base = original(data.grades[key(s.id, term)]);
    const next = s.terms[i + 1];
    const g = next ? data.grades[key(s.id, next)] : undefined;
    const p = g?.mode === "evaluations" ? g.partial : null;
    const afterParallel = parallel(base, p ?? null);
    const extraTotal =
      (data.grades[key(s.id, term)]?.extras ?? []).reduce(
        (sum, extra) => sum + Math.round(extra.value * 10),
        0,
      ) / 10;
    const corrected =
      afterParallel === null
        ? null
        : Math.min(10, round(afterParallel + extraTotal));
    return {
      term,
      original: base,
      afterParallel,
      extraTotal,
      extraApplied:
        corrected === null || afterParallel === null
          ? 0
          : round(corrected - afterParallel),
      corrected,
      parallel: p ?? null,
      gain:
        base === null || afterParallel === null
          ? 0
          : round(afterParallel - base),
    };
  });
}
export const total = (rs: Row[]) =>
  rs.reduce((n, r) => n + Math.round((r.corrected ?? 0) * 10), 0) / 10;
export function maximum(data: Data, s: Subject) {
  const copy = structuredClone(data);
  for (const term of s.terms) {
    const k = key(s.id, term),
      g = copy.grades[k] ?? emptyGrade();
    copy.grades[k] =
      g.mode === "direct"
        ? { ...g, direct: g.direct ?? 10 }
        : { ...g, partial: g.partial ?? 10, exam: g.exam ?? 10 };
  }
  return total(rows(copy, s));
}
export function summary(data: Data, s: Subject) {
  const rs = rows(data, s),
    sum = total(rs),
    complete = rs.filter((r) => r.corrected !== null).length,
    min = threshold(s),
    max = maximum(data, s);
  const entries = s.terms.map((t) => data.grades[key(s.id, t)]);
  const has = entries.some(
    (g) => g && (g.partial !== null || g.exam !== null || g.direct !== null),
  );
  const remaining = entries.reduce(
    (n, g) =>
      n +
      (g?.mode === "direct"
        ? g.direct === null
          ? 1
          : 0
        : Number(g?.partial == null) + Number(g?.exam == null)),
    0,
  );
  let status = "Em andamento";
  if (!has) status = "Sem notas cadastradas";
  else if (sum >= min)
    status = complete === s.terms.length ? "Aprovado" : "Mínimo atingido";
  else if (complete === s.terms.length)
    status =
      (data.recoveries[s.id] ?? -1) >= data.settings.recoveryMinimum
        ? "Aprovado por recuperação"
        : "Aguardando recuperação";
  else if (max < min) status = "Crítico";
  else if (complete > 0)
    status =
      sum / complete >= min / s.terms.length ? "Dentro da meta" : "Atenção";
  return {
    target: target(data, s),
    targetMissing: Math.max(0, round(target(data, s) - sum)),
    targetProgress: Math.min(100, (sum / target(data, s)) * 100),
    rows: rs,
    sum,
    complete,
    min,
    max,
    remaining,
    status,
    has,
    missing: Math.max(0, round(min - sum)),
    progress: Math.min(100, (sum / min) * 100),
    risk: ["Atenção", "Crítico", "Aguardando recuperação"].includes(status),
  };
}
export const tone = (status: string) =>
  status.includes("Aprovado") || status === "Mínimo atingido"
    ? "green"
    : status === "Crítico"
      ? "red"
      : status === "Atenção" || status === "Aguardando recuperação"
        ? "yellow"
        : status === "Dentro da meta"
          ? "blue"
          : "muted";
