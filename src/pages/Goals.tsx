import { useState } from "react";
import { Plus, Target, Star, Pencil, Trash2 } from "lucide-react";
import type { Data, Goal, SaveData } from "../lib/types";
import { summary, fmt, round } from "../lib/calculations";
import { Empty, Modal, NumberField, Progress } from "../components/UI";
export function Goals({ data, onSave }: { data: Data; onSave: SaveData }) {
  const [edit, setEdit] = useState<Goal | null>(null);
  async function save() {
    if (!edit) return;
    const saved = await onSave(
      { ...data, goals: [...data.goals.filter((g) => g.id !== edit.id), edit] },
      "Meta salva.",
    );
    if (saved) setEdit(null);
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <h1>Metas</h1>
          <p>Transforme suas ambições em próximos passos.</p>
        </div>
        <button
          className="primary"
          onClick={() =>
            setEdit({
              id: crypto.randomUUID(),
              subjectId: "r10",
              type: "average",
              target: 8,
              priority: false,
            })
          }
        >
          <Plus size={18} /> Nova meta
        </button>
      </div>
      <div className="notice">
        <Target size={19} />
        <span>
          Suas metas são pessoais. Os mínimos de aprovação continuam em 22
          pontos no regular e 11 no técnico.
        </span>
      </div>
      {data.goals.length ? (
        <div className="subject-grid">
          {[...data.goals]
            .sort((a, b) => Number(b.priority) - Number(a.priority))
            .map((g) => {
              const s = data.subjects.find((s) => s.id === g.subjectId)!;
              const a = summary(data, s);
              const blue = a.rows.filter(
                (r) => r.corrected !== null && r.corrected >= 6,
              ).length;
              const value =
                g.type === "total"
                  ? a.sum
                  : g.type === "average"
                    ? a.complete
                      ? round(a.sum / a.complete)
                      : 0
                    : blue;
              const target = g.type === "blue" ? s.terms.length : g.target;
              const reached =
                a.complete > 0 &&
                (g.type === "blue" ? blue === s.terms.length : value >= target);
              return (
                <article key={g.id} className="subject-card goal-card">
                  <div className="row-between">
                    <span className="eyebrow">
                      {g.priority ? (
                        <>
                          <Star size={13} /> PRIORITÁRIA
                        </>
                      ) : (
                        "META PESSOAL"
                      )}
                    </span>
                    <div className="inline">
                      <button
                        className="icon-button"
                        aria-label={`Editar meta de ${s.name}`}
                        onClick={() => setEdit(g)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Excluir meta de ${s.name}`}
                        onClick={() => {
                          if (confirm("Excluir esta meta?"))
                            onSave(
                              {
                                ...data,
                                goals: data.goals.filter((x) => x.id !== g.id),
                              },
                              "Meta excluída.",
                            );
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <h2>{s.name}</h2>
                  <p>
                    {g.type === "blue"
                      ? "Ter todos os bimestres com notas azuis"
                      : g.type === "average"
                        ? `Alcançar média ${fmt(target)}`
                        : `Acumular ${fmt(target)} pontos`}
                  </p>
                  <div className="goal-value">
                    {g.type === "blue" ? value : fmt(value)}{" "}
                    <span>/ {g.type === "blue" ? target : fmt(target)}</span>
                  </div>
                  <Progress value={target ? (value / target) * 100 : 100} />
                  <div className="row-between small">
                    <span className={reached ? "green" : "muted"}>
                      {reached
                        ? "Meta alcançada"
                        : `Faltam ${g.type === "blue" ? target - value : fmt(Math.max(0, round(target - value)))} ${g.type === "blue" ? "bimestres azuis" : "pontos"}`}
                    </span>
                    <Target
                      size={16}
                      className={reached ? "green" : "violet"}
                    />
                  </div>
                  {g.type === "average" && (
                    <small className="muted">
                      Média dos bimestres concluídos; pode mudar com novos
                      lançamentos.
                    </small>
                  )}
                </article>
              );
            })}
        </div>
      ) : (
        <div className="panel">
          <Empty title="Qual é seu próximo objetivo?">
            Crie uma meta de média, pontuação ou bimestres azuis para acompanhar
            sua evolução.
          </Empty>
          <div className="center-bottom">
            <button
              className="primary"
              onClick={() =>
                setEdit({
                  id: crypto.randomUUID(),
                  subjectId: "r10",
                  type: "average",
                  target: 8,
                  priority: false,
                })
              }
            >
              <Plus size={17} /> Criar primeira meta
            </button>
          </div>
        </div>
      )}
      {edit && (
        <Modal title="Definir meta" onClose={() => setEdit(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <label className="field">
              Disciplina
              <select
                value={edit.subjectId}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    subjectId: e.target.value,
                    target: edit.type === "total" ? 11 : edit.target,
                  })
                }
              >
                {data.subjects.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Tipo de meta
              <select
                value={edit.type}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    type: e.target.value as Goal["type"],
                    target: e.target.value === "total" ? 12 : 8,
                  })
                }
              >
                <option value="average">Média dos bimestres</option>
                <option value="total">Pontuação acumulada</option>
                <option value="blue">Todos os bimestres azuis</option>
              </select>
            </label>
            {edit.type !== "blue" && (
              <NumberField
                label="Valor desejado"
                value={edit.target}
                max={
                  edit.type === "total"
                    ? data.subjects.find((s) => s.id === edit.subjectId)!.terms
                        .length * 10
                    : 10
                }
                onChange={(n) => setEdit({ ...edit, target: n ?? 0 })}
              />
            )}
            <label className="check">
              <input
                type="checkbox"
                checked={edit.priority}
                onChange={(e) =>
                  setEdit({ ...edit, priority: e.target.checked })
                }
              />{" "}
              Priorizar esta disciplina
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setEdit(null)}
              >
                Cancelar
              </button>
              <button className="primary">Salvar meta</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
