import { Target } from "lucide-react";
import type { Data, SaveData } from "../lib/types";
export function TargetSelector({
  data,
  onSave,
}: {
  data: Data;
  onSave: SaveData;
}) {
  return (
    <div className="target-selector">
      <div>
        <Target size={17} />
        <span>Objetivo de acompanhamento</span>
      </div>
      <select
        aria-label="Objetivo de acompanhamento"
        value={data.settings.targetMode}
        onChange={(e) =>
          void onSave(
            {
              ...data,
              settings: {
                ...data.settings,
                targetMode: e.target.value as "minimum" | "desired",
              },
            },
            "Objetivo atualizado.",
          )
        }
      >
        <option value="minimum">Mínimo · 22 regular / 11 técnico</option>
        <option value="desired">Meta · 24 regular / 12 técnico</option>
      </select>
      <p>Aprovação permanece em 22 / 11 pontos.</p>
    </div>
  );
}
