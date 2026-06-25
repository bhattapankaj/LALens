import { BarChart3, MapPinned, BriefcaseBusiness, Sparkles } from "lucide-react";

function HomePlanningCard() {
  return (
    <article className="home-planning-card">
      <span className="home-planning-deco" aria-hidden>01</span>
      <div className="home-planning-badge">
        <Sparkles size={18} strokeWidth={1.75} />
      </div>
      <h2 className="home-planning-title">Prioritize the next high-impact education pathway</h2>
      <p className="home-planning-sub">A decision-ready workflow for funders, school operators, and policy leaders.</p>
      <div className="home-planning-minis">
        <div className="home-planning-mini">
          <BarChart3 size={18} />
          <span>Opportunity Score</span>
        </div>
        <div className="home-planning-mini">
          <MapPinned size={18} />
          <span>Gap Map</span>
        </div>
        <div className="home-planning-mini">
          <BriefcaseBusiness size={18} />
          <span>Workforce Alignment</span>
        </div>
      </div>
      <hr className="home-planning-divider" />
      <p className="home-planning-out">
        <strong>Recommended output:</strong> A ranked parish brief across all 64 Louisiana parishes: evidence, risks, and suggested partners for discussion, not official statewide allocation.
      </p>
    </article>
  );
}

export default HomePlanningCard;
