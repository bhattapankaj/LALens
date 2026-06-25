import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import BrandLogo from "./BrandLogo";

const STAGES = [
  { label: "Loading parish opportunity scores", detail: "64 parishes · prototype model estimates" },
  { label: "Cross-referencing workforce gap signals", detail: "Healthcare, trades, and STEM demand" },
  { label: "Evaluating pathway fit by focus area", detail: "CTE, literacy, and student-need overlays" },
  { label: "Ranking schools for your investment profile", detail: "Role, budget band, and focus weighting" }
];

const SCAN_TICKS = [
  "Madison Parish · opportunity score 87",
  "St. Landry Parish · workforce gap elevated",
  "Tensas Parish · literacy need signal",
  "East Carroll · pathway access gap",
  "Caddo Parish · feasibility check",
  "Sample schools · need index ranked"
];

function IntakeMatchLoader({ onComplete }) {
  const [activeStage, setActiveStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [scanIdx, setScanIdx] = useState(0);

  useEffect(() => {
    const scanTimer = window.setInterval(() => {
      setScanIdx((i) => (i + 1) % SCAN_TICKS.length);
    }, 520);
    return () => window.clearInterval(scanTimer);
  }, []);

  useEffect(() => {
    const stageDelays = [900, 850, 900, 950];
    const progressTargets = [28, 52, 76, 100];
    let cancelled = false;
    const timers = [];

    const runStage = (index) => {
      if (cancelled || index >= STAGES.length) return;
      setActiveStage(index);
      const start = index === 0 ? 0 : progressTargets[index - 1];
      const end = progressTargets[index];
      const duration = stageDelays[index];
      const startTime = performance.now();

      const tick = (now) => {
        if (cancelled) return;
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - (1 - t) ** 2;
        setProgress(start + (end - start) * eased);
        if (t < 1) {
          requestAnimationFrame(tick);
        } else if (index < STAGES.length - 1) {
          timers.push(window.setTimeout(() => runStage(index + 1), 120));
        } else {
          timers.push(window.setTimeout(() => onComplete?.(), 400));
        }
      };
      requestAnimationFrame(tick);
    };

    timers.push(window.setTimeout(() => runStage(0), 200));

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [onComplete]);

  return (
    <div className="intake-loader" role="status" aria-live="polite" aria-busy="true">
      <div className="intake-loader-ring-wrap">
        <svg className="intake-loader-ring" viewBox="0 0 120 120" aria-hidden>
          <defs>
            <linearGradient id="intake-loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="55%" stopColor="#db4fb7" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          <circle className="intake-loader-ring-bg" cx="60" cy="60" r="52" />
          <circle
            className="intake-loader-ring-fill"
            cx="60"
            cy="60"
            r="52"
            style={{ strokeDashoffset: 327 - (327 * progress) / 100 }}
          />
        </svg>
        <span className="intake-loader-ring-logo">
          <BrandLogo variant="feature" alt="" />
        </span>
        <span className="intake-loader-pct">{Math.round(progress)}%</span>
      </div>

      <h2 className="intake-loader-title">Finding your investment matches</h2>
      <p className="intake-loader-sub">Running LALens parish and school alignment model…</p>

      <div className="intake-loader-bar-wrap">
        <motion.div className="intake-loader-bar" style={{ width: `${progress}%` }} />
      </div>

      <p className="intake-loader-scan">
        <Loader2 size={14} className="intake-loader-scan-icon spin" aria-hidden />
        <AnimatePresence mode="wait">
          <motion.span
            key={scanIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {SCAN_TICKS[scanIdx]}
          </motion.span>
        </AnimatePresence>
      </p>

      <ol className="intake-loader-stages">
        {STAGES.map((stage, i) => {
          const done = i < activeStage;
          const active = i === activeStage;
          return (
            <motion.li
              key={stage.label}
              className={`intake-loader-stage${done ? " done" : ""}${active ? " active" : ""}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <span className="intake-loader-stage-icon" aria-hidden>
                {done ? <Check size={14} /> : active ? <Loader2 size={14} className="spin" /> : <span className="intake-loader-stage-dot" />}
              </span>
              <span>
                <strong>{stage.label}</strong>
                <span className="intake-loader-stage-detail">{stage.detail}</span>
              </span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

export default IntakeMatchLoader;
