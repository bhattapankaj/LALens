/**
 * POST /api/investment-brief
 * Generates a fully AI-powered investment brief using Groq + school directory + parish data.
 */
import express from "express";
import { parishes } from "../data/parishes.js";
import schoolDirectory from "../data/schoolDirectory.json" with { type: "json" };
import censusProfiles from "../data/censusParishProfiles.fallback.json" with { type: "json" };
import { readGroqApiKey, isGroqConfigured } from "../services/groq.js";

const router = express.Router();
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// Map budget id → approximate dollar midpoint for filtering schools
const BUDGET_MIDPOINT = {
  "1k-5k":     3000,
  "5k-25k":    15000,
  "25k-100k":  60000,
  "100k-500k": 300000,
  "500k-2m":   1000000,
  "2m-plus":   3000000
};

const BUDGET_LABEL = {
  "1k-5k":     "$1,000 – $5,000 (micro-grant)",
  "5k-25k":    "$5,000 – $25,000 (small grant)",
  "25k-100k":  "$25,000 – $100,000 (program grant)",
  "100k-500k": "$100,000 – $500,000 (school-wide initiative)",
  "500k-2m":   "$500,000 – $2 Million (major investment)",
  "2m-plus":   "$2 Million+ (transformational partnership)"
};

// Grade bands appropriate per budget level
const GRADE_FILTER = {
  "1k-5k":     /PK|K|1|2|3|elem/i,
  "5k-25k":    /PK|K|elem|middle|6|7|8/i,
  "25k-100k":  /.*/,               // any school
  "100k-500k": /.*/,
  "500k-2m":   /9|10|11|12|high|career|tech|voc/i,
  "2m-plus":   /9|10|11|12|high|career|tech|voc|district/i
};

function getRelevantSchools(budgetId, focusId, maxSchools = 12) {
  const gradeRe = GRADE_FILTER[budgetId] || /.*/;
  // Focus-area keyword matching
  const focusKeywords = {
    literacy:          ["elementary", "primary", "elem", "K-8"],
    stem:              ["stem", "science", "tech", "magnet"],
    cte:               ["career", "voc", "tech", "trade", "cte"],
    healthcare:        ["health", "medical", "nursing"],
    "teacher-support": [],
    "student-services":["alternative", "special", "community"]
  };
  const kwList = focusKeywords[focusId] || [];

  const allSchools = Object.entries(schoolDirectory).flatMap(([parishId, list]) =>
    list.map((s) => ({ ...s, parishId }))
  );

  // Score each school on relevance
  const scored = allSchools
    .filter((s) => gradeRe.test(s.grades || ""))
    .map((s) => {
      let score = 0;
      const nameLow = (s.name || "").toLowerCase();
      if (kwList.some((kw) => nameLow.includes(kw.toLowerCase()))) score += 3;
      if (s.type === "Public") score += 1;
      return { ...s, _score: score };
    })
    .sort((a, b) => b._score - a._score);

  // Return spread across different parishes
  const seen = new Set();
  const result = [];
  for (const s of scored) {
    if (result.length >= maxSchools) break;
    if (!seen.has(s.parishId)) {
      seen.add(s.parishId);
      result.push(s);
    }
  }
  // Fill remaining from top scorers
  for (const s of scored) {
    if (result.length >= maxSchools) break;
    if (!result.includes(s)) result.push(s);
  }
  return result.slice(0, maxSchools);
}

