import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { parishes } from "../data/parishes";
import BrandLogo from "./BrandLogo";
import SourceBadge from "./SourceBadge";

const chartColors = {
  purple: "#7C3AED",
  violet: "#8B5CF6",
  pink: "#DB4FB7",
  orange: "#F97316",
  green: "#16A34A",
  blue: "#2563EB"
};

function shortParishName(name) {
  return name.replace(" Parish", "").replace("East Baton Rouge", "E. Baton Rouge");
}

const tooltipStyle = {
  background: "#FFFFFF",
  border: "1px solid #E7DCCF",
  borderRadius: 12,
  fontSize: 12,
  color: "#1A0D07"
};

function HomeChartsPreview() {
  const scored = useMemo(
    () => parishes.filter((p) => p.hasMetrics && typeof p.opportunityScore === "number"),
    []
  );

  const barData = useMemo(
    () =>
      [...scored]
        .sort((a, b) => b.opportunityScore - a.opportunityScore)
        .slice(0, 6)
        .map((p) => ({ name: shortParishName(p.name), score: p.opportunityScore })),
    [scored]
  );

  const pieData = useMemo(() => {
    const counts = { Urgent: 0, High: 0, Moderate: 0, Low: 0 };
    for (const p of scored) {
      if (counts[p.priorityLevel] !== undefined) counts[p.priorityLevel] += 1;
    }
    return [
      { name: "Urgent", value: counts.Urgent, color: chartColors.pink },
      { name: "High", value: counts.High, color: chartColors.orange },
      { name: "Moderate", value: counts.Moderate, color: chartColors.blue },
      { name: "Low", value: counts.Low, color: chartColors.green }
    ].filter((d) => d.value > 0);
  }, [scored]);

  const lineData = useMemo(() => {
    const trend = scored.find((p) => p.id === "claiborne")?.enrollmentTrend || scored[0]?.enrollmentTrend || [];
    const labels = ["Y1", "Y2", "Y3", "Y4", "Y5"];
    return trend.map((v, i) => ({ m: labels[i] || `Y${i + 1}`, v }));
  }, [scored]);

  const topRanked = useMemo(() => [...scored].sort((a, b) => b.opportunityScore - a.opportunityScore), [scored]);
  const lead = topRanked[0];
  const second = topRanked[1];

  return (
    <section className="home-analytics">
      <p className="home-kicker">PLATFORM PREVIEW</p>
      <h2 className="home-section-title">Decision intelligence, not another spreadsheet.</h2>
      <p className="home-section-lead">
        This is how LALens turns source data into an investment brief—not just another chart wall.
      </p>

      <div className="home-analytics-grid">
        <article className="home-chart-card home-chart-card-wide">
          <div className="home-chart-title-row">
            <h3 className="home-chart-title">Opportunity Score by Parish</h3>
            <SourceBadge type="model" label="Model estimate" />
          </div>
          <p className="home-chart-note">Prototype opportunity scores across all 64 Louisiana parishes.</p>
          <div className="home-chart-wrap" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#E7DCCF" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#7B6F68", fontSize: 11 }} axisLine={{ stroke: "#E7DCCF" }} />
                <YAxis tick={{ fill: "#7B6F68", fontSize: 11 }} axisLine={{ stroke: "#E7DCCF" }} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? chartColors.purple : chartColors.orange} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <h3 className="home-chart-title home-chart-title-spaced">Sample enrollment index trend</h3>
          <div className="home-chart-wrap" style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#E7DCCF" />
                <XAxis dataKey="m" tick={{ fill: "#7B6F68", fontSize: 11 }} />
                <YAxis tick={{ fill: "#7B6F68", fontSize: 11 }} domain={["auto", "auto"]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="v" stroke={chartColors.violet} strokeWidth={2} dot={{ fill: chartColors.purple, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <div className="home-analytics-stack">
          <article className="home-chart-card">
            <div className="home-chart-title-row">
              <h3 className="home-chart-title">Priority mix</h3>
              <SourceBadge type="demo" label="12-parish sample" />
            </div>
            <div className="home-chart-wrap" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#7B6F68" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="home-chart-card home-ai-card">
            <div className="home-ai-card-title-row">
              <BrandLogo variant="feature" />
              <h3 className="home-chart-title">AI insight preview</h3>
              <SourceBadge type="model" label="Grounded assistant" />
            </div>
            <p className="home-ai-q">Where should we invest first?</p>
            <p className="home-ai-a">
              Prioritize parishes where high student need overlaps with workforce demand and limited pathway access. In this sample dataset, {lead?.name.replace(" Parish", "")} and {second?.name.replace(" Parish", "")} rank highest on the current Opportunity Score—useful for discussion, not as an official statewide allocation.
            </p>
            <span className="home-confidence-pill">Medium High confidence (within sample)</span>
          </article>

          <article className="home-chart-card home-brief-card">
            <div className="home-chart-title-row">
              <h3 className="home-chart-title">Selected parish brief</h3>
              <SourceBadge type="demo" label="Example output" />
            </div>
            <p className="home-brief-parish">{lead?.name}</p>
            <p className="home-brief-score">
              <span className="mono">Score</span> <strong>{lead?.opportunityScore}</strong>
            </p>
            <p className="home-brief-int">
              <strong>Recommended intervention:</strong> {lead?.recommendedIntervention}
            </p>
            <div className="home-evidence-chips">
              <span>Low proficiency</span>
              <span>Enrollment pressure</span>
              <span>Workforce gap</span>
              <span>Limited pathway access</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default HomeChartsPreview;
