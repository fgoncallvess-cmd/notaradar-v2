import type { Data, Subject, Term } from "./types";
const regular = [
  "Arte",
  "Biologia",
  "Educação Física",
  "Filosofia",
  "Física",
  "Geografia",
  "História",
  "Espanhol",
  "Inglês",
  "Português",
  "Matemática",
  "Química",
  "Redação",
  "Sociologia",
];
const first = [
  "Banco de Dados",
  "Análise e Projeto de Sistemas",
  "Design de Interfaces e Usabilidade",
  "Programação Web",
];
const second = [
  "Programação Orientada a Objetos",
  "Redes de Computadores",
  "Segurança de Sistemas e de Informação",
  "Sistemas Embarcados",
];
export const subjects: Subject[] = [
  ...regular.map((name, i) => ({
    id: `r${i}`,
    name,
    category: "regular" as const,
    terms: [1, 2, 3, 4] as Term[],
  })),
  ...[first, second].flatMap((names, s) =>
    names.map((name, i) => ({
      id: `t${s * 4 + i}`,
      name,
      category: "technical" as const,
      terms: (s === 0 ? [1, 2] : [3, 4]) as Term[],
    })),
  ),
];
export const fresh = (): Data => ({
  version: 2,
  year: 2026,
  subjects: structuredClone(subjects),
  grades: {},
  recoveries: {},
  goals: [],
  settings: { recoveryMinimum: 6, targetMode: "minimum" },
});
export const key = (id: string, term: Term) => `${id}:${term}`;
export const emptyGrade = () => ({
  extras: [],
  mode: "evaluations" as const,
  partial: null,
  exam: null,
  direct: null,
  updatedAt: new Date().toISOString(),
});