router.post("/", async (req, res) => {
  const { role, budget, focus, parishId } = req.body || {};
  if (!role || !budget || !focus) {
    return res.status(400).json({ error: "role, budget, and focus are required." });
  }

  // Build parish context (top-scored parishes relevant to focus)
  const focusParish = parishId ? parishes.find((p) => p.id === parishId) : null;
  const scoredParishes = parishes
    .filter((p) => p.hasMetrics)
    .sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0))
    .slice(0, 15)
    .map((p) => {
      const census = censusProfiles.find((c) => c.parishId === p.id);
      const schoolCount = (schoolDirectory[p.id] || []).length;
      const highSchools = (schoolDirectory[p.id] || []).filter((s) =>
        /9|10|11|12|high|career|tech/i.test(s.grades || "")
      ).length;
      return {
        id: p.id,
        name: p.name,
        opportunityScore: p.opportunityScore,
        priorityLevel: p.priorityLevel,
        studentNeedScore: p.studentNeedScore,
        workforceGapScore: p.workforceGapScore,
        topWorkforceDemand: p.topWorkforceDemand,
        recommendedIntervention: p.recommendedIntervention,
        proficiencyRate: p.proficiencyRate,
        population: census?.population,
        medianHouseholdIncome: census?.medianHouseholdIncome,
        povertyRate: census?.povertyRate,
        schoolCount,
        highSchools
      };
    });

  const relevantSchools = getRelevantSchools(budget, focus);
  const budgetMid = BUDGET_MIDPOINT[budget] || 50000;

  const systemPrompt = `You are an AI investment analyst for LALens, a Louisiana K-12 education intelligence platform.

Your job: Given an investor's profile (role, budget, focus area), generate a structured, data-driven investment brief recommending specific Louisiana schools and parishes.

Rules:
- Use ONLY the school and parish data provided in the context.
- Budget ${BUDGET_LABEL[budget] || budget}: recommend programs and schools APPROPRIATE for this exact budget size.
  * Under $10K: focus on single-classroom or after-school grants.
  * $10K-$100K: program-level grants, teacher PD, supplies.
  * $100K-$500K: school-wide initiatives.
  * $500K+: multi-school partnerships, infrastructure.
- Be specific: name actual schools from the directory, reference real parish opportunity scores.
- Never fabricate scores or statistics not in the context.
- Keep the entire response under 350 words.

RESPOND IN THIS EXACT JSON FORMAT (no markdown fences, raw JSON only):
{
  "headline": "short compelling 8-word headline for this brief",
  "summary": "2-3 sentence executive summary tailored to role+budget+focus",
  "topMatches": [
    {
      "schoolName": "exact school name from directory",
      "parishName": "parish name",
      "parishId": "parish id",
      "grades": "grade band",
      "type": "Public or Nonpublic",
      "city": "city name",
      "whyMatch": "1-2 sentence explanation why this school matches this investor's profile and budget",
      "suggestedUse": "specific program or initiative this budget could fund here",
      "estimatedImpact": "brief realistic impact statement"
    }
  ],
  "whyThisFocus": "2-sentence explanation of why this focus area matters in Louisiana right now",
  "keyRisks": ["risk 1", "risk 2", "risk 3"],
  "nextSteps": ["step 1", "step 2", "step 3"],
  "confidence": "High / Medium / Low",
  "dataNote": "one honest sentence about data limitations"
}`;

  const userPrompt = `Investor profile:
- Role: ${role}
- Budget: ${BUDGET_LABEL[budget] || budget} (~$${budgetMid.toLocaleString()} midpoint)
- Focus: ${focus}
${focusParish ? `- Currently viewing: ${focusParish.name}` : ""}

Top Louisiana parishes by opportunity score:
${JSON.stringify(scoredParishes, null, 2)}

Relevant schools from LDOE 2023-24 directory (filtered for budget/focus fit):
${JSON.stringify(relevantSchools.map((s) => ({
  name: s.name, parishId: s.parishId, grades: s.grades, type: s.type, city: s.city, sponsor: s.sponsor
})), null, 2)}

Generate a brief with 3-5 topMatches. Pick schools that genuinely fit the budget range and focus area.`;

  // Try Groq
  if (isGroqConfigured()) {
    try {
      const apiKey = readGroqApiKey();
      const groqRes = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature: 0.45,
          max_tokens: 1200,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (groqRes.ok) {
        const payload = await groqRes.json();
        const raw = payload?.choices?.[0]?.message?.content?.trim();
        if (raw) {
          try {
            const brief = JSON.parse(raw);
            return res.json({ ok: true, brief, source: "groq", profile: { role, budget: BUDGET_LABEL[budget] || budget, focus } });
          } catch {
            // JSON parse failed — fall through to fallback
          }
        }
      } else {
        console.warn("[investment-brief] Groq error", groqRes.status);
      }
    } catch (e) {
      console.warn("[investment-brief] Groq request failed", e?.message);
    }
  }

  // Fallback: rule-based brief
  const fallbackMatches = relevantSchools.slice(0, 4).map((s) => {
    const parish = parishes.find((p) => p.id === s.parishId);
    return {
      schoolName: s.name,
      parishName: s.sponsor?.replace(" Parish", "") || s.parishId,
      parishId: s.parishId,
      grades: s.grades,
      type: s.type,
      city: s.city,
      whyMatch: `This ${s.type.toLowerCase()} school in ${s.city} aligns with a ${focus} focus and fits within the ${BUDGET_LABEL[budget] || budget} range.`,
      suggestedUse: `${focus === "cte" ? "CTE pathway launch" : focus === "literacy" ? "Literacy intervention program" : "Education program grant"}`,
      estimatedImpact: parish?.hasMetrics ? `Parish opportunity score: ${parish.opportunityScore}/100` : "High-need community"
    };
  });

  res.json({
    ok: true,
    brief: {
      headline: `K-12 Investment Matches for ${role} — ${BUDGET_LABEL[budget] || budget}`,
      summary: `Based on your profile as a ${role} with a ${BUDGET_LABEL[budget] || budget} budget focused on ${focus}, we identified schools in high-need Louisiana parishes. These matches use the LDOE 2023–24 school directory and prototype opportunity scores.`,
      topMatches: fallbackMatches,
      whyThisFocus: `${focus} is a high-priority area across Louisiana's K-12 system based on workforce demand and student need data.`,
      keyRisks: ["Verify school program readiness before committing.", "Coordinate with local district for implementation.", "Prototype scores are estimates — validate with LDOE data."],
      nextSteps: ["Contact school district or principal.", "Review LDOE data for your target parish.", "Define measurable outcomes before funding."],
      confidence: "Medium",
      dataNote: "School matches use the LDOE 2023–24 directory; opportunity scores are prototype estimates only."
    },
    source: "fallback",
    profile: { role, budget: BUDGET_LABEL[budget] || budget, focus }
  });
});

export default router;
