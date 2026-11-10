import { useState } from "react";
import { Trash2, ArrowRight } from "lucide-react";
import type { Data, Grade, Subject, Term, SaveData } from "../lib/types";
import { emptyGrade, key } from "../lib/data";
import { summary, fmt } from "../lib/calculations";
import { Modal, NumberField } from "./UI";
import { ExtrasEditor } from "./ExtrasEditor";
export function GradeEditor({
  data,
  initial,
  onSave,
  onClose,
}: {
  data: Data;
  initial: { s: Subject; t: Term };
  onSave: SaveData;
  onClose: () => void;
}) {
  const [id, setId] = useState(initial.s.id),
    [term, setTerm] = useState(initial.t),
    [grade, setGrade] = useState<Grade>(
      structuredClone(
        data.grades[key(initial.s.id, initial.t)] ?? emptyGrade(),
      ),
    ),
    [error, setError] = useState("");
  const s = data.subjects.find((s) => s.id === id)!;
  function select(i: string, t: Term) {
    setId(i);
    setTerm(t);
    setGrade(structuredClone(data.grades[key(i, t)] ?? emptyGrade()));
    setError("");
  }
  const preview = {
    ...data,
    grades: { ...data.grades, [key(id, term)]: grade },
  };
  const current = summary(preview, s).rows.find((r) => r.term === term)!;
  async function save() {
    if (grade.extras.some((e) => !e.description.trim() || e.value <= 0)) {
      setError(
        "Informe uma descrição e um valor maior que zero para cada extra.",
      );
      return;
    }
    const next = structuredClone(data),
      k = key(id, term);
    if (
      grade.partial === null &&
      grade.exam === null &&
      grade.direct === null &&
      grade.extras.length === 0
    ) {
      if (
        data.grades[k] &&
        !confirm("Remover este lançamento e recalcular as paralelas?")
      )
        return;
      delete next.grades[k];
    } else
      next.grades[k] = {
        ...grade,
        extras: grade.extras.map((e) => ({
          ...e,
          description: e.description.trim(),
        })),
        updatedAt: new Date().toISOString(),
      };
    if (await onSave(next, "Notas e extras salvos. Paralelas recalculadas."))
      onClose();
    else
      setError(
        "Não foi possível salvar. Seus campos foram mantidos. Confira o aviso de conexão.",
      );
  }
  return (
    <Modal title="Notas e pontos extras" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <label className="field">
          Disciplina
          <select
            value={id}
            onChange={(e) => {
              const next = data.subjects.find((s) => s.id === e.target.value)!;
              select(next.id, next.terms.includes(term) ? term : next.terms[0]);
            }}
          >
            {data.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Período
          <select
            value={term}
            onChange={(e) => select(id, Number(e.target.value) as Term)}
          >
            {s.terms.map((t, i) => (
              <option key={t} value={t}>
                {t}º bimestre anual
                {s.category === "technical" ? ` · ${i + 1}º da disciplina` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="segmented">
          {(["evaluations", "direct"] as const).map((mode) => (
            <button
              type="button"
              key={mode}
              className={grade.mode === mode ? "active" : ""}
              onClick={() => {
                if (mode === grade.mode) return;
                if (
                  [grade.partial, grade.exam, grade.direct].some(
                    (n) => n !== null,
                  ) &&
                  !confirm(
                    "Trocar o modo apagará as notas deste formulário ao salvar. Os extras serão mantidos. Continuar?",
                  )
                )
                  return;
                setGrade({ ...emptyGrade(), mode, extras: grade.extras });
              }}
            >
              {mode === "evaluations"
                ? "Parcial + bimestral"
                : "Já tenho a média"}
            </button>
          ))}
        </div>
        {grade.mode === "evaluations" ? (
          <div className="form-grid">
            <NumberField
              label="Nota parcial"
              value={grade.partial}
              onChange={(v) => setGrade({ ...grade, partial: v })}
            />
            <NumberField
              label="Nota bimestral"
              value={grade.exam}
              onChange={(v) => setGrade({ ...grade, exam: v })}
            />
          </div>
        ) : (
          <>
            <NumberField
              label="Média original, sem extras"
              value={grade.direct}
              onChange={(v) => setGrade({ ...grade, direct: v })}
            />
            <p className="small muted">
              Informe a média antes da paralela e dos extras para não contá-los
              duas vezes.
            </p>
          </>
        )}
        <ExtrasEditor
          extras={grade.extras}
          onChange={(extras) => setGrade({ ...grade, extras })}
        />
        {current.original === null && grade.extras.length > 0 && (
          <p className="notice">
            Extras ficam registrados, mas só entram no acumulado quando a média
            do bimestre estiver completa.
          </p>
        )}
        <div className="grade-breakdown">
          <div>
            <small>Média original</small>
            <b>{fmt(current.original)}</b>
          </div>
          <ArrowRight size={14} />
          <div>
            <small>Após paralela</small>
            <b>{fmt(current.afterParallel)}</b>
          </div>
          <span>+</span>
          <div>
            <small>Extras</small>
            <b>{fmt(current.extraTotal)}</b>
          </div>
          <span>=</span>
          <div>
            <small>Média final</small>
            <b className="violet">{fmt(current.corrected)}</b>
          </div>
        </div>
        {current.corrected === 10 &&
          current.extraApplied < current.extraTotal && (
            <p className="small muted">
              O teto de 10,0 limita os extras aplicados a{" "}
              {fmt(current.extraApplied)} ponto(s). Todos os lançamentos
              continuam registrados.
            </p>
          )}
        {error && (
          <p role="alert" className="red small">
            {error}
          </p>
        )}
        <div className="modal-actions">
          {data.grades[key(id, term)] && (
            <button
              type="button"
              className="text-button danger"
              onClick={async () => {
                if (
                  confirm("Excluir as notas e TODOS os extras deste bimestre?")
                ) {
                  const d = structuredClone(data);
                  delete d.grades[key(id, term)];
                  if (await onSave(d, "Lançamento excluído.")) onClose();
                }
              }}
            >
              <Trash2 size={15} /> Excluir
            </button>
          )}
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary">Salvar notas</button>
        </div>
      </form>
    </Modal>
  );
}
