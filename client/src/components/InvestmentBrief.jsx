import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Download,
  BookmarkCheck,
  BookmarkX,
  TrendingUp,
  AlertTriangle,
  Users,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Mail,
  Check,
  ExternalLink,
  ShieldCheck,
  Landmark,
  Send,
  Database,
  Loader2,
  CloudUpload,
  Cloud,
  School
} from "lucide-react";
import SourceBadge from "./SourceBadge";
import AuthButton from "./AuthButton";
import SavedBriefsPanel from "./SavedBriefsPanel";
import { buildBriefText } from "../utils/investmentMatching";
import { isFirebaseConfigured } from "../firebase";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";
import { saveInvestmentBrief } from "../services/briefService";

const LS_KEY = "lalens_investment_brief";

// ── Small helpers ────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 96 }) {
  const pct = Math.max(0, Math.min(100, score));
  const r = (size / 2) * 0.78;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 88 ? "#7c3aed" : pct >= 72 ? "#db4fb7" : "#f97316";

  return (
    <div className="brief-score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(124,58,237,0.1)" strokeWidth={size * 0.09}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={size * 0.09}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="brief-score-ring-val">
        {score}
        <span className="brief-score-ring-denom">/100</span>
      </span>
    </div>
  );
}

function EvidenceCell({ item }) {
  const typeClass = item.type === "model" ? "model" : item.type === "public" ? "public" : "pending";
  return (
    <div className={`brief-evidence-cell brief-evidence-cell--${typeClass}`}>
      <span className="brief-evidence-val">{item.value}</span>
      <span className="brief-evidence-label">{item.label}</span>
      <span className="brief-evidence-sub">{item.sub}</span>
    </div>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      className="brief-toast"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
    >
      <Check size={14} aria-hidden /> {message}
    </motion.div>
  );
}

// ── Saved-brief mini-card ────────────────────────────────────────────────────

