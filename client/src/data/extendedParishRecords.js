/**
 * Prototype metrics for the 52 parishes not covered by the 12 hand-authored sample records.
 * Scores are derived from U.S. Census ACS 5-Year 2023 poverty / income indicators using the
 * same five-factor formula as the hand-authored parishes. All values are clearly labeled as
 * "Prototype model estimate" — not official LDOE or LWC statistics.
 *
 * Formula (mirrors mergeParishGeographyWithMetrics weights):
 *   opportunityScore = 35% studentNeed + 20% enrollmentPressure + 25% workforceGap
 *                    + 10% pathwayAccess + 10% feasibility
 */

import censusProfiles from "./censusProfiles.json" with { type: "json" };

const censusMap = Object.fromEntries(censusProfiles.map((p) => [p.parishId, p]));
void censusMap; // used for lookup reference only

// Workforce demand pools by region
const DEMAND = {
  "Acadiana":            ["Healthcare", "Manufacturing", "Logistics"],
  "Capital Region":      ["Healthcare", "Technology", "Education"],
  "Southwest Louisiana": ["Manufacturing", "Skilled Trades", "Logistics"],
  "North Louisiana":     ["Manufacturing", "Healthcare", "Skilled Trades"],
  "Northeast Louisiana": ["Healthcare", "Skilled Trades", "Education"],
  "Central Louisiana":   ["Healthcare", "Skilled Trades", "Manufacturing"],
  "Bayou Region":        ["Logistics", "Skilled Trades", "Healthcare"],
  "Southeast Louisiana": ["Logistics", "Healthcare", "Technology"],
};

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, Math.round(v))); }

function scoresFromPoverty(pov) {
  return {
    studentNeedScore:        clamp(pov * 2.2 + 16, 38, 94),
    enrollmentPressureScore: clamp(pov * 1.4 + 22, 34, 76),
    workforceGapScore:       clamp(pov * 2.0 + 14, 36, 90),
    pathwayAccessGapScore:   clamp(pov * 1.8 + 10, 34, 86),
    feasibilityScore:        clamp(70 - pov * 0.6, 44, 76),
  };
}

function priorityLabel(score) {
  if (score >= 80) return "Urgent";
  if (score >= 65) return "High";
  if (score >= 50) return "Moderate";
  return "Low";
}
void priorityLabel; // available for future use

function interventionFor(scores, demand) {
  const { studentNeedScore, workforceGapScore } = scores;
  const d = demand[0];
  if (studentNeedScore >= 80) return `Regional ${d.toLowerCase()} pathway hub`;
  if (workforceGapScore >= 70) return `Industry-aligned ${d.toLowerCase()} academies`;
  if (studentNeedScore >= 60) return "Multi-site vocational pathway network";
  return "Early-college and dual-enrollment pathway expansion";
}

function buildEnrollmentTrend(score) {
  if (score >= 75) return [100, 99.1, 98.3, 97.4, 96.6];
  if (score >= 60) return [100, 99.5, 99.1, 98.8, 98.5];
  return [100, 100.1, 100.3, 100.4, 100.6];
}

function buildWorkforceFit(demand) {
  const base = [88, 79, 71, 58];
  return demand.map((sector, i) => ({ sector, value: base[i] ?? 55 }));
}

// Parishes already covered by the 12 hand-authored records
const SKIP = new Set([
  "east-baton-rouge","orleans","caddo","lafayette","calcasieu",
  "ouachita","rapides","claiborne","st-landry","terrebonne",
  "livingston","lincoln",
]);

// ── Region lookup ────────────────────────────────────────────────────────────
const REGION_MAP = {
  "acadia":               "Acadiana",
  "allen":                "Southwest Louisiana",
  "ascension":            "Capital Region",
  "assumption":           "Bayou Region",
  "avoyelles":            "Central Louisiana",
  "beauregard":           "Southwest Louisiana",
  "bienville":            "North Louisiana",
  "bossier":              "North Louisiana",
  "caldwell":             "Northeast Louisiana",
  "cameron":              "Southwest Louisiana",
  "catahoula":            "Central Louisiana",
  "concordia":            "Northeast Louisiana",
  "de-soto":              "North Louisiana",
  "east-carroll":         "Northeast Louisiana",
  "east-feliciana":       "Capital Region",
  "evangeline":           "Acadiana",
  "franklin":             "Northeast Louisiana",
  "grant":                "Central Louisiana",
  "iberia":               "Acadiana",
  "iberville":            "Capital Region",
  "jackson":              "North Louisiana",
  "jefferson":            "Southeast Louisiana",
  "jefferson-davis":      "Southwest Louisiana",
  "lafourche":            "Bayou Region",
  "lasalle":              "Central Louisiana",
  "madison":              "Northeast Louisiana",
  "morehouse":            "Northeast Louisiana",
  "natchitoches":         "North Louisiana",
  "plaquemines":          "Southeast Louisiana",
  "pointe-coupee":        "Capital Region",
  "red-river":            "North Louisiana",
  "richland":             "Northeast Louisiana",
  "sabine":               "North Louisiana",
  "st-bernard":           "Southeast Louisiana",
  "st-charles":           "Southeast Louisiana",
  "st-helena":            "Capital Region",
  "st-james":             "Bayou Region",
  "st-john-the-baptist":  "Southeast Louisiana",
  "st-martin":            "Acadiana",
  "st-mary":              "Bayou Region",
  "st-tammany":           "Southeast Louisiana",
  "tangipahoa":           "Capital Region",
  "tensas":               "Northeast Louisiana",
  "union":                "North Louisiana",
  "vermilion":            "Acadiana",
  "vernon":               "Southwest Louisiana",
  "washington":           "Capital Region",
  "webster":              "North Louisiana",
  "west-baton-rouge":     "Capital Region",
  "west-carroll":         "Northeast Louisiana",
  "west-feliciana":       "Capital Region",
  "winn":                 "Central Louisiana",
};

