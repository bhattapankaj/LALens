import { TrendingUp } from "lucide-react";
import { PLATFORM_KPI_CARDS } from "../data/stateMetrics";
import SourceBadge from "./SourceBadge";

function PlatformKpiStrip() {
  return (
    <section className="platform-kpi-strip" aria-label="Louisiana education context">
      <p className="platform-kpi-intro tiny muted">
        Decision preview combining public-source facts with prototype opportunity scores across all 64 parishes. Not live statewide official scoring.
      </p>
      <div className="platform-kpi-grid">
        {PLATFORM_KPI_CARDS.map((c) => (
          <article key={c.key} className="platform-kpi-card">
            <div className="platform-kpi-card-top">
              <SourceBadge type={c.badge} />
            </div>
            <p className="platform-kpi-value">{c.value}</p>
            <p className="platform-kpi-label">{c.label}</p>
            <p className="platform-kpi-hint">{c.hint}</p>
            {c.trend ? (
              <p className="platform-kpi-trend up">
                <TrendingUp size={12} aria-hidden /> {c.trend}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export default PlatformKpiStrip;
