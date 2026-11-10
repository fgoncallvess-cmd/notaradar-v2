import { test } from "node:test";
import assert from "node:assert/strict";
import {
  average,
  parallel,
  rows,
  total,
  summary,
  maximum,
} from "../src/lib/calculations";
import { fresh, key, emptyGrade } from "../src/lib/data";
import { validate, repository, STORAGE_KEY } from "../src/lib/storage";
import type { Data, Term } from "../src/lib/types";
const direct = (d: Data, id: string, t: Term, v: number) => {
  d.grades[key(id, t)] = { ...emptyGrade(), mode: "direct", direct: v };
};
test("1. Média de 7,0 e 5,0 = 6,0", () => assert.equal(average(7, 5), 6));
test("2. Técnico: 5,2 + 5,8 = 11,0", () => {
  const d = fresh(),
    s = d.subjects.find((s) => s.id === "t5")!;
  direct(d, s.id, 3, 5.2);
  direct(d, s.id, 4, 5.8);
  assert.equal(total(rows(d, s)), 11);
  assert.equal(summary(d, s).status, "Aprovado");
});
test("3. Regular: 5 + 6 + 4 + 7 = 22", () => {
  const d = fresh(),
    s = d.subjects[0];
  [5, 6, 4, 7].forEach((n, i) => direct(d, s.id, (i + 1) as Term, n));
  assert.equal(summary(d, s).sum, 22);
  assert.equal(summary(d, s).status, "Aprovado");
});
for (const [i, a, b, result] of [
  [4, 5, 7, 6],
  [5, 5, 3, 5],
  [6, 5, 10, 6],
  [7, 6.5, 10, 6.5],
  [8, 5.2, 7, 6],
])
  test(`${i}. Paralela ${a} e ${b} = ${result}`, () =>
    assert.equal(parallel(a, b), result));
for (const [value, status] of [
  [5.9, "Aguardando recuperação"],
  [6, "Aprovado por recuperação"],
] as const)
  test(`Recuperação ${value}`, () => {
    const d = fresh(),
      s = d.subjects[14];
    direct(d, s.id, 1, 4);
    direct(d, s.id, 2, 4);
    d.recoveries[s.id] = value;
    assert.equal(summary(d, s).status, status);
    assert.equal(summary(d, s).sum, 8);
  });
test("11. Ausente não vira zero, zero é nota válida", () => {
  const d = fresh(),
    s = d.subjects[0];
  assert.equal(rows(d, s)[0].original, null);
  d.grades[key(s.id, 1)] = { ...emptyGrade(), partial: 0 };
  assert.equal(rows(d, s)[0].original, null);
  d.grades[key(s.id, 1)].exam = 0;
  assert.equal(rows(d, s)[0].original, 0);
});
test("12 e 13. Edição/remoção recalculam paralelas e total sem alterar original", () => {
  const d = fresh(),
    s = d.subjects[14];
  direct(d, s.id, 1, 5);
  d.grades[key(s.id, 2)] = { ...emptyGrade(), partial: 7, exam: 5 };
  assert.equal(summary(d, s).sum, 12);
  d.grades[key(s.id, 2)].partial = 3;
  assert.equal(summary(d, s).sum, 9);
  delete d.grades[key(s.id, 2)];
  assert.equal(summary(d, s).sum, 5);
  assert.equal(rows(d, s)[0].original, 5);
});
test("14 e 15. Persistir, recarregar e restaurar backup", () => {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
    },
  });
  const d = fresh();
  direct(d, "r10", 1, 8);
  d.goals = [
    { id: "one", subjectId: "r10", type: "average", target: 8, priority: true },
  ];
  repository.save(d);
  assert.deepEqual(repository.load().data, d);
  const imported = validate(JSON.parse(JSON.stringify(d)));
  assert.deepEqual(imported, d);
  store.set(STORAGE_KEY, "bad-json");
  assert.match(repository.load().error ?? "", /preservado/);
  assert.equal(store.get(STORAGE_KEY), "bad-json");
});
test("Arredondamento decimal convencional inclusive 0,05", () => {
  assert.equal(average(5.2, 5.3), 5.3);
  assert.equal(average(0, 0.1), 0.1);
  assert.equal(average(6.6, 6.7), 6.7);
});
test("Máximo respeita parcial existente e inclui ganhos em bimestre anterior", () => {
  const d = fresh(),
    s = d.subjects[14];
  direct(d, s.id, 1, 5);
  d.grades[key(s.id, 2)] = { ...emptyGrade(), partial: 0 };
  assert.equal(maximum(d, s), 10);
  assert.equal(summary(d, s).status, "Crítico");
  delete d.grades[key(s.id, 2)];
  assert.equal(maximum(d, s), 16);
});
test("Técnicas não recebem paralelas de outras disciplinas", () => {
  const d = fresh(),
    s = d.subjects[14];
  direct(d, s.id, 2, 4);
  d.grades["t4:3"] = { ...emptyGrade(), partial: 10 };
  assert.equal(rows(d, s)[1].corrected, 4);
});
test("Simulação não modifica os registros", () => {
  const d = fresh(),
    copy = structuredClone(d);
  copy.grades["r0:1"] = { ...emptyGrade(), partial: 9, exam: 8 };
  summary(copy, copy.subjects[0]);
  assert.deepEqual(d, fresh());
});
test("Backup rejeita notas inválidas, períodos indevidos, duplicação e versão", () => {
  for (const mutate of [
    (d: Data) => {
      d.version = 99 as 2;
    },
    (d: Data) => {
      d.grades["t5:1"] = { ...emptyGrade(), partial: 7 };
    },
    (d: Data) => {
      d.grades["r0:1"] = { ...emptyGrade(), partial: 10.1 };
    },
    (d: Data) => {
      d.grades["r0:1"] = { ...emptyGrade(), partial: 5.25 };
    },
    (d: Data) => {
      d.grades["r0:1"] = { ...emptyGrade(), partial: 5, direct: 6 };
    },
  ]) {
    const d = fresh();
    mutate(d);
    assert.throws(() => validate(d));
  }
});
test("Recuperação não aprova antes de concluir bimestres", () => {
  const d = fresh(),
    s = d.subjects[0];
  direct(d, s.id, 1, 4);
  d.recoveries[s.id] = 10;
  assert.notEqual(summary(d, s).status, "Aprovado por recuperação");
});
