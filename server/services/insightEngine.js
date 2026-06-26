import { generateGroqInsight } from "./groq.js";
import { explainScoreDrivers } from "../../client/src/utils/scoring.js";

const CAUSAL_LIMITATION =
  "Available parish-level sample data can estimate opportunity potential, but it cannot prove exact causal impact without student-level longitudinal data, implementation cost, and historical outcomes from similar programs.";

function withMetrics(parishes) {
  return parishes.filter((p) => p.hasMetrics && typeof p.opportunityScore === "number");
}

function catalogNote(total, metricN) {
  return `The catalog maps all ${total} Louisiana parishes. Prototype opportunity scores (derived from Census indicators) are available for all ${metricN} parishes—not official statewide LDOE or workforce statistics.`;
}

function topByOpportunity(parishes, k) {
  return [...withMetrics(parishes)].sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, k);
}

function topUrgentList(parishes) {
  return topByOpportunity(parishes, 5)
    .map((p) => `${p.name} (${p.opportunityScore})`)
    .join(", ");
}

function briefFromParish(p, total, metricN) {
  if (!p) return "";
  if (!p.hasMetrics) {
    return `${catalogNote(total, metricN)} ${p.name} is mapped, but detailed metrics are not yet integrated in the prototype. Next steps: connect LDOE performance and enrollment files, Census ACS demographics, Louisiana Workforce Commission projections, NCES school geocodes, and a pathway inventory before any Opportunity Score can be shown. Confidence: Not applicable for scoring. Limitation: do not interpret as an official parish profile.`;
  }
  const drivers = explainScoreDrivers(p)
    .map((d) => `${d.label} ${d.value}`)
    .join(", ");
  const evidence = (p.keyEvidence || []).slice(0, 3).join(" ");
  return `${catalogNote(total, metricN)} For ${p.name}, the computed Opportunity Score is ${p.opportunityScore} (${p.priorityLevel} priority in the sample). Factor scores on file: student need ${p.studentNeedScore}, enrollment pressure ${p.enrollmentPressureScore}, workforce gap ${p.workforceGapScore}, pathway access gap ${p.pathwayAccessGapScore}, feasibility ${p.feasibilityScore}. Strongest weighted drivers: ${drivers}. Proficiency ${p.proficiencyRate}%, chronic absenteeism ${p.chronicAbsenteeismRate}%, enrollment change ${p.enrollmentChangePercent}%. Top workforce demand sectors: ${(p.topWorkforceDemand || []).join(", ")}. Dataset intervention text: ${p.recommendedIntervention}. Evidence strings: ${evidence || "see parish profile"}. Dataset confidence label: ${p.confidence}. Limitation: not an official LDOE or LWC release; decision-support only, not a substitute for local validation.`;
}

