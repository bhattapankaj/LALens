import { motion } from "framer-motion";
import {
  GraduationCap,
  BriefcaseBusiness,
  Building2,
  MapPinned,
  Network,
  Database,
  Users,
  Route,
  ArrowRight,
  Sparkles,
  Target,
  Layers
} from "lucide-react";
import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { problemMiniCards, productNarrative } from "../data/realityAnchors";
import { SAMPLE_METRIC_COUNT, TOTAL_LA_PARISH_COUNT } from "../data/parishes";

const PROBLEMS = [
  {
    icon: Database,
    title: "Fragmented data",
    body: "Education and workforce data live across disconnected systems with no shared view.",
    accent: "purple"
  },
  {
    icon: Users,
    title: "Student need",
    body: "Outcomes and access gaps vary sharply by parish. Leaders need comparable signals.",
    accent: "orange"
  },
  {
    icon: BriefcaseBusiness,
    title: "Workforce alignment",
    body: "Pathways must map to local demand, not generic assumptions about opportunity.",
    accent: "teal"
  },
  {
    icon: Route,
    title: "Pathway access",
    body: "Equitable access to quality CTE and dual-enrollment programs remains uneven statewide.",
    accent: "green"
  },
  {
    icon: Target,
    title: "Decision bottlenecks",
    body: "Funders and operators lack a ranked brief that ties evidence to next actions.",
    accent: "amber"
  }
];

const AUDIENCES = [
  {
    icon: BriefcaseBusiness,
    title: "Funders",
    body: "Prioritize where capital can close the highest-need gaps with workforce payoff.",
    accent: "purple"
  },
  {
    icon: Building2,
    title: "School operators",
    body: "Identify expansion and partnership opportunities grounded in parish signals.",
    accent: "orange"
  },
  {
    icon: MapPinned,
    title: "Policymakers",
    body: "See regional opportunity gaps and intervention labels in one workflow.",
    accent: "teal"
  },
  {
    icon: Network,
    title: "Workforce partners",
    body: "Align pathways with Louisiana Workforce Commission demand categories.",
    accent: "green"
  },
  {
    icon: GraduationCap,
    title: "Communities",
    body: "Advocate for student pathways backed by transparent, source-labeled evidence.",
    accent: "amber"
  }
];

const WORKFLOW = [
  { step: "01", label: "Map the gaps", detail: "64 parishes, layered need and workforce signals" },
  { step: "02", label: "Score the opportunity", detail: "Transparent five-factor Opportunity Score" },
  { step: "03", label: "Deliver the brief", detail: "Ranked recommendation with risks and next steps" }
];

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
};

function Challenge() {
  return (
    <main className="challenge-page">
      <section className="challenge-hero">
        <motion.div className="challenge-hero-glow" aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
        <motion.div className="challenge-hero-inner" {...fadeUp}>
          <p className="challenge-kicker">Nexus DevDays · EdTech Challenge</p>
          <div className="challenge-hero-brand">
            <BrandLogo variant="hero" />
            <div>
              <h1>
                Louisiana needs a{" "}
                <span className="challenge-gradient">decision layer</span>
                {" "}for education investment.
              </h1>
            </div>
          </div>
          <p className="challenge-hero-lead">
            Student needs are shifting. Workforce demand is evolving. LALens unifies scattered public data into one
            workflow so leaders know where to invest, what to build, and why.
          </p>
          <div className="challenge-hero-actions">
            <Link to="/platform" className="btn btn-primary challenge-btn-primary">
              Explore the platform <ArrowRight size={16} aria-hidden />
            </Link>
            <Link to="/methodology" className="btn btn-secondary">
              See methodology
            </Link>
          </div>
        </motion.div>

        <motion.ul className="challenge-stat-strip" {...fadeUp} transition={{ delay: 0.08 }}>
          <li>
            <strong>{TOTAL_LA_PARISH_COUNT}</strong>
            <span>Parishes mapped</span>
          </li>
          <li>
            <strong>{SAMPLE_METRIC_COUNT}</strong>
            <span>Parishes scored</span>
          </li>
          <li>
            <strong>5</strong>
            <span>Score factors</span>
          </li>
          <li>
            <strong>1</strong>
            <span>Investment brief</span>
          </li>
        </motion.ul>
      </section>

      <div className="challenge-body container">
        <motion.section className="challenge-section" {...fadeUp}>
          <p className="challenge-kicker">The problem</p>
          <h2 className="challenge-section-title">{productNarrative.problemTitle}</h2>
          <p className="challenge-section-lead">{productNarrative.problemLead}</p>
          <ul className="challenge-problem-grid">
            {PROBLEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.li
                  key={item.title}
                  className={`challenge-card challenge-card--${item.accent}`}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <span className="challenge-card-icon" aria-hidden>
                    <Icon size={20} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </motion.li>
              );
            })}
          </ul>
        </motion.section>

        <motion.section className="challenge-narrative" {...fadeUp}>
          <div className="challenge-narrative-content">
            <span className="challenge-narrative-badge">
              <Sparkles size={14} aria-hidden />
              Winning narrative
            </span>
            <h2>{productNarrative.workflowTitle}</h2>
            <p>{productNarrative.workflowLead}</p>
            <p className="challenge-narrative-note">{productNarrative.prototypeNote}</p>
          </div>
          <ol className="challenge-workflow">
            {WORKFLOW.map((w, i) => (
              <motion.li
                key={w.step}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <span className="challenge-workflow-num">{w.step}</span>
                <div>
                  <strong>{w.label}</strong>
                  <span>{w.detail}</span>
                </div>
              </motion.li>
            ))}
          </ol>
        </motion.section>

        <motion.section className="challenge-section" {...fadeUp}>
          <p className="challenge-kicker">Mini insight</p>
          <h2 className="challenge-section-title">Three signals LALens connects</h2>
          <ul className="challenge-mini-grid">
            {problemMiniCards.map((c, i) => (
              <motion.li
                key={c.title}
                className="challenge-mini-card"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Layers size={18} aria-hidden />
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </motion.li>
            ))}
          </ul>
        </motion.section>

        <motion.section className="challenge-section" {...fadeUp}>
          <p className="challenge-kicker">Who it&apos;s for</p>
          <h2 className="challenge-section-title">Built for every stakeholder in the pathway</h2>
          <p className="challenge-section-lead">
            From philanthropy to parish operators, LALens gives each audience the same evidence-backed starting point.
          </p>
          <ul className="challenge-audience-grid">
            {AUDIENCES.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.li
                  key={a.title}
                  className={`challenge-audience-card challenge-audience-card--${a.accent}`}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -3 }}
                >
                  <span className="challenge-audience-icon" aria-hidden>
                    <Icon size={18} />
                  </span>
                  <h3>{a.title}</h3>
                  <p>{a.body}</p>
                </motion.li>
              );
            })}
          </ul>
        </motion.section>

        <motion.section className="challenge-cta" {...fadeUp}>
          <div className="challenge-cta-inner">
            <h2>Ready to explore the decision preview?</h2>
            <p>Walk the map, read a parish brief, and ask the grounded assistant in one session.</p>
            <div className="challenge-cta-actions">
              <Link to="/platform" className="btn btn-primary challenge-btn-primary">
                Open platform <ArrowRight size={16} aria-hidden />
              </Link>
              <Link to="/invest" className="btn btn-secondary">
                Investment intake
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

export default Challenge;
