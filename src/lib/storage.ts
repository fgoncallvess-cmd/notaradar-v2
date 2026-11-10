import type { Data, Grade } from "./types";
import { fresh, subjects } from "./data";
// Legacy storage is read only and never imported automatically into an account.
export const STORAGE_KEY = "notaradar:2026:v1";
export function validGrade(n: unknown): boolean {
  return (
    n === null ||
    (typeof n === "number" &&
      Number.isFinite(n) &&
      n >= 0 &&
      n <= 10 &&
      Math.abs(n * 10 - Math.round(n * 10)) < 1e-8)
  );
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export function validate(raw: unknown): Data {
  const fail = (): never => {
    throw new Error(
      "Dados inválidos. Use um backup NotaRadar 1.0 ou 2.0 de 2026. Confira notas, descrições e períodos.",
    );
  };
  if (!record(raw) || ![1, 2].includes(raw.version as number)) return fail();
  const input = structuredClone(raw);
  const legacy = input.version === 1;
  if (
    !record(input.grades) ||
    !record(input.settings) ||
    !record(input.recoveries) ||
    !Array.isArray(input.goals)
  )
    return fail();
  if (legacy) {
    input.version = 2;
    input.settings.targetMode = "minimum";
    for (const g of Object.values(input.grades)) {
      if (!record(g)) return fail();
      g.extras = [];
    }
  }
  const d = input as unknown as Data;
  if (
    d.year !== 2026 ||
    JSON.stringify(d.subjects) !== JSON.stringify(subjects) ||
    typeof d.settings.recoveryMinimum !== "number" ||
    !validGrade(d.settings.recoveryMinimum) ||
    !["minimum", "desired"].includes(d.settings.targetMode)
  )
    return fail();
  const keys = new Set(
    subjects.flatMap((s) => s.terms.map((t) => `${s.id}:${t}`)),
  );
  for (const [k, g] of Object.entries(d.grades)) {
    if (
      !keys.has(k) ||
      !record(g) ||
      !["direct", "evaluations"].includes(g.mode) ||
      ![g.partial, g.exam, g.direct].every(validGrade) ||
      typeof g.updatedAt !== "string" ||
      !Number.isFinite(Date.parse(g.updatedAt)) ||
      !Array.isArray(g.extras) ||
      g.extras.length > 30
    )
      return fail();
    if (
      g.mode === "direct"
        ? g.partial !== null || g.exam !== null
        : g.direct !== null
    )
      return fail();
    const ids = new Set<string>();
    for (const extra of g.extras) {
      if (
        !record(extra) ||
        typeof extra.id !== "string" ||
        !extra.id ||
        extra.id.length > 100 ||
        ids.has(extra.id) ||
        typeof extra.description !== "string" ||
        !extra.description.trim() ||
        extra.description.length > 120 ||
        typeof extra.value !== "number" ||
        extra.value <= 0 ||
        !validGrade(extra.value)
      )
        return fail();
      ids.add(extra.id);
    }
  }
  for (const [id, v] of Object.entries(d.recoveries))
    if (!subjects.some((s) => s.id === id) || v === null || !validGrade(v))
      return fail();
  const ids = new Set<string>();
  if (d.goals.length > 200) return fail();
  for (const g of d.goals) {
    if (!record(g)) return fail();
    const s = subjects.find((s) => s.id === g.subjectId);
    if (
      !s ||
      typeof g.id !== "string" ||
      !g.id ||
      ids.has(g.id) ||
      !["average", "total", "blue"].includes(g.type) ||
      typeof g.priority !== "boolean" ||
      typeof g.target !== "number" ||
      !Number.isFinite(g.target) ||
      g.target < 0 ||
      g.target > (g.type === "total" ? s.terms.length * 10 : 10) ||
      Math.abs(g.target * 10 - Math.round(g.target * 10)) > 1e-8
    )
      return fail();
    ids.add(g.id);
  }
  // Return only application fields; discard unknown metadata in imported files.
  return {
    version: 2,
    year: 2026,
    subjects: structuredClone(subjects),
    grades: Object.fromEntries(
      Object.entries(d.grades).map(([k, g]) => [
        k,
        {
          mode: g.mode,
          partial: g.partial,
          exam: g.exam,
          direct: g.direct,
          updatedAt: g.updatedAt,
          extras: g.extras.map((e) => ({
            id: e.id,
            description: e.description.trim(),
            value: e.value,
          })),
        } satisfies Grade,
      ]),
    ),
    recoveries: d.recoveries,
    goals: d.goals.map((g) => ({
      id: g.id,
      subjectId: g.subjectId,
      type: g.type,
      target: g.target,
      priority: g.priority,
    })),
    settings: {
      recoveryMinimum: d.settings.recoveryMinimum,
      targetMode: d.settings.targetMode,
    },
  };
}
export function legacyData(): Data | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? validate(JSON.parse(raw)) : null;
}
export function downloadBackup(
  data: Data,
  filename = "notaradar-2026-backup.json",
) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// Retained for legacy backups and regression tests. Cloud mode does not call save/load.
export const repository = {
  load() {
    try {
      return { data: legacyData() ?? fresh(), error: null };
    } catch {
      return {
        data: fresh(),
        error: "Dados locais inválidos; o conteúdo original foi preservado.",
      };
    }
  },
  save(data: Data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validate(data)));
  },
};
