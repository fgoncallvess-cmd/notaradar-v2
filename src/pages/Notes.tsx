import { useState } from "react";
import { Search, SlidersHorizontal, Plus, ArrowUpRight } from "lucide-react";
import type { Data, Subject, Term } from "../lib/types";
import { summary, fmt } from "../lib/calculations";
import { Badge, Progress, Score } from "../components/UI";
export function Notes({
  data,
  onEdit,
  onRecovery,
}: {
  data: Data;
  onEdit: (s: Subject, t: Term) => void;
  onRecovery: (s: Subject) => void;
}) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [term, setTerm] = useState("all"),
    [semester, setSemester] = useState("all"),
    [situation, setSituation] = useState("all");
  const visible = data.subjects.filter(
    (s) =>
      s.name
        .toLocaleLowerCase("pt-BR")
        .includes(query.toLocaleLowerCase("pt-BR")) &&
      (category === "all" || s.category === category) &&
      (term === "all" || s.terms.includes(Number(term) as Term)) &&
      (semester === "all" ||
        s.terms.some((t) => (semester === "1" ? t <= 2 : t >= 3))) &&
      (situation === "all" ||
        (situation === "risk"
          ? summary(data, s).risk
          : situation === "none"
            ? !summary(data, s).has
            : summary(data, s).sum >= summary(data, s).min)),
  );
  return (
    <>
      <div className="page-intro">
        <div>
          <h1>Minhas notas</h1>
          <p>Organize suas avaliações. Deixe os cálculos com o NotaRadar.</p>
        </div>
        <span className="pill">22 disciplinas · 2026</span>
      </div>
      <div className="filter-bar">
        <label className="search">
          <Search size={17} />
          <input
            placeholder="Buscar disciplina..."
            aria-label="Buscar disciplina"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <SlidersHorizontal size={17} className="muted" />
        <select
          aria-label="Bimestre"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        >
          <option value="all">Todos os bimestres</option>
          {[1, 2, 3, 4].map((t) => (
            <option key={t} value={t}>
              {t}º bimestre
            </option>
          ))}
        </select>
        <select
          aria-label="Semestre"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        >
          <option value="all">Ano completo</option>
          <option value="1">1º semestre</option>
          <option value="2">2º semestre</option>
        </select>
        <select
          aria-label="Situação"
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
        >
          <option value="all">Todas as situações</option>
          <option value="risk">Precisam de atenção</option>
          <option value="none">Sem notas</option>
          <option value="approved">Mínimo atingido</option>
        </select>
      </div>
      <div className="tabs">
        {[
          ["all", "Todas as disciplinas"],
          ["regular", "Ensino Regular"],
          ["technical", "Curso Técnico"],
        ].map(([v, label]) => (
          <button
            key={v}
            className={category === v ? "active" : ""}
            onClick={() => setCategory(v)}
          >
            {label}
            <span>{v === "all" ? 22 : v === "regular" ? 14 : 8}</span>
          </button>
        ))}
      </div>
      <div className="subject-grid">
        {visible.map((s) => {
          const a = summary(data, s);
          return (
            <article className="subject-card" key={s.id}>
              <div className="row-between">
                <span className="eyebrow">
                  {s.category === "regular"
                    ? "ENSINO REGULAR"
                    : `TÉCNICO · ${s.terms[0] === 1 ? "1º" : "2º"} SEMESTRE`}
                </span>
                <span className="small muted">Meta: {a.target} pts</span>
              </div>
              <h2>{s.name}</h2>
              <Badge status={a.status} />
              <div
                className="term-grid"
                style={{ gridTemplateColumns: `repeat(${s.terms.length},1fr)` }}
              >
                {a.rows
                  .filter(
                    (r) =>
                      (term === "all" || r.term === Number(term)) &&
                      (semester === "all" ||
                        (semester === "1" ? r.term <= 2 : r.term >= 3)),
                  )
                  .map((r) => (
                    <button
                      className="term"
                      key={r.term}
                      onClick={() => onEdit(s, r.term)}
                    >
                      <small>
                        {r.term}º bim.
                        {s.category === "technical" && (
                          <em>{s.terms.indexOf(r.term) + 1}º da disciplina</em>
                        )}
                      </small>
                      {r.corrected === null ? (
                        <Plus size={18} />
                      ) : (
                        <Score value={r.corrected} />
                      )}
                      <small className={r.gain ? "green" : "muted"}>
                        {r.gain
                          ? `+${fmt(r.gain)} paralela`
                          : data.grades[`${s.id}:${r.term}`]?.mode === "direct"
                            ? "Média informada"
                            : r.corrected === null
                              ? "Lançar"
                              : "Ver avaliações"}
                      </small>
                      {r.extraTotal > 0 && (
                        <small className="violet">
                          +{fmt(r.extraTotal)} extras
                          {r.corrected === null ? " pendentes" : ""}
                        </small>
                      )}
                    </button>
                  ))}
              </div>
              <div className="row-between small">
                <span className="muted">Pontuação acumulada</span>
                <b>
                  {fmt(a.sum)} <span className="muted">/ {a.target}</span>
                </b>
              </div>
              <Progress value={a.targetProgress} />
              <div className="subject-footer">
                <span>
                  {a.targetMissing > 0
                    ? `Faltam ${fmt(a.targetMissing)} pontos`
                    : "Objetivo de pontos atingido"}
                </span>
                <button className="text-button" onClick={() => onRecovery(s)}>
                  Recuperação <ArrowUpRight size={13} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!visible.length && (
        <div className="empty">
          <h3>Nenhuma disciplina encontrada</h3>
          <p>Ajuste a pesquisa ou os filtros.</p>
        </div>
      )}
    </>
  );
}
