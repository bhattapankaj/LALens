import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  GraduationCap,
  Briefcase,
  Heart,
  BookOpen,
  DollarSign,
  FlaskConical,
  Users,
  Check,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Landmark,
  School,
  Wrench,
  HeartPulse,
  HandHelping,
  HelpCircle
} from "lucide-react";
import {
  INTAKE_ROLES,
  INTAKE_BUDGETS,
  INTAKE_FOCUS,
  rankInvestmentMatches,
  generateInvestmentBrief
} from "../utils/investmentMatching";
import IntakeMatchLoader from "../components/IntakeMatchLoader";
import IntakeChoiceGrid from "../components/IntakeChoiceGrid";
import InvestmentBrief from "../components/InvestmentBrief";

const ROLE_ICONS = {
  briefcase: Briefcase,
  heart: Heart,
  book: BookOpen,
  landmark: Landmark,
  school: School,
  "circle-help": HelpCircle
};
const FOCUS_ICONS = {
  book: BookOpen,
  flask: FlaskConical,
  wrench: Wrench,
  "heart-pulse": HeartPulse,
  users: Users,
  "hand-helping": HandHelping
};

const STEPS = ["Your role", "Budget", "Focus area"];

function IntakeStepper({ step }) {
  const displayStep = step >= 4 ? 4 : step;
  return (
    <ol className="intake-stepper" aria-label="Progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = displayStep > n;
        const active = displayStep === n && step < 4;
        return (
          <li key={label} className={`intake-step${done ? " done" : ""}${active ? " active" : ""}`}>
            <span className="intake-step-dot">{done ? <Check size={14} /> : n}</span>
            <span className="intake-step-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Transform AI response → InvestmentBrief shape, enriching a static base brief */
function enrichBriefWithAI(baseBrief, aiData, budgetLabel) {
  if (!aiData?.brief?.topMatches?.length) return baseBrief;
  const ai = aiData.brief;
  const top = ai.topMatches[0];

  // Build a topMatch from the AI's top pick
  const topMatch = {
    ...baseBrief.topMatch,
    name: top.schoolName || baseBrief.topMatch.name,
    parishName: top.parishName || baseBrief.topMatch.parishName,
    parishId: top.parishId || baseBrief.topMatch.parishId,
    type: top.grades || top.type || baseBrief.topMatch.type,
    investmentRange: budgetLabel,
    needSignal: top.estimatedImpact || baseBrief.topMatch.needSignal,
    programs: top.suggestedUse ? [top.suggestedUse] : baseBrief.topMatch.programs,
    enrollment: null
  };

  // Build whyReasons from AI content
  const whyReasons = [
    top.whyMatch,
    ai.whyThisFocus,
    ...(baseBrief.whyReasons || []).slice(2)
  ].filter(Boolean).slice(0, 4);

  // Build allMatches from remaining AI picks + original
  const aiMatches = (ai.topMatches || []).map((s, i) => ({
    id: `ai-${i}`,
    name: s.schoolName,
    parishName: s.parishName,
    parishId: s.parishId,
    type: s.grades || s.type,
    matchScore: Math.max(65, 92 - i * 7),
    opportunityScore: null,
    investmentRange: budgetLabel,
    needSignal: s.estimatedImpact || "",
    programs: s.suggestedUse ? [s.suggestedUse] : []
  }));

  return {
    ...baseBrief,
    topMatch,
    whyReasons,
    risks: ai.keyRisks?.length ? ai.keyRisks : baseBrief.risks,
    nextSteps: ai.nextSteps?.length ? ai.nextSteps : baseBrief.nextSteps,
    allMatches: aiMatches.length > 1 ? aiMatches : baseBrief.allMatches
  };
}

function InvestmentIntake() {
  const [step, setStep]       = useState(1);
  const [role, setRole]       = useState("");
  const [budget, setBudget]   = useState("");
  const [focus, setFocus]     = useState("");
  const [brief, setBrief]     = useState(null);

  // Holds the in-flight AI promise so loader can await it
  const aiFetchRef = useRef(null);

  const profile = useMemo(() => ({ role, budget, focus }), [role, budget, focus]);

  const roleItems = useMemo(
    () => INTAKE_ROLES.map((r) => {
      const Icon = ROLE_ICONS[r.icon] || Briefcase;
      return { id: r.id, title: r.title, desc: r.desc, icon: <Icon size={22} aria-hidden /> };
    }), []
  );
  const budgetItems = useMemo(
    () => INTAKE_BUDGETS.map((b) => ({
      id: b.id,
      title: b.title,
      desc: b.desc,
      icon: <DollarSign size={22} aria-hidden />
    })), []
  );
  const focusItems = useMemo(
    () => INTAKE_FOCUS.map((f) => {
      const Icon = FOCUS_ICONS[f.icon] || BookOpen;
      return { id: f.id, title: f.title, desc: f.desc, icon: <Icon size={22} aria-hidden /> };
    }), []
  );

  const canContinue = (step === 1 && role) || (step === 2 && budget) || (step === 3 && focus);

  const goNext = () => {
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      // Step 3 → 4: kick off static matching + AI fetch simultaneously
      const matches = rankInvestmentMatches({ role, budget, focus });
      const staticBrief = generateInvestmentBrief({ role, budget, focus }, matches);
      const budgetLabel = INTAKE_BUDGETS.find((b) => b.id === budget)?.title || budget;

      // Fire AI request immediately — loader will wait for it
      const base = import.meta.env.VITE_API_URL || "";
      const aiPromise = fetch(`${base}/api/investment-brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, budget, focus })
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      aiFetchRef.current = aiPromise;

      // Store static brief immediately as fallback
      setBrief(staticBrief);
      setStep(4);

      // When AI resolves, enrich
      aiPromise.then((aiData) => {
        if (aiData?.ok) {
          setBrief((prev) => enrichBriefWithAI(prev, aiData, budgetLabel));
        }
      });
    }
  };

  const goBack = () => {
    if (step === 5) setStep(3);
    else if (step > 1 && step !== 4) setStep((s) => s - 1);
  };

  const handleMatchingComplete = useCallback(() => setStep(5), []);
  const handleRecordInterest   = useCallback(() => setStep(6), []);

  const header = (
    <header className="intake-header">
      <GraduationCap size={20} aria-hidden />
      <span>K-12 Investment Intake</span>
    </header>
  );

  // ── Step 6: confirmation ────────────────────────────────────────────────────
  if (step === 6) {
    return (
      <main className="intake-page">
        {header}
        <motion.div
          className="intake-card intake-card--center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="intake-success-icon" aria-hidden>
            <Check size={36} strokeWidth={2.5} />
          </span>
          <h1>Interest recorded</h1>
          <p className="intake-lead">
            This is a decision preview. In a production deployment, your profile would route to district or operator partners for follow-up.
          </p>
          <div className="intake-status-card">
            <h2>Your investment brief summary</h2>
            <p className="tiny muted">Demo workflow. Not a live funding commitment.</p>
            <div className="intake-status-grid">
              <div className="intake-status-tile pending">
                <strong>3</strong>
                <span>Matched</span>
              </div>
              <div className="intake-status-tile">
                <strong>0</strong>
                <span>In discussion</span>
              </div>
              <div className="intake-status-tile">
                <strong>0</strong>
                <span>Funded</span>
              </div>
            </div>
          </div>
          <div className="intake-actions">
            <Link to="/platform" className="btn btn-secondary">Explore parishes</Link>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(5)}>Back to brief</button>
          </div>
        </motion.div>
      </main>
    );
  }

  // ── Step 4: loading animation ───────────────────────────────────────────────
  if (step === 4) {
    return (
      <main className="intake-page">
        {header}
        <div className="intake-card intake-card--loader">
          <IntakeStepper step={step} />
          <IntakeMatchLoader onComplete={handleMatchingComplete} />
        </div>
      </main>
    );
  }

  // ── Step 5: Investment Brief ────────────────────────────────────────────────
  if (step === 5) {
    return (
      <main className="intake-page brief-page">
        {header}
        <InvestmentBrief
          brief={brief}
          onRecordInterest={handleRecordInterest}
          onBack={() => setStep(3)}
        />
      </main>
    );
  }

  // ── Steps 1–3: intake form ──────────────────────────────────────────────────
  return (
    <main className="intake-page">
      {header}

      <motion.div className="intake-card intake-card--form">
        <IntakeStepper step={step} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="intake-step-content"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && (
              <>
                <h1>
                  Match your investment to{" "}
                  <span className="intake-gradient-text">Louisiana K-12</span> need
                </h1>
                <p className="intake-lead">
                  Tell us who you are and what you want to support. LALens ranks real Louisiana schools using parish opportunity signals and the LDOE 2023–24 school directory.
                </p>
                <p className="intake-field-label">I am a…</p>
                <IntakeChoiceGrid items={roleItems} value={role} onChange={setRole} columns={3} />
              </>
            )}

            {step === 2 && (
              <>
                <h1>
                  What is your <span className="intake-gradient-text">investment range</span>?
                </h1>
                <p className="intake-lead">
                  We match you to schools and programs appropriate for your exact budget — from a $1K classroom grant to a $2M+ district partnership.
                </p>
                <p className="intake-field-label">Annual giving range</p>
                <IntakeChoiceGrid items={budgetItems} value={budget} onChange={setBudget} columns={3} />
              </>
            )}

            {step === 3 && (
              <>
                <h1>
                  What <span className="intake-gradient-text">focus area</span> matters most?
                </h1>
                <p className="intake-lead">
                  Choose the education lever you want to align with workforce and student-need signals.
                </p>
                <p className="intake-field-label">K-12 focus</p>
                <IntakeChoiceGrid items={focusItems} value={focus} onChange={setFocus} columns={3} />
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="intake-nav">
          {step > 1 ? (
            <button type="button" className="btn btn-secondary intake-btn-back" onClick={goBack}>
              <ArrowLeft size={16} aria-hidden /> Back
            </button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <button type="button" className="btn intake-btn-gradient" disabled={!canContinue} onClick={goNext}>
              Continue <ArrowRight size={16} aria-hidden />
            </button>
          ) : (
            <button type="button" className="btn intake-btn-gradient" disabled={!canContinue} onClick={goNext}>
              Find matches <ArrowRight size={16} aria-hidden />
            </button>
          )}
        </div>

        <p className="intake-footnote">
          <ShieldCheck size={14} aria-hidden />
          Matches use the LDOE 2023–24 School Directory (1,659 institutions) and prototype opportunity scores. Not an official state allocation tool.
        </p>
      </motion.div>
    </main>
  );
}

export default InvestmentIntake;
