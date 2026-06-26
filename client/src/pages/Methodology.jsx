import { CheckCircle2, Scale, GitBranch, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { SAMPLE_METRIC_COUNT, TOTAL_LA_PARISH_COUNT } from "../data/parishes";
import MethodologyWeights from "../components/MethodologyWeights";

const FACTORS = [
  {
    key: "studentNeed",
    title: "Student need",
    weight: "35%",
    body: "Academic proficiency, graduation, absenteeism, and socioeconomic context when connected."
  },
  {
    key: "enrollment",
    title: "Enrollment pressure",
    weight: "20%",
    body: "Enrollment growth or decline and stress on local school models."
  },
  {
    key: "workforce",
    title: "Workforce gap",
    weight: "25%",
    body: "Projected regional demand and pathway-to-opportunity alignment."
  },
  {
    key: "pathway",
    title: "Pathway access",
    weight: "10%",
    body: "Availability of pathways tied to high-demand occupations."
  },
  {
    key: "feasibility",
    title: "Feasibility",
    weight: "10%",
    body: "Partner capacity, employer links, and implementation readiness."
  }
];

const PIPELINE = [
  "Data input",
  "Normalization",
  "Weighted score",
  "Recommendation",
  "Human review"
];

const TRUST = [
  "Transparent inputs and published weights",
  "Adjustable weights with live preview",
  "Sensitivity analysis ready",
  "Evidence and limitations surfaced in-product"
];

function Methodology() {
  return (
    <main className="app-page">
      <header className="card app-page-hero">
        <p className="app-page-kicker">Methodology</p>
        <h1>
          How the <span className="app-gradient-text">Opportunity Score</span> works
        </h1>
        <p className="app-page-lead">
          A transparent multi-factor decision-support model. It does not replace human judgment and does not claim
          exact causal impact.
        </p>
        <p className="app-page-note">
          The map includes all <strong>{TOTAL_LA_PARISH_COUNT} Louisiana parishes</strong> for geography. Prototype
          opportunity scores are available for all <strong>{SAMPLE_METRIC_COUNT} parishes</strong> using Census
          poverty and income indicators. Scores use published weights and model estimates, not official statewide LDOE
          or workforce releases.
        </p>
        <div className="app-page-hero-actions">
          <Link to="/platform" className="btn app-btn-gradient">
            Open platform
          </Link>
          <Link to="/data-sources" className="btn btn-secondary">
            View data sources
          </Link>
        </div>
      </header>

      <section className="card app-formula-card">
        <div className="app-formula-head">
          <Scale size={22} aria-hidden />
          <h2>Opportunity Score formula</h2>
        </div>
        <p className="app-formula-text mono">
          35% Student Need + 20% Enrollment Pressure + 25% Workforce Gap + 10% Pathway Access Gap + 10% Feasibility
        </p>
      </section>

      <section className="app-page-section">
        <p className="app-page-kicker">Score factors</p>
        <h2 className="app-section-title">Five factors, one ranked brief</h2>
        <ul className="app-factor-grid">
          {FACTORS.map((f) => (
            <li key={f.key} className="app-factor-card">
              <span className="app-factor-weight">{f.weight}</span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card app-pipeline-card">
        <div className="app-pipeline-head">
          <GitBranch size={20} aria-hidden />
          <h2>Model pipeline</h2>
        </div>
        <ol className="app-pipeline-steps">
          {PIPELINE.map((step, i) => (
            <li key={step}>
              <span className="app-pipeline-num">{String(i + 1).padStart(2, "0")}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <MethodologyWeights />

      <section className="card app-trust-card">
        <div className="app-trust-head">
          <Shield size={20} aria-hidden />
          <h2>Trust and transparency</h2>
        </div>
        <ul className="app-trust-list">
          {TRUST.map((item) => (
            <li key={item}>
              <CheckCircle2 size={16} aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default Methodology;
