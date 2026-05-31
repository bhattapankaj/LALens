/**
 * investmentMatching.js
 * Enhanced investment matching logic for the LALens Investment Intake flow.
 * All scores are prototype model estimates. Not official funding guidance.
 */

import { schools } from "../data/schools.js";
import { parishes } from "../data/parishes.js";

// ── Constants (re-exported for InvestmentIntake) ────────────────────────────

export const INTAKE_ROLES = [
  { id: "corporate",     title: "Corporate sponsor",      desc: "Workforce pipeline and CTE partnerships",         icon: "briefcase" },
  { id: "philanthropist",title: "Philanthropist",          desc: "Impact-driven giving in education",               icon: "heart" },
  { id: "education",     title: "Education organization",  desc: "Partner with or support K-12 schools",            icon: "book" },
  { id: "agency",        title: "Public agency",           desc: "Public investment or program alignment",           icon: "landmark" },
  { id: "operator",      title: "School operator",         desc: "Charter, district, or network expansion",          icon: "school" },
  { id: "other",         title: "Other",                   desc: "Exploring options or undefined role",              icon: "circle-help" }
];

export const INTAKE_BUDGETS = [
  { id: "10k-50k",   title: "$10,000 – $50,000",     desc: "Classroom grants, supplies, tutoring" },
  { id: "50k-250k",  title: "$50,000 – $250,000",    desc: "Programs, teacher support, technology" },
  { id: "250k-1m",   title: "$250,000 – $1 Million", desc: "School-wide initiatives, facilities" },
  { id: "1m-5m",     title: "$1 Million – $5 Million",desc: "District programs, major infrastructure" },
  { id: "5m-plus",   title: "$5 Million+",            desc: "Transformational partnerships" }
];

export const INTAKE_FOCUS = [
  { id: "literacy",        title: "Literacy and reading",          desc: "K–3 intervention, Science of Reading",             icon: "book" },
  { id: "stem",            title: "STEM education",                desc: "Science, technology, engineering, math",            icon: "flask" },
  { id: "cte",             title: "Career and technical education",desc: "CTE, trades, and workforce pathways",               icon: "wrench" },
  { id: "healthcare",      title: "Healthcare pathways",           desc: "Nursing, allied health, and clinical pipelines",    icon: "heart-pulse" },
  { id: "teacher-support", title: "Teacher support",              desc: "Recruitment, retention, professional development",   icon: "users" },
  { id: "student-services",title: "Student support services",      desc: "Wraparound and access supports",                    icon: "hand-helping" }
];

// ── Label maps ──────────────────────────────────────────────────────────────

const ROLE_LABELS = {
  corporate:     "Corporate Sponsor",
  philanthropist:"Philanthropist",
  education:     "Education Organization",
  agency:        "Public Agency",
  operator:      "School Operator",
  other:         "Other"
};

const BUDGET_LABELS = {
  "10k-50k":  "$10,000 – $50,000",
  "50k-250k": "$50,000 – $250,000",
  "250k-1m":  "$250,000 – $1 Million",
  "1m-5m":    "$1 Million – $5 Million",
  "5m-plus":  "$5 Million+"
};

const FOCUS_LABELS = {
  literacy:          "Literacy and Reading",
  stem:              "STEM Education",
  cte:               "Career and Technical Education",
  healthcare:        "Healthcare Pathways",
  "teacher-support": "Teacher Support",
  "student-services":"Student Support Services"
};

// ── Scoring helpers ─────────────────────────────────────────────────────────

const BUDGET_LEVEL = {
  "10k-50k": 1, "50k-250k": 2, "250k-1m": 3, "1m-5m": 4, "5m-plus": 5
};

const RELATED_FOCUS = {
  literacy:          ["student-services", "teacher-support"],
  stem:              ["cte"],
  cte:               ["stem", "healthcare"],
  healthcare:        ["cte", "student-services"],
  "teacher-support": ["literacy", "student-services"],
  "student-services":["literacy", "teacher-support"]
};

function schoolBudgetLevel(school) {
  const r = school.investmentRange || "";
  if (/5M/i.test(r)) return 5;
  if (/1M.*2M|2M/i.test(r)) return 4;
  if (/750K|900K|1M/i.test(r)) return 3;
  if (/250K|500K/i.test(r)) return 2;
  return 3;
}

