import { Plus, Trash2, Sparkles } from "lucide-react";
import type { ExtraPoint } from "../lib/types";
import { NumberField } from "./UI";
import { fmt } from "../lib/calculations";
export function ExtrasEditor({
  extras,
  onChange,
  simulated = false,
}: {
  extras: ExtraPoint[];
  onChange: (extras: ExtraPoint[]) => void;
  simulated?: boolean;
}) {
  const update = (id: string, patch: Partial<ExtraPoint>) =>
    onChange(extras.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  return (
    <section className="extras-editor">
      <div className="row-between">
        <h3>
          <Sparkles size={16} />{" "}
          {simulated ? "Extras do cenário" : "Pontos extras"}
        </h3>
        <span className="pill">
          +{fmt(extras.reduce((n, e) => n + Math.round(e.value * 10), 0) / 10)}
        </span>
      </div>
      <p className="small muted">
        Somados depois da paralela, sem divisão. Média final limitada a 10,0.
      </p>
      {extras.map((e, i) => (
        <div className="extra-entry" key={e.id}>
          <label className="field">
            Descrição do extra {i + 1}
            <input
              aria-label={`Descrição do extra ${i + 1}`}
              value={e.description}
              required
              maxLength={120}
              placeholder="Ex.: Trabalho de redes"
              onChange={(event) =>
                update(e.id, { description: event.target.value })
              }
            />
          </label>
          <NumberField
            label={`Pontos do extra ${i + 1}`}
            value={e.value}
            min={0.1}
            required
            onChange={(v) => update(e.id, { value: v ?? 0 })}
          />
          <button
            type="button"
            className="icon-button danger"
            aria-label={`Remover extra ${i + 1}`}
            onClick={() => {
              if (
                simulated ||
                confirm(
                  "Remover este ponto extra? A mudança será aplicada ao salvar.",
                )
              )
                onChange(extras.filter((x) => x.id !== e.id));
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="secondary"
        disabled={extras.length >= 30}
        onClick={() =>
          onChange([
            ...extras,
            { id: crypto.randomUUID(), description: "", value: 1 },
          ])
        }
      >
        <Plus size={15} /> Adicionar ponto extra
      </button>
    </section>
  );
}