export async function generateInsight({ message, selectedParish, parishes, history = [] }) {
  const groqResponse = await generateGroqInsight({
    message,
    selectedParish,
    contextParishes: parishes,
    history
  });
  if (groqResponse) return { ...groqResponse, provider: "groq" };

  const total = parishes.length;
  const metricN = withMetrics(parishes).length;
  const msg = message.toLowerCase();
  let answer = briefFromParish(selectedParish, total, metricN);
  const sources = [
    "Louisiana parish catalog (map coverage)",
    `Prototype metrics (${metricN} parishes scored)`,
    "Opportunity score methodology"
  ];
  let confidence = selectedParish?.hasMetrics ? selectedParish?.confidence || "Medium" : "Not Available";

  const donationIntent =
    /\bdonat(e|ion|ing)?\b/.test(msg) ||
    /\bphilanthr/.test(msg) ||
    /\bmoney to (give|donate)\b/.test(msg) ||
    /\b(where|what).{0,40}\b(best|invest|give)\b/.test(msg);

  const vocationalIntent = /\bvocational\b|\bcte\b|\bcareer\s+technical\b/i.test(message);

  if (/\bsample metrics\b|\bwhich parishes have\b/i.test(message)) {
    answer = `${catalogNote(total, metricN)} Parishes with sample prototype metrics in this build: ${withMetrics(parishes)
      .map((p) => p.name)
      .join(", ")}. All other mapped parishes are pending official data integration.`;
    confidence = "High";
  } else if (donationIntent) {
    const top3 = topByOpportunity(parishes, 3);
    if (!top3.length) {
      answer = `${catalogNote(total, metricN)} Ranking is limited to parishes with available prototype metrics; none are configured.`;
      confidence = "Low";
    } else {
      const lead = top3[0];
      const drivers = explainScoreDrivers(lead)
        .map((d) => `${d.label} (${d.value})`)
        .join(", ");
      answer = `${catalogNote(total, metricN)} The three highest Opportunity Scores are: ${top3.map((p) => `${p.name} (${p.opportunityScore})`).join(", ")}. The top parish (${lead.name}) is driven most by: ${drivers}. Confidence: Medium High—not for causal impact or statewide funding decisions. Limitation: validate with districts, employers, and funders before broad allocation.`;
      confidence = "Medium High";
    }
  } else if (msg.includes("which 5 parishes") || /\btop\s*5\b/.test(msg) || /\bfive parishes\b/.test(msg)) {
    answer = `${catalogNote(total, metricN)} The five highest Opportunity Scores among parishes with sample metrics are: ${topUrgentList(parishes)}. Confidence: Medium High for within-sample ranking. Limitation: parishes without integrated metrics are excluded from this ranking.`;
    confidence = "Medium High";
  } else if (vocationalIntent) {
    const ranked = [...withMetrics(parishes)]
      .map((p) => ({ p, combo: (p.workforceGapScore || 0) + (p.pathwayAccessGapScore || 0) }))
      .sort((a, b) => b.combo - a.combo)
      .slice(0, 5);
    answer = `${catalogNote(total, metricN)} Among parishes with sample metrics, vocational / CTE-style pathway pressure (workforce gap + pathway access gap, equal weight for this heuristic) ranks highest for: ${ranked.map((x) => x.p.name).join(", ")}. Confidence: Medium. Limitation: pending parishes are excluded; this is not a program impact evaluation.`;
    confidence = "Medium";
  } else if (msg.includes("healthcare") && msg.includes("proficiency")) {
    const matches = withMetrics(parishes)
      .filter((p) => Array.isArray(p.topWorkforceDemand) && p.topWorkforceDemand.includes("Healthcare"))
      .sort((a, b) => a.proficiencyRate - b.proficiencyRate)
      .slice(0, 4);
    answer = `${catalogNote(total, metricN)} Among sample parishes listing Healthcare in topWorkforceDemand, the lowest proficiency rates are: ${matches.map((p) => `${p.name} (${p.proficiencyRate}%)`).join(", ")}. Confidence: Medium High within the sample. Limitation: workforce tags are demo labels; pending parishes are excluded.`;
    confidence = "Medium High";
  } else if (msg.includes("urgent")) {
    if (!selectedParish?.hasMetrics) {
      answer = `${catalogNote(total, metricN)} ${selectedParish?.name || "This parish"} does not yet have an Opportunity Score in the prototype. Urgent / priority labels apply only after LDOE, workforce, and pathway data are integrated.`;
      confidence = "Not Available";
    } else {
      answer = `${catalogNote(total, metricN)} ${selectedParish.name} is labeled ${selectedParish.priorityLevel} in the sample because factor scores (student need ${selectedParish.studentNeedScore}, workforce gap ${selectedParish.workforceGapScore}, pathway access gap ${selectedParish.pathwayAccessGapScore}, feasibility ${selectedParish.feasibilityScore}) combine to Opportunity Score ${selectedParish.opportunityScore}. Confidence: ${confidence}. Limitation: sample metrics only.`;
    }
  } else if (msg.includes("near-term impact")) {
    if (!selectedParish?.hasMetrics) {
      answer = `${catalogNote(total, metricN)} No near-term intervention can be scored for ${selectedParish?.name || "this parish"} until metrics are integrated.`;
      confidence = "Not Available";
    } else {
      answer = `${catalogNote(total, metricN)} The on-file intervention label for ${selectedParish.name} is: ${selectedParish.recommendedIntervention || "targeted pathway development"}. Demand sector tags in the sample: ${selectedParish.topWorkforceDemand?.join(", ") || "not specified"}. This describes demo narrative text paired with the sample scores—not a forecast of program outcomes. Confidence: ${confidence}. Limitation: not an implementation plan and not a causal impact estimate.`;
    }
  } else if (msg.includes("projected impact") || msg.includes("causal")) {
    answer = `${catalogNote(total, metricN)} ${CAUSAL_LIMITATION} Confidence: Low for causal claims.`;
    confidence = "Low";
  } else if (msg.includes("improve confidence")) {
    answer = `${catalogNote(total, metricN)} Confidence would improve with student-level longitudinal outcomes, implementation cost data, employer hiring outcomes, and comparable program evaluations for ${selectedParish?.name || "the parish of interest"}—none of which are in the catalog for pending parishes, and only partial for sample parishes.`;
  } else if (
    /\bwhere should we invest\b|\binvest first\b|\bwhere to invest\b/.test(msg)
  ) {
    const top3 = topByOpportunity(parishes, 3);
    answer = `${catalogNote(total, metricN)} Within the current sample, prioritize parishes where student need and workforce gap are both elevated. ${top3.map((p) => p.name.replace(" Parish", "")).join(", ")} rise in the prototype because their score drivers combine academic need, pathway access gaps, and workforce alignment. This is a model estimate, not an official state ranking. Confidence: Medium within sample.`;
    confidence = "Medium";
    sources.push("Model estimate");
  } else if (/\breal data\b|\bofficial data\b|\bis (the )?data real\b|\breal\b/.test(msg)) {
    answer = `LALens currently uses live public Census demographic data for all 64 Louisiana parishes, plus prototype model estimates for scoring and investment matching. Official LDOE, NCES, BLS, and Louisiana Workforce Commission integrations are part of the roadmap. The Census figures (population, poverty rate, median income, transportation access) are drawn directly from the U.S. Census Bureau ACS 5-Year public API (2023). Opportunity Scores remain prototype model estimates. Confidence: High for Census demographics; Medium for Opportunity Scores.`;
    confidence = "Medium";
    sources.push("U.S. Census Bureau ACS 5-Year (live public API)", "LDOE public reference", "LWC public reference", "Prototype model estimate");
  } else if (selectedParish && !selectedParish.hasMetrics) {
    answer = `${catalogNote(total, metricN)} ${selectedParish.name} is mapped, but detailed scoring is pending. To score it, LALens needs LDOE performance and enrollment files, Census ACS indicators, Louisiana Workforce Commission projections, NCES school geocodes, and a pathway inventory aligned to local demand. Confidence: Not Available for scoring.`;
    confidence = "Not Available";
  } else if (/\bexplain\b.*\b(score|opportunity)\b/.test(msg)) {
    answer = `${catalogNote(total, metricN)} The Opportunity Score is a transparent weighted blend of five factors (student need, enrollment pressure, workforce gap, pathway access, feasibility), each scored 0–100. Current parish values are model estimates in the ${metricN}-parish sample unless a public-source field is explicitly connected. See Methodology for weights. Confidence: High for method description; Medium for parish values.`;
    confidence = "High";
  }

  return { answer, sources: [...new Set(sources)], confidence, provider: "rules" };
}