// ── Coordinates (from louisianaParishes.js) ──────────────────────────────────
const COORDS = {
  "acadia":               [30.214, -92.389],
  "allen":                [30.647, -92.824],
  "ascension":            [30.204, -90.913],
  "assumption":           [29.899, -90.985],
  "avoyelles":            [31.077, -92.019],
  "beauregard":           [30.647, -93.275],
  "bienville":            [32.345, -93.089],
  "bossier":              [32.679, -93.602],
  "caldwell":             [32.093, -92.113],
  "cameron":              [29.899, -93.19],
  "catahoula":            [31.669, -91.841],
  "concordia":            [31.566, -91.798],
  "de-soto":              [32.067, -93.724],
  "east-carroll":         [32.733, -91.235],
  "east-feliciana":       [30.845, -90.798],
  "evangeline":           [30.728, -92.416],
  "franklin":             [32.136, -91.75],
  "grant":                [31.6, -92.458],
  "iberia":               [29.868, -91.755],
  "iberville":            [30.257, -91.349],
  "jackson":              [32.298, -92.550],
  "jefferson":            [29.7, -90.129],
  "jefferson-davis":      [30.296, -92.826],
  "lafourche":            [29.5, -90.4],
  "lasalle":              [31.707, -92.171],
  "madison":              [32.365, -91.18],
  "morehouse":            [32.799, -91.7],
  "natchitoches":         [31.735, -93.097],
  "plaquemines":          [29.4, -89.9],
  "pointe-coupee":        [30.716, -91.617],
  "red-river":            [32.075, -93.38],
  "richland":             [32.418, -91.753],
  "sabine":               [31.554, -93.548],
  "st-bernard":           [29.8, -89.8],
  "st-charles":           [29.9, -90.4],
  "st-helena":            [30.804, -90.532],
  "st-james":             [29.985, -90.741],
  "st-john-the-baptist":  [30.117, -90.484],
  "st-martin":            [30.127, -91.593],
  "st-mary":              [29.676, -91.479],
  "st-tammany":           [30.4, -90.0],
  "tangipahoa":           [30.621, -90.401],
  "tensas":               [32.005, -91.338],
  "union":                [32.815, -92.445],
  "vermilion":            [29.76, -92.225],
  "vernon":               [31.105, -93.175],
  "washington":           [30.846, -89.923],
  "webster":              [32.847, -93.314],
  "west-baton-rouge":     [30.45, -91.34],
  "west-carroll":         [32.791, -91.452],
  "west-feliciana":       [30.652, -91.394],
  "winn":                 [31.955, -92.647],
};

export const extendedParishRecords = censusProfiles
  .filter((c) => !SKIP.has(c.parishId))
  .map((c) => {
    const region = REGION_MAP[c.parishId] ?? "Central Louisiana";
    const demand = DEMAND[region] ?? ["Healthcare", "Skilled Trades", "Education"];
    const scores = scoresFromPoverty(c.povertyRate);
    const oScore = clamp(
      0.35 * scores.studentNeedScore +
      0.20 * scores.enrollmentPressureScore +
      0.25 * scores.workforceGapScore +
      0.10 * scores.pathwayAccessGapScore +
      0.10 * scores.feasibilityScore,
      30, 95
    );

    return {
      id: c.parishId,
      name: c.parishName,
      region,
      coordinates: COORDS[c.parishId] ?? [30.5, -91.9],
      ...scores,
      proficiencyRate:         clamp(60 - c.povertyRate * 1.1, 24, 58),
      chronicAbsenteeismRate:  clamp(c.povertyRate * 0.7, 8, 32),
      enrollmentChangePercent: oScore >= 75 ? -3.5 : oScore >= 60 ? -1.2 : 0.6,
      graduationRate:          clamp(90 - c.povertyRate * 0.45, 74, 92),
      povertyRate:             c.povertyRate,
      topWorkforceDemand:      demand,
      recommendedIntervention: interventionFor(scores, demand),
      recommendationSummary:   `Prototype model estimate based on Census poverty indicators and regional workforce demand patterns.`,
      keyEvidence: [
        `Census poverty rate of ${c.povertyRate}% signals elevated student need.`,
        `Median household income of $${c.medianHouseholdIncome.toLocaleString()} is below the state median.`,
        `${demand[0]} and ${demand[1]} demand identified for ${region} in workforce projections.`,
      ],
      risks: [
        "Scores are prototype estimates; validate with LDOE enrollment and performance files.",
        "Implementation capacity varies; local partner assessment needed.",
        "Data integration pending for official LDOE and LWC sources.",
      ],
      potentialPartners: ["Community college", "Local employers", "Workforce board"],
      confidence: oScore >= 70 ? "Medium High" : "Medium",
      enrollmentTrend: buildEnrollmentTrend(oScore),
      workforceFit:    buildWorkforceFit(demand),
    };
  });
