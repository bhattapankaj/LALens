import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Users, TrendingUp, DollarSign, BookOpen, School, X, Phone, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import SourceBadge from "./SourceBadge";
import censusLocal from "../data/censusProfiles.json";
import schoolDirectory from "../data/schoolDirectory.json";

const censusLocalMap = Object.fromEntries(censusLocal.map((p) => [p.parishId, p]));

function useCensusProfile(parishId) {
  const [data, setData] = useState(() => (parishId ? censusLocalMap[parishId] ?? null : null));
  useEffect(() => {
    if (!parishId) return;
    setData(censusLocalMap[parishId] ?? null);
    let cancelled = false;
    const base = import.meta.env.VITE_API_URL || "";
    fetch(`${base}/api/public-data/parish/${parishId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setData(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [parishId]);
  return data;
}

function SchoolDirectoryModal({ parishName, schools, onClose }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const types = ["All", ...new Set(schools.map((s) => s.type))];
  const filtered = schools.filter((s) => {
    const matchType = typeFilter === "All" || s.type === typeFilter;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="school-modal-overlay" role="dialog" aria-modal="true" aria-label="School directory">
      <div className="school-modal">
        <div className="school-modal-head">
          <div>
            <p className="section-label">LDOE 2023–24 School Directory</p>
            <h3>{parishName} — {schools.length} institutions</h3>
          </div>
          <button type="button" className="school-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="school-modal-filters">
          <input
            className="school-modal-search"
            placeholder="Search by name or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="school-modal-type-btns">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                className={`school-type-btn${typeFilter === t ? " active" : ""}`}
                onClick={() => setTypeFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="school-modal-list">
          {filtered.length === 0 ? (
            <p className="tiny muted" style={{ padding: "1rem" }}>No schools match your search.</p>
          ) : filtered.map((s, i) => (
            <div key={i} className="school-modal-row">
              <div className="school-modal-row-main">
                <strong>{s.name}</strong>
                <span className={`school-type-pill school-type-pill--${s.type === "Public" ? "public" : "nonpublic"}`}>
                  {s.type}
                </span>
              </div>
              <div className="school-modal-row-meta">
                <span><MapPin size={11} /> {s.city}{s.zip ? `, ${s.zip}` : ""}</span>
                {s.grades ? <span><School size={11} /> {s.grades}</span> : null}
                {s.phone ? <span><Phone size={11} /> {s.phone}</span> : null}
                {s.email ? <span><Mail size={11} /> <a href={`mailto:${s.email}`}>{s.email}</a></span> : null}
              </div>
              {s.sponsor && s.sponsor !== s.name ? (
                <p className="school-modal-sponsor tiny muted">District: {s.sponsor}</p>
              ) : null}
            </div>
          ))}
        </div>

        <div className="school-modal-foot tiny muted">
          Source: Louisiana Department of Education · 2023–24 School Directory · Public source
        </div>
      </div>
    </div>
  );
}

function ParishDetailPanel({ parish, onClose }) {
  const census = useCensusProfile(parish?.id);
  const [showAllSchools, setShowAllSchools] = useState(false);

  if (!parish) {
    return (
      <aside className="parish-detail-panel parish-detail-panel--empty card">
        <p className="section-label">Detailed analysis</p>
        <p className="tiny muted">Select a parish on the map to view population, opportunity score, workforce demand, and institutions.</p>
      </aside>
    );
  }

  const realSchools = schoolDirectory[parish.id] || [];
  const educationGap = parish.hasMetrics ? Math.max(8, Math.round(100 - (parish.proficiencyRate || 40))) : null;
  const score = parish.hasMetrics ? parish.opportunityScore : null;
  const population = census?.population ?? null;
  const medianIncome = census?.medianHouseholdIncome ?? null;

  const needs = parish.hasMetrics
    ? [
        parish.recommendedIntervention,
        ...(parish.topWorkforceDemand || []).slice(0, 2).map((s) => `${s} workforce expansion`)
      ].filter(Boolean)
    : ["Connect LDOE enrollment and performance data", "Integrate workforce projections"];

  return (
    <>
      <aside className="parish-detail-panel card">
        <div className="parish-detail-head">
          <div>
            <p className="section-label">Detailed analysis</p>
            <h3>{parish.name.replace(" Parish", "")}</h3>
          </div>
          {onClose ? (
            <button type="button" className="parish-detail-close" onClick={onClose} aria-label="Close panel">
              ×
            </button>
          ) : null}
        </div>

        <div className="parish-detail-stats">
          <div className="parish-stat-tile">
            <Users size={16} aria-hidden />
            <span className="parish-stat-val">{population !== null ? population.toLocaleString() : "—"}</span>
            <span className="parish-stat-lbl">Population</span>
          </div>

          <div className={`parish-stat-tile${parish.hasMetrics ? ` parish-stat-tile--score${score >= 85 ? " urgent" : score >= 70 ? " high" : ""}` : " parish-stat-tile--muted"}`}>
            <TrendingUp size={16} aria-hidden />
            <span className="parish-stat-val">{parish.hasMetrics ? `${score}/100` : "—"}</span>
            <span className="parish-stat-lbl">Opportunity</span>
          </div>

          <div className="parish-stat-tile">
            <DollarSign size={16} aria-hidden />
            <span className="parish-stat-val">{medianIncome !== null ? `$${medianIncome.toLocaleString()}` : "—"}</span>
            <span className="parish-stat-lbl">Median income</span>
          </div>

          <div className={`parish-stat-tile${parish.hasMetrics ? " parish-stat-tile--warn" : " parish-stat-tile--muted"}`}>
            <BookOpen size={16} aria-hidden />
            <span className="parish-stat-val">{parish.hasMetrics ? `${educationGap}%` : "—"}</span>
            <span className="parish-stat-lbl">Education gap</span>
          </div>
        </div>

        {census ? (
          <p className="parish-census-attr tiny muted">
            Population and income from U.S. Census Bureau ACS 5-Year · 2023 <SourceBadge type="public" label="Public source" />
          </p>
        ) : null}

        {parish.hasMetrics ? (
          <>
            <div className="parish-detail-block">
              <p className="parish-detail-block-title">Specific needs</p>
              <ul className="parish-needs-list">
                {needs.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </div>

            <div className="parish-detail-block">
              <p className="parish-detail-block-title">Workforce demand</p>
              <div className="parish-tag-row">
                {(parish.topWorkforceDemand || []).map((s) => (
                  <span key={s} className="parish-tag parish-tag--teal">{s}</span>
                ))}
              </div>
            </div>

            <div className="parish-detail-block">
              <p className="parish-detail-block-title">Urgent programs</p>
              <div className="parish-tag-row">
                <span className="parish-tag parish-tag--red">Pathways</span>
                {(parish.topWorkforceDemand || []).slice(0, 2).map((s) => (
                  <span key={s} className="parish-tag parish-tag--red">{s}</span>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {/* Real school directory */}
        {realSchools.length > 0 ? (
          <div className="parish-detail-block">
            <p className="parish-detail-block-title">
              Institutions in parish
              <SourceBadge type="public" label="LDOE 2023–24" />
            </p>
            {realSchools.slice(0, 3).map((s, i) => (
              <article key={i} className="parish-school-card">
                <div>
                  <strong>{s.name}</strong>
                  <p className="tiny muted">{s.type} · {s.grades} · {s.city}</p>
                </div>
                <span className={`school-type-pill school-type-pill--${s.type === "Public" ? "public" : "nonpublic"}`}>
                  {s.type}
                </span>
              </article>
            ))}
            {realSchools.length > 3 ? (
              <button
                type="button"
                className="parish-see-all-schools"
                onClick={() => setShowAllSchools(true)}
              >
                <School size={13} />
                See all {realSchools.length} institutions
              </button>
            ) : null}
          </div>
        ) : null}

        {parish.hasMetrics ? (
          <Link to="/invest" className="btn btn-primary parish-allocate-btn">
            <DollarSign size={16} aria-hidden />
            Investment intake
          </Link>
        ) : (
          <p className="tiny muted parish-detail-pending">
            Opportunity scores pending. Detailed scoring will appear when LDOE and NCES feeds are connected.
          </p>
        )}
      </aside>

      {showAllSchools ? createPortal(
        <SchoolDirectoryModal
          parishName={parish.name}
          schools={realSchools}
          onClose={() => setShowAllSchools(false)}
        />,
        document.body
      ) : null}
    </>
  );
}

export default ParishDetailPanel;
