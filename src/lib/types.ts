export type Term = 1 | 2 | 3 | 4;
export type Subject = {
  id: string;
  name: string;
  category: "regular" | "technical";
  terms: Term[];
};
export type ExtraPoint = { id: string; description: string; value: number };
export type Grade = {
  extras: ExtraPoint[];
  mode: "evaluations" | "direct";
  partial: number | null;
  exam: number | null;
  direct: number | null;
  updatedAt: string;
};
export type Goal = {
  id: string;
  subjectId: string;
  type: "average" | "total" | "blue";
  target: number;
  priority: boolean;
};
export type Data = {
  version: 2;
  year: 2026;
  subjects: Subject[];
  grades: Record<string, Grade>;
  recoveries: Record<string, number>;
  goals: Goal[];
  settings: { recoveryMinimum: number; targetMode: "minimum" | "desired" };
};
export type Row = {
  term: Term;
  original: number | null;
  afterParallel: number | null;
  extraTotal: number;
  extraApplied: number;
  corrected: number | null;
  parallel: number | null;
  gain: number;
};

export type SaveData = (data: Data, message: string) => Promise<boolean>;
