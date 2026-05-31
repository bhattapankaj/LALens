import { useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CircleAlert, Lightbulb, Handshake, MapPin, ListChecks, ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { explainScoreDrivers } from "../utils/scoring";
import ScoreBreakdown from "./ScoreBreakdown";

function Collapsible({ title, icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="dash-collapsible">
      <button type="button" className="dash-collapsible-toggle" onClick={() => setOpen((v) => !v)}>
        <span className="dash-collapsible-label">
          {icon && <span className="dash-collapsible-icon" aria-hidden>{icon}</span>}
          {title}
        </span>
        {open ? <ChevronDown size={15} aria-hidden /> : <ChevronRight size={15} aria-hidden />}
      </button>
      {open && <div className="dash-collapsible-body">{children}</div>}
    </div>
  );
}

function ChartEmptyState({ title }) {
  return (
    <article className="card chart-empty-card chart-empty-card--placeholder">
      <div className="chart-empty-icon" aria-hidden />
      <h3>{title}</h3>
      <p className="tiny muted">Charts will populate once parish metrics are integrated.</p>
    </article>
  );
}

function ParishDashboardPending({ parish }) {
  return (
    <section className="dashboard-stack pending-dashboard-shell">
      <div className="pending-dashboard-banner">
        <span className="pending-dashboard-banner__icon" aria-hidden>
          <MapPin size={18} strokeWidth={1.75} />
        </span>
        <div>
          <p className="pending-dashboard-banner__title">Placeholder workspace</p>
          <p className="pending-dashboard-banner__text tiny muted">
            This layout is intentional: you are viewing a mapped parish before official inputs are wired in. Explore a sample parish on the map to see full charts and scores.
          </p>
        </div>
      </div>

      <div className="dashboard-top">
        <article className="card score-card-big pending-dashboard-hero">
          <p className="section-label">Parish overview</p>
          <h2 className="pending-dashboard-name">{parish.name}</h2>
          <p className="tiny muted">{parish.region}</p>
          <div className="pending-dashboard-badges">
            <span className="pending-pill">On statewide map</span>
            <span className="pending-pill pending-pill--accent">Data integration pending</span>
          </div>
          <p className="pending-dashboard-lead">
            This parish appears on the Gap Map for complete Louisiana coverage. Education, workforce, demographic, and pathway metrics are not loaded for this parish in the prototype, so no Opportunity Score or charts are shown here.
          </p>
          <p className="tiny muted pending-dashboard-footnote">No scores or rankings are implied for this parish until source data is connected.</p>
        </article>
        <article className="card pending-data-card">
          <p className="section-label">Next data needed</p>
          <ul className="pending-checklist">
            <li>
              <ListChecks size={16} strokeWidth={1.6} aria-hidden />
              <span>LDOE enrollment, performance, attendance, and graduation files</span>
            </li>
            <li>
              <ListChecks size={16} strokeWidth={1.6} aria-hidden />
              <span>U.S. Census ACS demographics at parish scale</span>
            </li>
            <li>
              <ListChecks size={16} strokeWidth={1.6} aria-hidden />
              <span>Louisiana Workforce Commission occupational projections</span>
            </li>
            <li>
              <ListChecks size={16} strokeWidth={1.6} aria-hidden />
              <span>NCES EDGE school geocodes for pathway access analysis</span>
            </li>
            <li>
              <ListChecks size={16} strokeWidth={1.6} aria-hidden />
              <span>Pathway inventory aligned to local demand</span>
            </li>
          </ul>
        </article>
      </div>

      <article className="card pending-scoring-card">
        <p className="section-label">How this will be scored</p>
        <p>
          When metrics are connected, the Opportunity Score will combine five factors: Student Need (35%), Enrollment Pressure (20%), Workforce Gap (25%), Pathway Access Gap (10%), and Feasibility (10%). Same transparent model used for sample parishes today.
        </p>
        <div className="pending-dashboard-actions">
          <Link to="/data-sources" className="btn btn-primary">
            Data sources <ArrowRight size={16} aria-hidden />
          </Link>
          <Link to="/methodology" className="btn btn-secondary">
            Methodology
          </Link>
        </div>
      </article>

      <div className="chart-grid pending-chart-grid">
        <ChartEmptyState title="Score radar" />
        <ChartEmptyState title="Enrollment trend" />
        <ChartEmptyState title="Workforce fit" />
      </div>

      <article className="card pending-next-card">
        <p className="section-label">What you can do now</p>
        <ul className="pending-next-list">
          <li>Use the map to compare geography and select a sample parish for a full scored dashboard.</li>
          <li>Review methodology weights so stakeholders know how scoring will work once feeds land.</li>
          <li>Align your data pipeline with the sources listed above before interpreting any parish-level rank.</li>
        </ul>
      </article>
    </section>
  );
}

function ParishDashboard({ parish }) {
  if (!parish) return <section className="card">No parish selected.</section>;

  if (!parish.hasMetrics) {
    return <ParishDashboardPending parish={parish} />;
  }

  const drivers = explainScoreDrivers(parish);
  const driverLine = drivers.map((d) => `${d.label} ${d.value}`).join(" · ");

  const radarData = [
    { factor: "Need", value: parish.studentNeedScore },
    { factor: "Enrollment", value: parish.enrollmentPressureScore },
    { factor: "Workforce", value: parish.workforceGapScore },
    { factor: "Access", value: parish.pathwayAccessGapScore },
    { factor: "Feasibility", value: parish.feasibilityScore }
  ];

  const trendData = (parish.enrollmentTrend || []).map((value, index) => ({ year: `Y${index + 1}`, value }));
  const chartHeight = 168;

  return (
    <section className="dashboard-stack">
      {/* ── Primary: score + intervention always visible ── */}
      <div className="dashboard-top">
        <article className="card score-card-big">
          <p className="section-label">Opportunity Score</p>
          <div className="score-card-head">
            <h2>{parish.opportunityScore}</h2>
            <span className="prototype-badge">Prototype score</span>
          </div>
          <span className={`priority-pill ${parish.priorityLevel.toLowerCase()}`}>{parish.priorityLevel}</span>
          <p>{parish.name}</p>
          <p className="tiny muted dashboard-driver-line">Top drivers: {driverLine}</p>
        </article>
        <article className="card dashboard-intervention-card">
          <p className="section-label">Recommended Intervention</p>
          <h3>{parish.recommendedIntervention}</h3>
          <p>{parish.recommendationSummary}</p>
        </article>
      </div>

      {/* ── Collapsible sections ── */}
      <div className="dash-collapsibles card">
        <Collapsible title="Score breakdown" defaultOpen={false}>
          <ScoreBreakdown parish={parish} compact />
        </Collapsible>

        <Collapsible title="Charts" defaultOpen={false}>
          <div className="chart-grid">
            <article className="card">
              <h3>Score Radar</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData} margin={{ top: 16, right: 30, bottom: 16, left: 30 }} outerRadius="62%">
                  <PolarGrid stroke="#E6E8F0" />
                  <PolarAngleAxis dataKey="factor" stroke="#697089" tick={{ fontSize: 11, fill: "#697089" }} />
                  <Radar dataKey="value" stroke="#6D5DFB" fill="#6D5DFB" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </article>
            <article className="card">
              <h3>Enrollment Trend</h3>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <LineChart data={trendData}>
                  <CartesianGrid stroke="#E6E8F0" strokeDasharray="4 4" />
                  <XAxis dataKey="year" stroke="#697089" />
                  <YAxis stroke="#697089" />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#5EDFFF" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </article>
            <article className="card">
              <h3>Workforce Fit</h3>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={parish.workforceFit || []}>
                  <CartesianGrid stroke="#E6E8F0" strokeDasharray="4 4" />
                  <XAxis dataKey="sector" stroke="#697089" />
                  <YAxis stroke="#697089" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6C5CE7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </article>
          </div>
        </Collapsible>

        <Collapsible title="Evidence, risks & partners" defaultOpen={false}>
          <div className="list-grid">
            <article className="card">
              <h3><Lightbulb size={15} /> Evidence</h3>
              <ul>{parish.keyEvidence.map((x) => <li key={x}>{x}</li>)}</ul>
            </article>
            <article className="card">
              <h3><CircleAlert size={15} /> Risks</h3>
              <ul>{parish.risks.map((x) => <li key={x}>{x}</li>)}</ul>
            </article>
            <article className="card">
              <h3><Handshake size={15} /> Partners</h3>
              <ul>{parish.potentialPartners.map((x) => <li key={x}>{x}</li>)}</ul>
            </article>
          </div>
        </Collapsible>
      </div>
    </section>
  );
}

export default ParishDashboard;