function budgetFitScore(budgetId, school) {
  const invLevel = BUDGET_LEVEL[budgetId] || 3;
  const diff = Math.abs(invLevel - schoolBudgetLevel(school));
  return diff === 0 ? 10 : diff === 1 ? 7 : diff === 2 ? 3 : 0;
}

function roleSignalScore(role, school, parish) {
  const frl = (school.freeReducedLunchPct || 0) / 100;
  switch (role) {
    case "corporate": {
      const wfMatch = school.focusAreas?.some((f) => ["cte", "healthcare", "stem"].includes(f)) ? 1 : 0.4;
      return Math.min(25, wfMatch * 20 + frl * 5);
    }
    case "philanthropist":
      return Math.min(25, frl * 25);
    case "operator": {
      const feas = parish?.hasMetrics ? (parish.feasibilityScore || 50) / 100 : 0.5;
      const path = parish?.hasMetrics ? (parish.pathwayAccessGapScore || 50) / 100 : 0.5;
      return Math.min(25, (feas + path) / 2 * 20 + frl * 5);
    }
    case "education": {
      const need = parish?.hasMetrics ? (parish.studentNeedScore || 50) / 100 : 0.5;
      return Math.min(25, need * 20 + frl * 5);
    }
    default:
      return Math.min(25, frl * 15 + 10);
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the weighting context for a given investor profile.
 * Used to explain why certain candidates are boosted.
 */
export function getInvestorWeights(profile) {
  return {
    focusBoostLabel: FOCUS_LABELS[profile.focus] || profile.focus,
    roleBoostLabel: ROLE_LABELS[profile.role] || profile.role,
    budgetLabel: BUDGET_LABELS[profile.budget] || profile.budget,
    focusRelated: RELATED_FOCUS[profile.focus] || []
  };
}

/**
 * Scores a single school/candidate against an investor profile.
 * Returns a score 0–100 (prototype model estimate).
 */
export function scoreInvestmentMatch(profile, school) {
  const parish = parishes.find((p) => p.id === school.parishId);

  // 1. Focus area alignment (0–35)
  let focusScore = 5;
  if (school.focusAreas?.includes(profile.focus)) {
    focusScore = 35;
  } else if ((RELATED_FOCUS[profile.focus] || []).some((f) => school.focusAreas?.includes(f))) {
    focusScore = 20;
  }

  // 2. Parish opportunity boost (0–20)
  const parishScore = parish?.hasMetrics ? (parish.opportunityScore || 0) / 100 * 20 : 10;

  // 3. Role-specific signals (0–25)
  const roleScore = roleSignalScore(profile.role, school, parish);

  // 4. Need signal (0–10)
  const needScore = ((school.freeReducedLunchPct || 0) / 100) * 10;

  // 5. Budget fit (0–10)
  const budgetScore = budgetFitScore(profile.budget, school);

  return Math.min(100, Math.max(0, Math.round(focusScore + parishScore + roleScore + needScore + budgetScore)));
}

/**
 * Scores and ranks all candidates, returns enriched array (highest first).
 */
export function rankInvestmentMatches(profile, candidates = schools) {
  return candidates
    .map((school) => {
      const parish = parishes.find((p) => p.id === school.parishId);
      const matchScore = scoreInvestmentMatch(profile, school);
      const focusFit = FOCUS_LABELS[profile.focus] || profile.focus;
      return {
        ...school,
        matchScore,
        matchPct: matchScore, // compatibility alias
        parish,
        focusFit,
        budgetFit: BUDGET_LABELS[profile.budget] || profile.budget
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ── Brief generation ────────────────────────────────────────────────────────

function buildWhyReasons(profile, match, parish) {
  const reasons = [];

  // Reason 1: focus alignment
  const focusLine = {
    literacy:          `Literacy and early-reading need are high in ${match.parishName} Parish, aligning with your focus on reading intervention.`,
    stem:              `STEM pathway demand overlaps with your profile, and this institution supports technology and science programs.`,
    cte:               `Career and technical education pathways address elevated workforce-gap signals in ${match.parishName} Parish.`,
    healthcare:        `Healthcare pathway demand in the region aligns with your focus on clinical and allied-health pipeline development.`,
    "teacher-support": `Teacher recruitment and retention signals in ${match.parishName} match your focus on educator pipeline support.`,
    "student-services":`High-need enrollment and wraparound service gaps in ${match.parishName} Parish align with student support priorities.`
  }[profile.focus] || `Focus area and need signals align with your selected investment priority.`;
  reasons.push(focusLine);

  // Reason 2: parish opportunity context
  if (parish?.hasMetrics) {
    reasons.push(
      `${parish.name} scores ${parish.opportunityScore}/100 in the prototype opportunity model, driven by student need (${parish.studentNeedScore}/100) and workforce gap (${parish.workforceGapScore}/100).`
    );
  } else {
    reasons.push(
      `${match.parishName} Parish is mapped for full Louisiana coverage. Free/reduced lunch enrollment of ${match.freeReducedLunchPct}% indicates significant student-need context.`
    );
  }

  // Reason 3: role-specific context
  const roleLine = {
    corporate:     `As a corporate sponsor, workforce-pipeline alignment is a primary signal. This institution's programs overlap with regional employer demand.`,
    philanthropist:`As a philanthropist, high poverty indicators and demonstrated academic need are primary signals for highest-leverage giving.`,
    operator:      `As a school operator, pathway access gaps and feasibility scores indicate a viable expansion or partnership entry point.`,
    education:     `As an education organization, student-need and academic proficiency signals indicate strong program alignment potential.`,
    agency:        `Public agency alignment with community-level need and workforce demand supports a strong case for public investment here.`
  }[profile.role] || `Need signals and pathway fit align with your investor profile.`;
  reasons.push(roleLine);

  return reasons;
}

function buildEvidenceSignals(match, parish) {
  return {
    studentNeed: {
      label: "Student need",
      value: parish?.hasMetrics ? `${parish.studentNeedScore}/100` : `${match.freeReducedLunchPct}% FRL`,
      sub: parish?.hasMetrics ? "Model estimate" : "Free/reduced lunch proxy",
      type: parish?.hasMetrics ? "model" : "public"
    },
    workforceGap: {
      label: "Workforce gap",
      value: parish?.hasMetrics ? `${parish.workforceGapScore}/100` : "Pending",
      sub: parish?.hasMetrics ? "Model estimate" : "Official integration pending",
      type: parish?.hasMetrics ? "model" : "pending"
    },
    pathwayAccess: {
      label: "Pathway access gap",
      value: parish?.hasMetrics ? `${parish.pathwayAccessGapScore}/100` : "Pending",
      sub: parish?.hasMetrics ? "Model estimate" : "Official integration pending",
      type: parish?.hasMetrics ? "model" : "pending"
    },
    feasibility: {
      label: "Feasibility",
      value: parish?.hasMetrics ? `${parish.feasibilityScore}/100` : "Pending",
      sub: parish?.hasMetrics ? "Model estimate" : "Official integration pending",
      type: parish?.hasMetrics ? "model" : "pending"
    }
  };
}

function buildRisks(match, parish) {
  return [
    "Implementation capacity requires local partner confirmation and program design validation.",
    `Transportation access${parish?.hasMetrics && parish.workforceGapScore > 70 ? " and commute patterns" : ""} may limit participation from surrounding communities.`,
    "Qualified instructor availability for specialized pathways needs district-level verification.",
    "Data validation is needed against official LDOE enrollment and performance records before final investment decisions."
  ];
}

function buildPartners(match) {
  const parishShort = match.parishName;
  return [
    `${parishShort} area community college or technical institute (dual enrollment and instructor pipeline)`,
    `Regional employers aligned with ${match.pathwayFit || "pathway focus"} (internship and hiring commitments)`,
    `Louisiana Workforce Commission regional board (labor market data and program co-investment)`,
    `${parishShort} Parish school district or charter network operator (implementation partnership)`
  ];
}

/**
 * Generates a structured investment brief object from a profile and ranked matches.
 * All score labels use "Prototype model estimate" or "Demo estimate" as appropriate.
 */
export function generateInvestmentBrief(profile, topMatches) {
  const match = topMatches[0];
  if (!match) return null;
  const parish = parishes.find((p) => p.id === match.parishId);

  return {
    generatedAt: new Date().toISOString(),
    profile: {
      role:   ROLE_LABELS[profile.role]    || profile.role,
      budget: BUDGET_LABELS[profile.budget] || profile.budget,
      focus:  FOCUS_LABELS[profile.focus]   || profile.focus
    },
    topMatch: {
      id:                   match.id,
      name:                 match.name,
      parishName:           match.parishName,
      parishId:             match.parishId,
      type:                 match.type,
      matchScore:           match.matchScore,
      opportunityScore:     parish?.hasMetrics ? parish.opportunityScore : null,
      recommendedIntervention: parish?.hasMetrics
        ? (parish.recommendedIntervention || match.pathwayFit)
        : match.pathwayFit,
      investmentRange:      match.investmentRange,
      needSignal:           match.needSignal,
      programs:             match.programs || [],
      enrollment:           match.enrollment
    },
    whyReasons:      buildWhyReasons(profile, match, parish),
    evidenceSignals: buildEvidenceSignals(match, parish),
    risks:           buildRisks(match, parish),
    partners:        buildPartners(match),
    nextSteps: [
      "Validate official LDOE and local school data before any funding decision.",
      "Confirm local implementation partners and program readiness.",
      "Estimate detailed program cost, timeline, and staffing plan.",
      "Design a pilot with measurable student and workforce outcomes."
    ],
    allMatches: topMatches,
    disclaimer: "Matches combine public-source references with prototype model estimates. They are decision-support outputs, not official funding decisions."
  };
}

/**
 * Serializes a brief object to a plain-text string for copy/download.
 */
export function buildBriefText(brief, email = "") {
  if (!brief) return "";
  const date = new Date(brief.generatedAt).toLocaleString("en-US", {
    month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
  const m = brief.topMatch;
  const ev = brief.evidenceSignals;

  const lines = [
    "LALens Investment Brief",
    `Generated: ${date}`,
    email ? `Contact email: ${email} (prototype only — not transmitted)` : "",
    "=" .repeat(50),
    "",
    "INVESTOR PROFILE",
    `Role:        ${brief.profile.role}`,
    `Budget:      ${brief.profile.budget}`,
    `Focus area:  ${brief.profile.focus}`,
    "",
    "=" .repeat(50),
    "",
    "TOP RECOMMENDATION",
    `Institution:     ${m.name}`,
    `Parish:          ${m.parishName} Parish`,
    `Type:            ${m.type}`,
    `Enrollment:      ${m.enrollment?.toLocaleString() ?? "N/A"}`,
    `Match score:     ${m.matchScore}/100  [Prototype model estimate]`,
    m.opportunityScore !== null
      ? `Opportunity score: ${m.opportunityScore}/100  [Prototype model estimate]`
      : "Opportunity score: Pending official data integration",
    `Recommended:     ${m.recommendedIntervention || "See pathway fit"}`,
    `Est. range:      ${m.investmentRange}  [Demo estimate]`,
    `Need signal:     ${m.needSignal}`,
    "",
    "WHY THIS MATCH",
    ...brief.whyReasons.map((r, i) => `${i + 1}. ${r}`),
    "",
    "EVIDENCE SIGNALS  [Prototype model estimates unless noted]",
    `Student need:      ${ev.studentNeed.value}  (${ev.studentNeed.sub})`,
    `Workforce gap:     ${ev.workforceGap.value}  (${ev.workforceGap.sub})`,
    `Pathway access:    ${ev.pathwayAccess.value}  (${ev.pathwayAccess.sub})`,
    `Feasibility:       ${ev.feasibility.value}  (${ev.feasibility.sub})`,
    "",
    "RISKS",
    ...brief.risks.map((r, i) => `${i + 1}. ${r}`),
    "",
    "SUGGESTED PARTNERS",
    ...brief.partners.map((p, i) => `${i + 1}. ${p}`),
    "",
    "NEXT STEPS",
    ...brief.nextSteps.map((s, i) => `${i + 1}. ${s}`),
    "",
    "=" .repeat(50),
    "",
    "OTHER TOP MATCHES",
    ...brief.allMatches.slice(1, 4).map(
      (s, i) => `${i + 2}. ${s.name} (${s.parishName} Parish) — Match score: ${s.matchScore}/100 — ${s.investmentRange}`
    ),
    "",
    "-".repeat(50),
    brief.disclaimer,
    "",
    "Source: LALens prototype · la-lens.vercel.app",
    `Exported: ${date}`
  ].filter((l) => l !== null);

  return lines.join("\n");
}

// ── Backward-compat export ──────────────────────────────────────────────────

export function matchSchools({ role, budget, focus }) {
  return rankInvestmentMatches({ role, budget, focus }).slice(0, 5);
}
