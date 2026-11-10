import { useMemo, useState } from "react";
import { FlaskConical, RotateCcw, ArrowRight, ShieldCheck } from "lucide-react";
import type { Data, Grade, ExtraPoint } from "../lib/types";
import { key, emptyGrade } from "../lib/data";
import { summary, fmt, round } from "../lib/calculations";
import { ExtrasEditor } from "../components/ExtrasEditor";
import { Badge, NumberField, Panel, Progress } from "../components/UI";
export function Simulator({ data }: { data: Data }) {
  const [id, setId] = useState(data.subjects[10].id),
    [overrides, setOverrides] = useState<Record<string, Grade>>({}),
    [extraOverrides, setExtraOverrides] = useState<
      Record<string, ExtraPoint[]>
    >({});
  const s = data.subjects.find((s) => s.id === id)!;
  const current = summary(data, s);
  const simulated = useMemo(() => {
    const next = structuredClone(data);
    next.grades = { ...next.grades, ...overrides };
    for (const [k, extras] of Object.entries(extraOverrides)) {
      const g = next.grades[k] ?? emptyGrade();
      next.grades[k] = { ...g, extras: [...g.extras, ...extras] };
    }
    return next;
  }, [data, overrides, extraOverrides]);
  const result = summary(simulated, s);
  const remainingTerms = s.terms.length - current.complete;
  return (
    <>
      <div className="page-intro">
        <div>
          <h1>Simulador</h1>
          <p>
            Explore possibilidades e chegue às próximas provas com um plano.
          </p>
        </div>
        <span className="pill">
          <FlaskConical size={15} /> Ambiente de simulação
        </span>
      </div>
      <div className="notice">
        <ShieldCheck size={19} />
        <span>
          Experimente à vontade. As notas simuladas não alteram seus registros
          reais.
        </span>
      </div>
      <div className="sim-grid">
        <Panel
          title="Construa seu cenário"
          subtitle="Somente avaliações ainda não registradas podem ser simuladas."
          action={
            <button
              className="text-button"
              onClick={() => {
                setOverrides({});
                setExtraOverrides({});
              }}
            >
              <RotateCcw size={15} /> Limpar
            </button>
          }
        >
          <label className="field">
            Disciplina
            <select
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setOverrides({});
                setExtraOverrides({});
              }}
            >
              {data.subjects.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <div className="simulation-terms">
            {s.terms.map((t, i) => {
              const k = key(s.id, t),
                saved = data.grades[k] ?? emptyGrade(),
                g = overrides[k] ?? saved;
              const change = (field: keyof Grade, v: number | null) =>
                setOverrides({ ...overrides, [k]: { ...g, [field]: v } });
              return (
                <section key={k}>
                  <div className="row-between">
                    <h3>
                      {t}º bimestre{" "}
                      {s.category === "technical" && (
                        <small className="muted">
                          · {i + 1}º da disciplina
                        </small>
                      )}
                    </h3>
                    <span className="small muted">
                      {result.rows[i].gain > 0
                        ? `Paralela +${fmt(result.rows[i].gain)}`
                        : ""}
                    </span>
                  </div>
                  <div className="form-grid">
                    {(g.mode === "direct"
                      ? ["direct"]
                      : ["partial", "exam"]
                    ).map((f) => {
                      const field = f as "partial" | "exam" | "direct",
                        label =
                          f === "partial"
                            ? "Parcial"
                            : f === "exam"
                              ? "Bimestral"
                              : "Média direta";
                      return saved[field] !== null ? (
                        <div className="saved-score" key={f}>
                          <small>{label} · registrada</small>
                          <strong>{fmt(saved[field])}</strong>
                        </div>
                      ) : (
                        <NumberField
                          key={f}
                          label={`${label} · simular`}
                          value={g[field]}
                          onChange={(v) => change(field, v)}
                        />
                      );
                    })}
                  </div>
                  <p className="small muted">
                    Extras já registrados: +
                    {fmt(saved.extras.reduce((n, e) => n + e.value, 0))}. Média
                    final do cenário: {fmt(result.rows[i].corrected)}.
                  </p>
                  <ExtrasEditor
                    simulated
                    extras={extraOverrides[k] ?? []}
                    onChange={(extras) =>
                      setExtraOverrides({ ...extraOverrides, [k]: extras })
                    }
                  />
                </section>
              );
            })}
          </div>
        </Panel>
        <div className="sim-results">
          <Panel title="Resultado projetado" subtitle={s.name}>
            <div className="large-score">
              {fmt(result.sum)}
              <span> / {result.target} pontos</span>
            </div>
            <Progress value={result.targetProgress} />
            <Badge status={result.status} />
            <p className="small muted">
              Mínimo de aprovação: {result.min} pontos. O status usa esse
              mínimo, independentemente do objetivo escolhido.
            </p>
            <div className="detail-list">
              <div>
                <span>Acumulado real</span>
                <b>{fmt(current.sum)}</b>
              </div>
              <div>
                <span>Avaliações reais restantes</span>
                <b>{current.remaining}</b>
              </div>
              <div>
                <span>Faltam para o objetivo</span>
                <b>{fmt(result.targetMissing)} pts</b>
              </div>
              <div>
                <span>Máximo possível no cenário</span>
                <b>{fmt(result.max)} pts</b>
              </div>
              <div>
                <span>Média de referência restante</span>
                <b>
                  {remainingTerms
                    ? fmt(round(current.targetMissing / remainingTerms))
                    : "—"}
                </b>
              </div>
            </div>
            <p className="small muted">
              A média de referência divide os pontos faltantes pelos bimestres
              incompletos. A viabilidade abaixo também considera notas já
              lançadas, paralelas e os extras deste cenário. Extras futuros não
              informados não são presumidos.
            </p>
            <div
              className={`result-callout ${result.max < result.target ? "red" : "green"}`}
            >
              {result.sum >= result.target
                ? "Objetivo atingido neste cenário."
                : result.max < result.target
                  ? "Não é possível atingir o objetivo com as avaliações restantes neste cenário. Você pode testar extras adicionais; a aprovação continua seguindo 22/11."
                  : "É matematicamente possível atingir o objetivo selecionado."}
            </div>
          </Panel>
          <Panel
            title="Efeito das paralelas"
            subtitle="Atualizado com as notas do cenário"
          >
            {result.rows.some((r) => r.gain > 0) ? (
              result.rows
                .filter((r) => r.gain > 0)
                .map((r) => (
                  <div className="parallel-mini" key={r.term}>
                    <span>{r.term}º bimestre</span>
                    <span>
                      {fmt(r.original)} <ArrowRight size={13} />{" "}
                      <b className="green">{fmt(r.afterParallel)}</b>
                    </span>
                  </div>
                ))
            ) : (
              <p className="muted small">
                Nenhuma melhora de paralela neste cenário. Experimente uma
                parcial no bimestre seguinte.
              </p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
