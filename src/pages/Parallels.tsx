import {
  ArrowRight,
  GitCompareArrows,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import type { Data } from "../lib/types";
import { rows, fmt, round } from "../lib/calculations";
import { Panel, Empty, Score } from "../components/UI";
export function Parallels({ data }: { data: Data }) {
  const all = data.subjects.flatMap((s) =>
    rows(data, s)
      .filter((r) => r.original !== null && r.parallel !== null)
      .map((r) => ({ ...r, subject: s.name })),
  );
  const gained = all.filter((r) => r.gain > 0);
  return (
    <>
      <div className="page-intro">
        <div>
          <h1>Paralelas</h1>
          <p>Uma nova avaliação. Uma nova chance de melhorar.</p>
        </div>
        <span className="pill">
          <GitCompareArrows size={16} /> Cálculo automático
        </span>
      </div>
      <div className="mini-stats">
        <div className="stat">
          <span className="muted">Bimestres melhorados</span>
          <strong>{gained.length.toString().padStart(2, "0")}</strong>
        </div>
        <div className="stat">
          <span className="muted">Pontos recuperados</span>
          <strong className="green">
            +{fmt(round(gained.reduce((a, r) => a + r.gain, 0)))}
          </strong>
        </div>
        <div className="formula-card">
          <TrendingUp size={24} />
          <div>
            <h3>Seu esforço vai além da prova</h3>
            <p>
              A parcial seguinte pode melhorar a média anterior, até o limite de
              6,0.
            </p>
          </div>
        </div>
      </div>
      <Panel
        title="Antes e depois"
        subtitle="Notas originais preservadas. Extras somados somente após a paralela."
      >
        {all.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Disciplina / bimestre</th>
                  <th>Original</th>
                  <th>Parcial seguinte</th>
                  <th>Após paralela</th>
                  <th>Extras</th>
                  <th>Média final</th>
                  <th>Pontos recuperados</th>
                </tr>
              </thead>
              <tbody>
                {all.map((r) => (
                  <tr key={`${r.subject}${r.term}`}>
                    <td>
                      <strong>{r.subject}</strong>
                      <small>{r.term}º bimestre anual</small>
                    </td>
                    <td>
                      <Score value={r.original} />
                    </td>
                    <td>{fmt(r.parallel)}</td>
                    <td>
                      <Score value={r.afterParallel} />
                    </td>
                    <td>+{fmt(r.extraTotal)}</td>
                    <td>
                      <Score value={r.corrected} />
                    </td>
                    <td>
                      <span className={r.gain > 0 ? "green" : "muted"}>
                        {r.gain > 0 ? `+${fmt(r.gain)}` : "Sem alteração"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="As próximas parciais podem fazer a diferença">
            Registre uma média e a parcial do bimestre seguinte da mesma
            disciplina para visualizar o comparativo.
          </Empty>
        )}
      </Panel>
      <div className="explanation">
        <ShieldCheck size={22} />
        <div>
          <h3>Como funciona a paralela?</h3>
          <p>
            Média original + parcial seguinte <ArrowRight size={14} /> dividir
            por 2 <ArrowRight size={14} /> limitar a 6,0. Só aplicamos se
            melhorar uma média vermelha. Médias azuis permanecem iguais.
          </p>
          <p>
            Nas disciplinas técnicas, a comparação ocorre somente entre os dois
            bimestres da própria disciplina.
          </p>
        </div>
      </div>
    </>
  );
}