function SavedBriefCard({ saved, onLoad, onClear }) {
  const ts = saved?.savedAt
    ? new Date(saved.savedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";
  return (
    <motion.section
      className="card brief-saved-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="brief-saved-head">
        <BookmarkCheck size={15} aria-hidden />
        <div>
          <p className="brief-saved-title">Saved brief in this browser</p>
          {ts ? <p className="brief-saved-ts tiny muted">Saved {ts}</p> : null}
        </div>
      </div>
      <div className="brief-saved-actions">
        <button type="button" className="btn btn-secondary brief-saved-btn" onClick={onLoad}>
          Load saved brief
        </button>
        <button type="button" className="brief-saved-clear" onClick={onClear} aria-label="Clear saved brief">
          <BookmarkX size={14} aria-hidden /> Clear
        </button>
      </div>
    </motion.section>
  );
}

// ── Inline Navigator card ────────────────────────────────────────────────────

function NavigatorAskCard({ brief }) {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [open, setOpen] = useState(false);

  const ask = useCallback(async () => {
    if (loading || answer) { setOpen((o) => !o); return; }
    setLoading(true);
    const message = `Explain why ${brief.topMatch.name} in ${brief.topMatch.parishName} Parish is recommended for a ${brief.profile.role} focused on ${brief.profile.focus} with a budget of ${brief.profile.budget}.`;
    try {
      const base = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, selectedParishId: brief.topMatch.parishId, history: [] })
      });
      const data = res.ok ? await res.json() : {};
      setAnswer(data.answer || "Explanation not available. See evidence signals above.");
    } catch {
      setAnswer("Explanation not available at this time. See evidence signals above.");
    } finally {
      setLoading(false);
      setOpen(true);
    }
  }, [brief, loading, answer]);

  return (
    <section className="card brief-ask-card" aria-label="Navigator assistant">
      <div className="brief-ask-head">
        <Database size={15} className="brief-ask-icon" aria-hidden />
        <div>
          <p className="brief-ask-title">Ask Navigator</p>
          <p className="brief-ask-sub tiny muted">AI insight engine · model estimates only</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary brief-ask-btn"
          onClick={ask}
          disabled={loading}
          aria-expanded={open}
        >
          {loading ? (
            <><Loader2 size={14} className="spin" aria-hidden /> Thinking…</>
          ) : answer ? (
            <>{open ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />} {open ? "Hide" : "Show"} explanation</>
          ) : (
            <><Send size={14} aria-hidden /> Explain this match</>
          )}
        </button>
      </div>
      <p className="brief-ask-question">
        "Explain why this match is recommended."
      </p>
      <AnimatePresence>
        {open && answer ? (
          <motion.div
            className="brief-ask-answer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28 }}
          >
            <p className="brief-ask-answer-text">{answer}</p>
            <span className="brief-ask-answer-badge">
              <SourceBadge type="model" label="Prototype model estimate" />
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

// ── Top-3 mini cards ─────────────────────────────────────────────────────────

function MatchMiniCard({ match, rank }) {
  return (
    <motion.div
      className="card brief-mini-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.07 }}
    >
      <div className="brief-mini-rank">{rank}</div>
      <div className="brief-mini-body">
        <p className="brief-mini-name">{match.name}</p>
        <p className="tiny muted">{match.parishName} Parish · {match.type}</p>
        <p className="brief-mini-reason tiny">{match.needSignal}</p>
        <div className="brief-mini-row">
          <span className="brief-mini-score">{match.matchScore}/100</span>
          <span className="brief-mini-range tiny muted">{match.investmentRange}</span>
          <SourceBadge type="demo" label="Demo estimate" />
        </div>
      </div>
      <Link
        to={`/platform?parish=${match.parishId}`}
        className="brief-mini-map-btn"
        aria-label={`View ${match.parishName} on map`}
      >
        <ExternalLink size={13} aria-hidden /> Map
      </Link>
    </motion.div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

function InvestmentBrief({ brief, onRecordInterest, onBack }) {
  const [toast, setToast]             = useState(null);
  const [email, setEmail]             = useState("");
  const [savedBrief, setSavedBrief]   = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  // Cloud save state
  const [cloudSaving, setCloudSaving]   = useState(false);
  const [cloudSavedAt, setCloudSavedAt] = useState(null);
  const [cloudRefresh, setCloudRefresh] = useState(0);
  const topRef = useRef(null);

  const { currentUser } = useFirebaseAuth();

  // Load any existing saved brief on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setSavedBrief(JSON.parse(raw));
    } catch {}
  }, []);

  const showToast = useCallback((msg) => setToast(msg), []);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildBriefText(brief, email));
      showToast("Brief copied to clipboard.");
    } catch {
      showToast("Could not access clipboard. Try a modern browser.");
    }
  }, [brief, email, showToast]);

  // Download as .txt
  const handleDownload = useCallback(() => {
    const text = buildBriefText(brief, email);
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "LALens_Investment_Brief.txt";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Brief downloaded.");
  }, [brief, email, showToast]);

  // Save to localStorage
  const handleSave = useCallback(() => {
    try {
      const payload = { ...brief, email, savedAt: new Date().toISOString() };
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
      setSavedBrief(payload);
      showToast("Brief saved in this browser.");
    } catch {
      showToast("Could not save to browser storage.");
    }
  }, [brief, email, showToast]);

  const handleLoadSaved = useCallback(() => {
    if (savedBrief) topRef.current?.scrollIntoView({ behavior: "smooth" });
    showToast("Showing saved brief.");
  }, [savedBrief, showToast]);

  const handleClearSaved = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setSavedBrief(null);
    showToast("Saved brief cleared.");
  }, [showToast]);

  const handleCloudSave = useCallback(async () => {
    if (!currentUser || cloudSaving) return;
    setCloudSaving(true);
    try {
      const briefText = buildBriefText(brief, email);
      await saveInvestmentBrief(currentUser, brief, briefText);
      setCloudSavedAt(new Date().toISOString());
      setCloudRefresh((n) => n + 1);
      showToast("Brief saved to your LALens account.");
    } catch (err) {
      showToast(err?.message?.includes("configured") ? err.message : "Cloud save failed. Please try again.");
    } finally {
      setCloudSaving(false);
    }
  }, [currentUser, cloudSaving, brief, email, showToast]);

  const handleRecordInterest = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    onRecordInterest?.();
  }, [submitting, onRecordInterest]);

  if (!brief) return null;

  const { profile, topMatch: m, whyReasons, evidenceSignals, risks, partners, nextSteps, allMatches } = brief;
  const top3 = allMatches.slice(1, 4);

  return (
    <div className="brief-root" ref={topRef}>
      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      <div className="brief-toast-anchor" aria-live="polite">
        <AnimatePresence>
          {toast ? <Toast key={toast} message={toast} onDone={() => setToast(null)} /> : null}
        </AnimatePresence>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <motion.section
        className="card brief-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="brief-hero-head">
          <div>
            <p className="app-page-kicker">Investment brief</p>
            <h1 className="brief-hero-title">Your investment brief</h1>
            <p className="brief-hero-sub">
              Generated from your role, budget, focus area, and the current LALens sample model.
            </p>
          </div>
          <div className="brief-hero-actions">
            <button type="button" className="btn btn-secondary brief-action-btn" onClick={handleCopy} title="Copy brief">
              <Copy size={15} aria-hidden /> Copy brief
            </button>
            <button type="button" className="btn btn-secondary brief-action-btn" onClick={handleDownload} title="Download brief">
              <Download size={15} aria-hidden /> Download
            </button>
            <button type="button" className="btn brief-action-btn brief-action-btn--save" onClick={handleSave} title="Save brief">
              <BookmarkCheck size={15} aria-hidden /> Save
            </button>
          </div>
        </div>

        <div className="brief-profile-chips">
          <span className="brief-profile-chip brief-profile-chip--role">
            <Users size={12} aria-hidden /> {profile.role}
          </span>
          <span className="brief-profile-chip brief-profile-chip--budget">
            {profile.budget}
          </span>
          <span className="brief-profile-chip brief-profile-chip--focus">
            {profile.focus}
          </span>
        </div>
      </motion.section>

      {/* ── Top match ─────────────────────────────────────────────────────── */}
      <motion.section
        className="card brief-top-match"
        aria-label="Top recommended match"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
      >
        <div className="brief-top-match-inner">
          <div className="brief-top-match-score">
            <p className="brief-top-match-score-label app-page-kicker">Match score</p>
            <ScoreRing score={m.matchScore} size={100} />
            <div className="brief-top-match-badges">
              <SourceBadge type="model" label="Prototype model estimate" />
              <SourceBadge type="demo"  label="Demo estimate" />
            </div>
          </div>

          <div className="brief-top-match-detail">
            <p className="app-page-kicker">Top recommendation</p>
            <h2 className="brief-top-match-name">{m.name}</h2>
            <p className="brief-top-match-parish tiny muted">
              {m.parishName} Parish · {m.type}
              {m.enrollment ? ` · ${m.enrollment.toLocaleString()} students` : ""}
            </p>

            <dl className="brief-top-match-facts">
              {m.opportunityScore !== null ? (
                <>
                  <dt>Opportunity score</dt>
                  <dd>
                    <TrendingUp size={13} aria-hidden />
                    {m.opportunityScore}/100
                    <SourceBadge type="model" label="Prototype model estimate" />
                  </dd>
                </>
              ) : null}
              <dt>Recommended intervention</dt>
              <dd>{m.recommendedIntervention || m.programs?.join(", ")}</dd>
              <dt>Estimated investment range</dt>
              <dd>
                {m.investmentRange}
                <SourceBadge type="demo" label="Demo estimate" />
              </dd>
              <dt>Need signal</dt>
              <dd>{m.needSignal}</dd>
            </dl>

            {m.programs?.length > 0 ? (
              <div className="brief-program-tags">
                {m.programs.map((p) => (
                  <span key={p} className="brief-program-tag">{p}</span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Why this match */}
        <div className="brief-why-block">
          <p className="brief-why-title">Why this match</p>
          <ol className="brief-why-list">
            {whyReasons.map((r, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                {r}
              </motion.li>
            ))}
          </ol>
        </div>

        {/* Evidence signals */}
        <div className="brief-evidence-block">
          <p className="brief-evidence-title">Evidence signals</p>
          <div className="brief-evidence-grid">
            <EvidenceCell item={evidenceSignals.studentNeed} />
            <EvidenceCell item={evidenceSignals.workforceGap} />
            <EvidenceCell item={evidenceSignals.pathwayAccess} />
            <EvidenceCell item={evidenceSignals.feasibility} />
          </div>
        </div>

        {/* Risks + Partners (two-column) */}
        <div className="brief-risk-partner-row">
          <div className="brief-risks-block">
            <p className="brief-section-mini-title">
              <AlertTriangle size={13} aria-hidden /> Risks to validate
            </p>
            <ul className="brief-risks-list">
              {risks.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
          <div className="brief-partners-block">
            <p className="brief-section-mini-title">
              <Landmark size={13} aria-hidden /> Suggested partners
            </p>
            <ul className="brief-partners-list">
              {partners.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        </div>

        {/* Real LDOE schools in matched parish */}
        {brief.parishSchools && brief.parishSchools.length > 0 ? (
          <div className="brief-parish-schools">
            <p className="brief-section-mini-title">
              <School size={13} aria-hidden /> LDOE 2023–24 institutions in {m.parishName}
              <span className="brief-school-count">{brief.parishSchoolCount} total</span>
            </p>
            <div className="brief-school-chips">
              {brief.parishSchools.map((s, i) => (
                <div key={i} className="brief-school-chip">
                  <span className="brief-school-chip-name">{s.name}</span>
                  <span className="brief-school-chip-meta">{s.grades || s.type} · {s.city}</span>
                </div>
              ))}
            </div>
            <p className="tiny muted" style={{ marginTop: "0.4rem" }}>
              Source: Louisiana Department of Education · 2023–24 School Directory · <span style={{color:"#14b8a6"}}>Public source</span>
            </p>
          </div>
        ) : null}

        {/* Next steps */}
        <div className="brief-next-steps-block">
          <p className="brief-section-mini-title">Next steps</p>
          <ol className="brief-next-steps-list">
            {nextSteps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>

        {/* Link to map */}
        <div className="brief-top-match-map-row">
          <Link
            to={`/platform?parish=${m.parishId}`}
            className="btn btn-secondary brief-map-link"
          >
            <ExternalLink size={14} aria-hidden /> View {m.parishName} on map
          </Link>
        </div>
      </motion.section>

      {/* ── Top 3 match cards ─────────────────────────────────────────────── */}
      {top3.length > 0 ? (
        <section className="brief-top3-section" aria-label="Other top matches">
          <p className="app-page-kicker">Other top matches</p>
          <h2 className="brief-top3-title">Next best opportunities</h2>
          <div className="brief-top3-grid">
            {top3.map((match, i) => (
              <MatchMiniCard key={match.id} match={match} rank={i + 2} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Navigator ask ─────────────────────────────────────────────────── */}
      <NavigatorAskCard brief={brief} />

      {/* ── Cloud save ────────────────────────────────────────────────────── */}
      <motion.section
        className="card brief-cloud-card"
        aria-label="Save your brief"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.38 }}
      >
        <div className="brief-cloud-header">
          <Cloud size={15} className="brief-cloud-icon" aria-hidden />
          <p className="brief-cloud-title">Save your brief</p>
          {isFirebaseConfigured ? (
            <AuthButton className="brief-cloud-auth-btn" />
          ) : (
            <span className="brief-cloud-unconfigured tiny muted">
              Cloud save not configured in this environment.
            </span>
          )}
        </div>

        {isFirebaseConfigured && (
          <>
            {currentUser ? (
              <div className="brief-cloud-signed-in">
                <div className="brief-cloud-actions">
                  <button
                    type="button"
                    className={`btn brief-cloud-save-btn${cloudSaving ? " is-loading" : ""}`}
                    onClick={handleCloudSave}
                    disabled={cloudSaving}
                  >
                    {cloudSaving ? (
                      <><Loader2 size={14} className="spin" aria-hidden /> Saving…</>
                    ) : (
                      <><CloudUpload size={14} aria-hidden /> Save to cloud</>
                    )}
                  </button>
                  {cloudSavedAt ? (
                    <span className="brief-cloud-saved-ts tiny muted">
                      <Check size={12} aria-hidden />
                      Saved {new Date(cloudSavedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  ) : null}
                </div>

                <div className="brief-cloud-briefs-wrap">
                  <p className="brief-cloud-briefs-label tiny muted">Your saved briefs</p>
                  <SavedBriefsPanel
                    user={currentUser}
                    refreshTrigger={cloudRefresh}
                    onLoad={() => topRef.current?.scrollIntoView({ behavior: "smooth" })}
                  />
                </div>
              </div>
            ) : (
              <p className="brief-cloud-upsell tiny muted">
                Sign in to save this brief to your account, or use local save / download below.
              </p>
            )}
          </>
        )}

        <p className="brief-cloud-honesty tiny muted">
          Saved briefs are prototype decision-support outputs. They combine public-source references with model estimates and should be verified before real funding decisions.
        </p>
      </motion.section>

      {/* ── Local saved brief ─────────────────────────────────────────────── */}
      {savedBrief ? (
        <SavedBriefCard saved={savedBrief} onLoad={handleLoadSaved} onClear={handleClearSaved} />
      ) : null}

      {/* ── Email field ───────────────────────────────────────────────────── */}
      <motion.section
        className="card brief-email-card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="brief-email-head">
          <Mail size={15} aria-hidden />
          <p className="brief-email-title">Want to follow up?</p>
        </div>
        <p className="brief-email-desc tiny muted">
          Enter an email to attach to this brief. Saved locally only — prototype only, no email is sent in this demo.
        </p>
        <div className="brief-email-row">
          <label htmlFor="brief-email-input" className="sr-only">Email address</label>
          <input
            id="brief-email-input"
            type="email"
            className="brief-email-input"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {email ? (
            <button type="button" className="btn btn-secondary brief-email-save-btn" onClick={handleSave}>
              <BookmarkCheck size={14} aria-hidden /> Save with email
            </button>
          ) : null}
        </div>
        <p className="brief-email-note tiny muted">
          Prototype only. No email is sent in this demo.
        </p>
      </motion.section>

      {/* ── Demo disclaimer ───────────────────────────────────────────────── */}
      <div className="brief-disclaimer">
        <ShieldCheck size={14} aria-hidden />
        <p>{brief.disclaimer}</p>
      </div>

      {/* ── Production roadmap ────────────────────────────────────────────── */}
      <motion.section
        className="card brief-roadmap-card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
      >
        <p className="app-page-kicker">Production roadmap</p>
        <h2 className="brief-roadmap-title">What a full version would add</h2>
        <p className="brief-roadmap-lead">
          In a full version, LALens would add secure accounts so funders and operators can save briefs, compare parishes, collaborate with partners, and track follow-up actions over time.
        </p>
        <ul className="brief-roadmap-list">
          <li>
            {isFirebaseConfigured
              ? "Google sign-in via Firebase — active in this demo"
              : "Secure authentication — Firebase (configured separately)"
            }
          </li>
          <li>
            {isFirebaseConfigured
              ? "Cloud brief storage via Firestore — active for signed-in users"
              : "Persistent brief storage — Firestore or Postgres database"
            }
          </li>
          <li>Role-based saved workspaces for funders, operators, and agencies</li>
          <li>Official LDOE, NCES, BLS, and Louisiana Workforce Commission data integration</li>
          <li>Parish comparison and portfolio tracking across investments</li>
        </ul>
      </motion.section>

      {/* ── Submit row ────────────────────────────────────────────────────── */}
      <div className="brief-submit-row">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Refine profile
        </button>
        <button
          type="button"
          className={`btn brief-submit-btn${submitting ? " is-loading" : ""}`}
          onClick={handleRecordInterest}
          disabled={submitting}
        >
          {submitting ? (
            <><Loader2 size={16} className="spin" aria-hidden /> Recording…</>
          ) : (
            <>Record interest <ArrowRight size={16} aria-hidden /></>
          )}
        </button>
      </div>
    </div>
  );
}

export default InvestmentBrief;
