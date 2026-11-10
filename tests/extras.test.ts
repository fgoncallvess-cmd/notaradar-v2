import { test } from "node:test";
import assert from "node:assert/strict";
import { fresh, emptyGrade } from "../src/lib/data";
import { rows, summary, maximum } from "../src/lib/calculations";
import { validate } from "../src/lib/storage";
const extra = (value = 1, description = "Trabalho de redes") => ({
  id: "extra-1",
  description,
  value,
});
test("6 + 6 nas provas e extra 1 = média final 7, sem dividir o extra", () => {
  const d = fresh();
  d.grades["r0:1"] = {
    ...emptyGrade(),
    partial: 6,
    exam: 6,
    extras: [extra()],
  };
  const r = rows(d, d.subjects[0])[0];
  assert.equal(r.original, 6);
  assert.equal(r.afterParallel, 6);
  assert.equal(r.corrected, 7);
  assert.equal(r.gain, 0);
});
test("Extra somente depois da paralela: 5 -> 6 -> 7", () => {
  const d = fresh();
  d.grades["r0:1"] = {
    ...emptyGrade(),
    mode: "direct",
    direct: 5,
    extras: [extra()],
  };
  d.grades["r0:2"] = { ...emptyGrade(), partial: 7 };
  const r = rows(d, d.subjects[0])[0];
  assert.equal(r.original, 5);
  assert.equal(r.afterParallel, 6);
  assert.equal(r.gain, 1);
  assert.equal(r.corrected, 7);
});
test("Extra não impede uma paralela e não contamina a original", () => {
  const d = fresh();
  d.grades["r0:1"] = {
    ...emptyGrade(),
    partial: 3,
    exam: 5,
    extras: [extra(3)],
  };
  d.grades["r0:2"] = { ...emptyGrade(), partial: 8 };
  assert.equal(rows(d, d.subjects[0])[0].corrected, 9);
  assert.equal(d.grades["r0:1"].partial, 3);
});
test("Múltiplos extras, decimais e teto de 10", () => {
  const d = fresh();
  d.grades["r0:1"] = {
    ...emptyGrade(),
    partial: 9,
    exam: 9,
    extras: [
      extra(0.7),
      { id: "extra-2", description: "Participação", value: 0.8 },
    ],
  };
  const r = rows(d, d.subjects[0])[0];
  assert.equal(r.extraTotal, 1.5);
  assert.equal(r.extraApplied, 1);
  assert.equal(r.corrected, 10);
});
test("Extras são preservados mas ficam pendentes sem média completa", () => {
  const d = fresh();
  d.grades["r0:1"] = { ...emptyGrade(), partial: 7, extras: [extra()] };
  const a = summary(d, d.subjects[0]);
  assert.equal(a.rows[0].corrected, null);
  assert.equal(a.sum, 0);
  assert.equal(a.complete, 0);
  assert.equal(a.rows[0].extraTotal, 1);
});
test("Editar e remover extra recalcula resultado sem modificar provas", () => {
  const d = fresh();
  d.grades["r0:1"] = {
    ...emptyGrade(),
    partial: 6,
    exam: 6,
    extras: [extra()],
  };
  assert.equal(summary(d, d.subjects[0]).sum, 7);
  d.grades["r0:1"].extras[0].value = 2;
  assert.equal(summary(d, d.subjects[0]).sum, 8);
  d.grades["r0:1"].extras = [];
  assert.equal(summary(d, d.subjects[0]).sum, 6);
});
test("Remover a parcial desfaz paralela mas mantém extras anteriores", () => {
  const d = fresh();
  d.grades["r0:1"] = {
    ...emptyGrade(),
    mode: "direct",
    direct: 5,
    extras: [extra()],
  };
  d.grades["r0:2"] = { ...emptyGrade(), partial: 7 };
  assert.equal(rows(d, d.subjects[0])[0].corrected, 7);
  delete d.grades["r0:2"];
  assert.equal(rows(d, d.subjects[0])[0].corrected, 6);
});
test("Máximo possível considera extras conhecidos, respeita notas fixas e teto", () => {
  const d = fresh(),
    s = d.subjects[14];
  d.grades["t0:1"] = {
    ...emptyGrade(),
    mode: "direct",
    direct: 5,
    extras: [extra()],
  };
  d.grades["t0:2"] = { ...emptyGrade(), partial: 0, extras: [extra()] };
  assert.equal(maximum(d, s), 12);
});
test("Objetivo 24 não altera aprovação em 22", () => {
  const d = fresh();
  d.settings.targetMode = "desired";
  for (const t of [1, 2, 3, 4])
    d.grades[`r0:${t}`] = { ...emptyGrade(), mode: "direct", direct: 5.5 };
  const a = summary(d, d.subjects[0]);
  assert.equal(a.status, "Aprovado");
  assert.equal(a.target, 24);
  assert.equal(a.targetMissing, 2);
  assert.equal(a.missing, 0);
});
test("Objetivo 12 não altera aprovação em 11", () => {
  const d = fresh();
  d.settings.targetMode = "desired";
  for (const t of [3, 4])
    d.grades[`t5:${t}`] = { ...emptyGrade(), mode: "direct", direct: 5.5 };
  const a = summary(d, d.subjects[19]);
  assert.equal(a.status, "Aprovado");
  assert.equal(a.target, 12);
  assert.equal(a.targetMissing, 1);
});
test("Backup 1.0 migra mantendo notas, sem inventar extras", () => {
  const d: any = fresh();
  d.version = 1;
  delete d.settings.targetMode;
  d.grades["r0:1"] = {
    mode: "direct",
    direct: 5.2,
    partial: null,
    exam: null,
    updatedAt: "2026-11-01T00:00:00Z",
  };
  const migrated = validate(d);
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.grades["r0:1"].extras, []);
  assert.equal(migrated.grades["r0:1"].direct, 5.2);
  assert.equal(migrated.settings.targetMode, "minimum");
  assert.equal(d.version, 1);
});
test("Backup 2.0 restaura extras, descrições e objetivo", () => {
  const d = fresh();
  d.settings.targetMode = "desired";
  d.grades["r0:1"] = {
    ...emptyGrade(),
    partial: 6,
    exam: 6,
    extras: [extra()],
  };
  assert.deepEqual(validate(JSON.parse(JSON.stringify(d))), d);
});
test("Validação rejeita extras vazios, negativos, duplicados e malformados", () => {
  for (const extras of [
    [extra(-1)],
    [extra(1, " ")],
    [extra(0)],
    [extra(1.25)],
    [extra(), extra()],
    [null],
  ]) {
    const d = fresh();
    d.grades["r0:1"] = { ...emptyGrade(), extras: extras as any };
    assert.throws(() => validate(d));
  }
});
test("Configuração de meta desconhecida é rejeitada", () => {
  const d = fresh();
  d.settings.targetMode = "unknown" as any;
  assert.throws(() => validate(d));
});
