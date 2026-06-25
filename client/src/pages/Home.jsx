import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChartColumn, Map } from "lucide-react";
import { parishes, SAMPLE_METRIC_COUNT } from "../data/parishes";
import BrandLogo from "../components/BrandLogo";
import HomeNavbar from "../components/HomeNavbar";
import HomeFooter from "../components/HomeFooter";
import HomeStepper from "../components/HomeStepper";
import HomeHeroMap from "../components/HomeHeroMap";
import HomePlanningCard from "../components/HomePlanningCard";
import HomeMetricCard from "../components/HomeMetricCard";
import HomeStepCards from "../components/HomeStepCards";
import PlatformAnalytics from "../components/PlatformAnalytics";
import RealityNote from "../components/RealityNote";
import { problemMiniCards, productNarrative } from "../data/realityAnchors";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-48px" },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
};

function Home() {
  useEffect(() => {
    document.body.classList.add("home-page");
    return () => document.body.classList.remove("home-page");
  }, []);

  const homeStats = useMemo(() => {
    const mapped = parishes.length;
    const sampleMetrics = parishes.filter((p) => p.hasMetrics).length;
    return { mapped, sampleMetrics };
  }, []);

  return (
    <div className="home-layout">
      <HomeNavbar />

      <main className="home-main">
        <section className="home-hero">
          <motion.p
            className="home-hero-kicker"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Nexus DevDays · EdTech Challenge
          </motion.p>

          <motion.h1
            className="home-hero-headline"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <span className="home-hero-line">Find gaps. Build better</span>
            <span className="home-hero-line">
              <span className="home-gradient-opportunity">pathways.</span>
            </span>
          </motion.h1>

          <motion.p
            className="home-hero-subhead"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
          >
            LALens turns Louisiana education, workforce, and demographic signals into clear investment recommendations,
            showing where need and opportunity overlap.
          </motion.p>

          <motion.div
            className="home-hero-stepper-wrap"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, type: "spring", stiffness: 280, damping: 28 }}
          >
            <HomeStepper />
          </motion.div>

          <motion.div
            className="home-hero-ctas home-hero-ctas--top"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <Link to="/platform" className="home-btn-primary">
              Explore the platform
            </Link>
            <Link to="/invest" className="home-btn-secondary">
              Investment intake
            </Link>
          </motion.div>
        </section>

        <section className="home-section home-section--metrics" aria-label="Key metrics">
          <div className="home-metrics-row">
            {[
              { value: String(homeStats.mapped), label: "Parishes mapped", hint: "Public geography layer", accent: "lavender" },
              { value: String(homeStats.sampleMetrics), label: "Scored examples", hint: "Prototype sample", accent: "orange" },
              { value: "5", label: "Score factors", hint: "Transparent model", accent: "blue" },
              { value: "1", label: "Decision workflow", hint: "Map to action", accent: "green" }
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <HomeMetricCard value={card.value} label={card.label} hint={card.hint} accent={card.accent} />
              </motion.div>
            ))}
          </div>
        </section>

        <motion.section className="home-section home-section--analytics" {...fadeUp}>
          <p className="home-kicker">Statewide signals</p>
          <h2 className="home-section-title">How the model reads Louisiana</h2>
          <p className="home-section-lead">
            Enrollment pressure, workforce demand, and investment focus in one view. Values are model estimates unless
            labeled as a public source.
          </p>
          <div className="home-dashboard-analytics">
            <PlatformAnalytics />
          </div>
          <RealityNote compact className="home-reality-note" />
        </motion.section>

        <motion.section className="home-section home-section--problem" {...fadeUp}>
          <p className="home-kicker">The problem</p>
          <h2 className="home-section-title">{productNarrative.problemTitle}</h2>
          <p className="home-section-lead">{productNarrative.problemLead}</p>
          <div className="home-problem-grid">
            {problemMiniCards.map((card) => (
              <article key={card.title} className="home-problem-card">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </motion.section>

        <motion.section className="home-section home-section--map" {...fadeUp}>
          <p className="home-kicker">Gap map</p>
          <h2 className="home-section-title">Explore every Louisiana parish</h2>
          <p className="home-section-lead">
            All <strong>64 parishes</strong> are mapped. Detailed scoring is shown for{" "}
            <strong>{SAMPLE_METRIC_COUNT} sample parishes</strong> in this prototype.
          </p>
          <div className="home-hero-map-shell">
            <HomeHeroMap />
          </div>
          <p className="home-map-caption">
            Drag, zoom, and select markers. Sample parishes include full dashboards and AI-ready briefs.
          </p>
        </motion.section>

        <motion.section className="home-section home-section--planning" {...fadeUp}>
          <div className="home-planning-wrap">
            <HomePlanningCard />
          </div>
        </motion.section>

        <motion.section className="home-section home-features-section" {...fadeUp}>
          <p className="home-kicker">Platform tools</p>
          <h2 className="home-section-title">Three tools. One investment decision.</h2>
          <p className="home-section-lead">
            Map gaps, ask grounded questions, and compare scores without leaving one workflow.
          </p>
          <div className="home-feature-grid">
            <motion.article className="home-feature-card" whileHover={{ y: -6 }}>
              <span className="home-feature-accent lavender" />
              <span className="home-feature-icon">
                <Map size={22} strokeWidth={1.75} />
              </span>
              <h3>Gap Map</h3>
              <p>Identify parishes where academic need, enrollment pressure, and workforce gaps overlap.</p>
            </motion.article>
            <motion.article className="home-feature-card" whileHover={{ y: -6 }}>
              <span className="home-feature-accent pink" />
              <span className="home-feature-icon home-feature-icon--logo">
                <BrandLogo variant="feature" />
              </span>
              <h3>AI Insight Engine</h3>
              <p>Ask plain-English questions and receive answers grounded in data from all 64 Louisiana parishes.</p>
            </motion.article>
            <motion.article className="home-feature-card" whileHover={{ y: -6 }}>
              <span className="home-feature-accent blue" />
              <span className="home-feature-icon">
                <ChartColumn size={22} strokeWidth={1.75} />
              </span>
              <h3>Decision Dashboard</h3>
              <p>Compare Opportunity Scores, score drivers, evidence, risks, and potential partners.</p>
            </motion.article>
          </div>
        </motion.section>

        <motion.section className="home-section home-steps-section" {...fadeUp}>
          <p className="home-kicker">How it works</p>
          <h2 className="home-section-title">From statewide map to matched investment</h2>
          <p className="home-section-lead">
            A single path from exploration to a ranked brief you can share with funders and operators.
          </p>
          <HomeStepCards />
        </motion.section>

        <motion.section className="home-section home-final-cta" {...fadeUp}>
          <h2 className="home-final-title">Ready to find the next opportunity zone?</h2>
          <p className="home-final-text">
            Open the platform map and parish dashboards. Start with the {SAMPLE_METRIC_COUNT}-parish sample, with a path
            to full statewide integration.
          </p>
          <div className="home-hero-ctas">
            <Link to="/platform" className="home-btn-primary">
              Explore the platform
            </Link>
            <Link to="/data-sources" className="home-btn-secondary">
              View data sources
            </Link>
          </div>
        </motion.section>
      </main>

      <HomeFooter />
    </div>
  );
}

export default Home;
