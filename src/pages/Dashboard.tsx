import {
  ArrowRight,
  BookOpen,
  CheckCheck,
  TrendingUp,
  TriangleAlert,
  Target,
  Plus,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { Data } from "../lib/types";
import { summary, fmt, round } from "../lib/calculations";
import { Badge, Empty, Panel, Progress } from "../components/UI";
const tooltip = {
  contentStyle: {
    background: "#29213F",
    border: "1px solid #514466",
    borderRadius: 12,
    color: "#F7F3FF",
  },
  labelStyle: { color: "#C4B9DC" },
};
export function Dashboard({
  data,
  onAdd,
  onNotes,
}: {
  data: Data;
  onAdd: () => void;
  onNotes: () => void;
}) {
  const stats = data.subjects.map((s) => ({ s, ...summary(data, s) }));
  const all = stats.flatMap((s) => s.rows).filter((r) => r.corrected !== null);
  const blue = all.filter((r) => r.corrected! >= 6).length,
    red = all.length - blue,
    attention = stats.filter((s) => s.risk);
  const attained = stats.filter(
    (s) => s.sum >= s.min || s.status === "Aprovado por recuperação",
  ).length;
  const evolution = [1, 2, 3, 4].map((t) => {
    const vals = all.filter((r) => r.term === t);
    return {
      name: `${t}º bim.`,
      media: vals.length
        ? round(vals.reduce((n, r) => n + r.corrected!, 0) / vals.length)
        : null,
    };
  });
  const compare = stats
    .filter((s) => s.complete)
    .map((s) => ({ name: s.s.name, media: round(s.sum / s.complete) }));
  const recent = Object.entries(data.grades)
    .sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt))
    .slice(0, 5);
  return (
    <>
      <div className="welcome">
        <div>
          <div className="eyebrow">SEU ANO, EM PERSPECTIVA</div>
          <h1>
            Seu desempenho em foco<span>.</span>
          </h1>
          <p>
            Cada nota conta. Acompanhe sua evolução e planeje o próximo passo.
          </p>
        </div>
        <button className="primary" onClick={onAdd}>
          <Plus size={18} /> Adicionar nota
        </button>
      </div>
      <Panel
        title="Quanto falta para seu objetivo?"
        subtitle={`Regular: ${data.settings.targetMode === "desired" ? 24 : 22} pontos · Técnico: ${data.settings.targetMode === "desired" ? 12 : 11} pontos. Aprovação permanece em 22/11.`}
      >
        <div className="objective-grid">
          {stats.filter((x) => x.has).length ? (
            stats
              .filter((x) => x.has)
              .map((x) => (
                <div className="objective-item" key={x.s.id}>
                  <div className="row-between">
                    <strong>{x.s.name}</strong>
                    <b>
                      {fmt(x.sum)} / {x.target}
                    </b>
                  </div>
                  <Progress value={x.targetProgress} />
                  <span className={x.targetMissing ? "muted" : "green"}>
                    {x.targetMissing
                      ? `Faltam ${fmt(x.targetMissing)} pontos`
                      : "Objetivo atingido"}
                  </span>
                </div>
              ))
          ) : (
            <p className="muted small">
              As disciplinas aparecerão aqui conforme você registrar suas notas.
            </p>
          )}
        </div>
      </Panel>
      <div className="stats-grid">
        {[
          {
            label: "Disciplinas",
            value: 22,
            detail: "14 regulares · 8 técnicas",
            icon: BookOpen,
            color: "violet",
          },
          {
            label: "Notas azuis",
            value: blue,
            detail: "Médias a partir de 6,0",
            icon: TrendingUp,
            color: "blue",
          },
          {
            label: "Notas vermelhas",
            value: red,
            detail: "Médias abaixo de 6,0",
            icon: TriangleAlert,
            color: "red",
          },
          {
            label: "Precisam de atenção",
            value: attention.length,
            detail: "Disciplinas para priorizar",
            icon: Target,
            color: "yellow",
          },
          {
            label: "Aprovação encaminhada",
            value: attained,
            detail: "Mínimo ou recuperação atingidos",
            icon: CheckCheck,
            color: "green",
          },
        ].map((c) => (
          <div className="stat" key={c.label}>
            <div className="stat-top">
              <span>{c.label}</span>
              <c.icon size={18} className={c.color} />
            </div>
            <strong>{c.value.toString().padStart(2, "0")}</strong>
            <small>{c.detail}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <Panel
          title="Evolução do rendimento"
          subtitle="Média das disciplinas com bimestre concluído"
          action={
            <span className="legend">
              <i /> Média geral
            </span>
          }
        >
          <div className="chart">
            {all.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={evolution}
                  margin={{ left: -20, right: 20, top: 12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="violet" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#B9A0FF"
                        stopOpacity={0.24}
                      />
                      <stop offset="100%" stopColor="#B9A0FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="#40364f"
                    vertical={false}
                    strokeDasharray="3 5"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#a99cbf", fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#a99cbf", fontSize: 12 }}
                  />
                  <Tooltip {...tooltip} />
                  <Area
                    type="monotone"
                    dataKey="media"
                    name="Média"
                    stroke="#B9A0FF"
                    strokeWidth={3}
                    fill="url(#violet)"
                    dot={{ r: 4, fill: "#B9A0FF" }}
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Empty title="Sua evolução começa aqui">
                As médias aparecerão conforme você registrar os bimestres.
              </Empty>
            )}
          </div>
          <div className="panel-foot">
            <span className="dot violet" /> Paralelas e pontos extras já estão
            incluídos nas médias.
          </div>
        </Panel>
        <Panel
          title="Panorama das notas"
          subtitle="Médias bimestrais registradas"
        >
          <div className="donut">
            <div className="donut-ring">
              {all.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Azuis", value: blue },
                        { name: "Vermelhas", value: red },
                      ]}
                      dataKey="value"
                      innerRadius={67}
                      outerRadius={82}
                      stroke="none"
                      paddingAngle={all.length > 1 ? 4 : 0}
                    >
                      <Cell fill="#60A5FA" />
                      <Cell fill="#FB7185" />
                    </Pie>
                    <Tooltip {...tooltip} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-ring" />
              )}
              <div className="donut-label">
                <strong>{all.length}</strong>
                <span>médias registradas</span>
              </div>
            </div>
            <div className="donut-legend">
              <span>
                <i className="dot blue" /> Azuis <b>{blue}</b>
              </span>
              <span>
                <i className="dot red" /> Vermelhas <b>{red}</b>
              </span>
            </div>
          </div>
        </Panel>
      </div>
      <div className="dashboard-grid">
        <Panel
          title="No seu radar"
          subtitle="Um olhar atento ao que precisa de você"
          action={
            <button className="text-button" onClick={onNotes}>
              Ver disciplinas <ArrowRight size={15} />
            </button>
          }
        >
          {attention.length ? (
            <div className="priority-list">
              {attention
                .sort((a, b) => a.progress - b.progress)
                .slice(0, 4)
                .map((x) => (
                  <div className="priority" key={x.s.id}>
                    <div className="row-between">
                      <strong>{x.s.name}</strong>
                      <Badge status={x.status} />
                    </div>
                    <div className="row-between muted small">
                      <span>
                        {fmt(x.sum)} de {x.min} pontos
                      </span>
                      <span>Faltam {fmt(x.missing)}</span>
                    </div>
                    <Progress value={x.progress} />
                  </div>
                ))}
            </div>
          ) : (
            <Empty
              title={
                all.length
                  ? "Nenhuma disciplina em alerta"
                  : "Tudo pronto para começar"
              }
              action={!all.length ? onAdd : undefined}
            >
              {all.length
                ? "Continue registrando suas avaliações para acompanhar seu progresso."
                : "Adicione suas notas e descubra quais disciplinas precisam de atenção."}
            </Empty>
          )}
        </Panel>
        <Panel title="Atividade recente" subtitle="Seus últimos lançamentos">
          {recent.length ? (
            <div className="activity-list">
              {recent.map(([k, g]) => {
                const [id, t] = k.split(":");
                const s = data.subjects.find((s) => s.id === id)!;
                const r = stats
                  .find((x) => x.s.id === id)!
                  .rows.find((r) => r.term === Number(t))!;
                const prev = stats
                  .find((x) => x.s.id === id)!
                  .rows.find((r) => r.term === Number(t) - 1);
                return (
                  <div className="activity" key={k}>
                    <div className="activity-icon">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <strong>{s.name}</strong>
                      <p>
                        {t}º bimestre ·{" "}
                        {g.mode === "direct"
                          ? "Média informada"
                          : "Avaliações atualizadas"}
                      </p>
                      {prev && prev.gain > 0 && (
                        <small className="green">
                          Paralela: +{fmt(prev.gain)} no {prev.term}º bim.
                        </small>
                      )}
                    </div>
                    <div className="activity-end">
                      <b>{fmt(r.corrected)}</b>
                      <small>
                        {new Date(g.updatedAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty title="Seu histórico ainda está em branco">
              Os lançamentos mais recentes e os efeitos das paralelas aparecerão
              aqui.
            </Empty>
          )}
        </Panel>
      </div>
      <Panel
        title="Comparativo por disciplina"
        subtitle="Média dos bimestres concluídos, incluindo paralelas e extras"
      >
        {compare.length ? (
          <div style={{ height: Math.max(230, compare.length * 37) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={compare}
                layout="vertical"
                margin={{ left: 0, right: 24 }}
              >
                <CartesianGrid
                  stroke="#40364f"
                  horizontal={false}
                  strokeDasharray="3 5"
                />
                <XAxis
                  type="number"
                  domain={[0, 10]}
                  tick={{ fill: "#C4B9DC" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={185}
                  tick={{ fill: "#C4B9DC", fontSize: 11 }}
                />
                <Tooltip {...tooltip} />
                <Bar
                  dataKey="media"
                  name="Média"
                  radius={[0, 4, 4, 0]}
                  barSize={12}
                >
                  {compare.map((c) => (
                    <Cell
                      key={c.name}
                      fill={c.media >= 6 ? "#60A5FA" : "#FB7185"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty title="Um novo ponto de vista sobre suas notas">
            Conclua o primeiro bimestre de uma disciplina para visualizar a
            comparação.
          </Empty>
        )}
      </Panel>
    </>
  );
}
