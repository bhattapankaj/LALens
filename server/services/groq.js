const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

import schoolDirectory from "../data/schoolDirectory.json" with { type: "json" };

/** Handles pasted .env lines, quotes, and BOM so the key actually reaches Groq */
export function readGroqApiKey() {
  let k = process.env.GROQ_API_KEY;
  if (!k) return "";
  k = String(k).replace(/^\ufeff/, "").trim();
  if (/^GROQ_API_KEY\s*=/i.test(k)) {
    k = k.replace(/^GROQ_API_KEY\s*=\s*/i, "").trim();
  }
  k = k.replace(/^["']|["']$/g, "").trim();
  return k;
}

export function isGroqConfigured() {
  return readGroqApiKey().length > 10;
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
}

let warnedMissingGroqKey = false;

export async function generateGroqInsight({ message, selectedParish, contextParishes, history = [] }) {
  const apiKey = readGroqApiKey();
  if (!apiKey) {
    if (!warnedMissingGroqKey) {
      warnedMissingGroqKey = true;
      console.warn("[groq] GROQ_API_KEY missing or empty after parsing; using rule-based fallback.");
    }
    return null;
  }

  try {
    // Build full scored list then cap at top 25 by opportunity score to stay under token limits.
    // All 64 parishes now have prototype metrics, so sending all would exceed Groq's free-tier
    // token budget (~6k tokens/min). Top 25 covers the highest-priority investment targets.
    const allScored = contextParishes
      .filter((p) => p.hasMetrics)
      .sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0));

    // Always include the focus parish even if it falls outside the top 25
    const TOP_N = 15; // keeps each request ~3,500 tokens, allowing 3+ questions within Groq's 12k TPM limit
    const topSlice = allScored.slice(0, TOP_N);
    const focusIncluded = !selectedParish || topSlice.some((p) => p.id === selectedParish.id);
    if (!focusIncluded && selectedParish?.hasMetrics) {
      topSlice.splice(TOP_N - 1, 1, allScored.find((p) => p.id === selectedParish.id));
    }

    const scoredParishes = topSlice.map((p) => ({
      id: p.id,
      name: p.name,
      region: p.region,
      opportunityScore: p.opportunityScore,
      priorityLevel: p.priorityLevel,
      studentNeedScore: p.studentNeedScore,
      workforceGapScore: p.workforceGapScore,
      pathwayAccessGapScore: p.pathwayAccessGapScore,
      feasibilityScore: p.feasibilityScore,
      enrollmentPressureScore: p.enrollmentPressureScore,
      proficiencyRate: p.proficiencyRate,
      chronicAbsenteeismRate: p.chronicAbsenteeismRate,
      topWorkforceDemand: p.topWorkforceDemand,
      recommendedIntervention: p.recommendedIntervention,
      confidence: p.confidence
    }));

    // Compact school summary: counts + up to 3 school names, only for included parishes
    const schoolSummary = {};
    scoredParishes.forEach((p) => {
      const list = schoolDirectory[p.id] || [];
      schoolSummary[p.id] = {
        totalSchools: list.length,
        publicSchools: list.filter((s) => s.type === "Public").length,
        nonpublicSchools: list.filter((s) => s.type === "Nonpublic").length,
        sampleNames: list.slice(0, 2).map((s) => s.name)
      };
    });

    const context = {
      totalParishesOnMap: contextParishes.length,
      totalScoredParishes: allScored.length,
      contextParishCount: scoredParishes.length,
      note: `Showing top ${scoredParishes.length} parishes by opportunity score. All ${allScored.length} parishes have prototype metrics.`,
      pendingCount: 0,
      focusParish: selectedParish
        ? {
            id: selectedParish.id,
            name: selectedParish.name,
            region: selectedParish.region,
            opportunityScore: selectedParish.opportunityScore,
            priorityLevel: selectedParish.priorityLevel,
            studentNeedScore: selectedParish.studentNeedScore,
            workforceGapScore: selectedParish.workforceGapScore,
            pathwayAccessGapScore: selectedParish.pathwayAccessGapScore,
            feasibilityScore: selectedParish.feasibilityScore,
            enrollmentPressureScore: selectedParish.enrollmentPressureScore,
            proficiencyRate: selectedParish.proficiencyRate,
            chronicAbsenteeismRate: selectedParish.chronicAbsenteeismRate,
            graduationRate: selectedParish.graduationRate,
            povertyRate: selectedParish.povertyRate,
            topWorkforceDemand: selectedParish.topWorkforceDemand,
            recommendedIntervention: selectedParish.recommendedIntervention,
            recommendationSummary: selectedParish.recommendationSummary,
            keyEvidence: (selectedParish.keyEvidence || []).slice(0, 3),
            confidence: selectedParish.confidence,
            schools: schoolDirectory[selectedParish.id]
              ? {
                  totalSchools: (schoolDirectory[selectedParish.id] || []).length,
                  publicSchools: (schoolDirectory[selectedParish.id] || []).filter((s) => s.type === "Public").length,
                  nonpublicSchools: (schoolDirectory[selectedParish.id] || []).filter((s) => s.type === "Nonpublic").length,
                  sampleNames: (schoolDirectory[selectedParish.id] || []).slice(0, 5).map((s) => `${s.name} (${s.grades || s.type}, ${s.city})`)
                }
              : null
          }
        : null,
      scoredParishes,
      schoolSummaryByParish: schoolSummary,
      methodology: "35% Student Need + 20% Enrollment Pressure + 25% Workforce Gap + 10% Pathway Access Gap + 10% Feasibility. Prototype model estimates only."
    };

    const systemPrompt = `You are Navigator, the AI insight engine for LALens — a civic-tech platform mapping education and workforce investment opportunities across all 64 Louisiana parishes.

Answer using ONLY the data provided in the "Grounding context" JSON. Never invent statistics, scores, or agency claims not present in that data.

Key rules:
- ALL 64 Louisiana parishes have prototype opportunity scores. pendingCount is 0. The context shows the top 25 by score to fit within token limits — if asked about a parish not shown, acknowledge it has a score but detail isn't in the current context window.
- Opportunity Scores are prototype model estimates derived from Census indicators — never call them official or statewide.
- Census data (population, income, poverty, transportation) from U.S. Census Bureau ACS 5-Year 2023 is real public data.
- School directory data (schoolSummaryByParish, focusParish.schools) is from the LDOE 2023–24 School Directory — this is real public data.
- Never claim causal impact, ROI, or "proven outcomes."
- When asked about schools or institutions in a parish, use the school directory data — include specific school names, types, and counts.

Tone and format:
- Sound like a sharp, knowledgeable analyst — not a template.
- Vary your format naturally. A simple question gets a concise direct answer. A comparison gets a clear breakdown. Don't always use the same headings.
- Be specific — use the actual numbers from the data. Avoid generic filler.
- Keep responses under 220 words unless a detailed multi-parish comparison genuinely requires more.
- Close with one honest one-sentence caveat about data scope — not a whole disclaimer paragraph.`;

    const prior = sanitizeHistory(history);
    const userPayload = `Question: ${message}\n\nGrounding context:\n${JSON.stringify(context)}`;

    const requestBody = JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.55,
      max_tokens: 700,
      messages: [{ role: "system", content: systemPrompt }, ...prior, { role: "user", content: userPayload }]
    });

    // Attempt the request; on 429 TPM (per-minute) limit, wait and retry once.
    // On TPD (per-day) limit, fail immediately — waiting minutes is not useful.
    let response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: requestBody
    });

    if (response.status === 429) {
      const errJson = await response.json().catch(() => ({}));
      const retryMsg = errJson?.error?.message || "";
      const isDaily = /tokens per day|TPD/i.test(retryMsg);
      if (isDaily) {
        console.warn("[groq] Daily token limit (TPD) reached — get a fresh API key or wait until midnight UTC");
        return null;
      }
      const waitMatch = retryMsg.match(/try again in ([\d.]+)s/i);
      const waitMs = waitMatch ? Math.min(Math.ceil(parseFloat(waitMatch[1])) * 1000, 20000) : 18000;
      console.warn(`[groq] TPM rate limited — retrying in ${waitMs}ms`);
      await new Promise((r) => setTimeout(r, waitMs));
      response = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: requestBody
      });
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.warn("[groq] API error", response.status, errText.slice(0, 500));
      return null;
    }
    const payload = await response.json();
    const answer = payload?.choices?.[0]?.message?.content?.trim();
    if (!answer) return null;
    const confidence = answer.match(/Confidence[:\s]+(.+)/i)?.[1]?.trim()?.split("\n")?.[0] || selectedParish?.confidence || "Medium";

    return {
      answer,
      sources: [
        "Louisiana parish catalog (64 parishes mapped)",
        `Prototype metrics (${scoredParishes.length} scored parishes)`,
        "LDOE 2023–24 School Directory (1,659 institutions, all 64 parishes)",
        "Opportunity score methodology"
      ],
      confidence
    };
  } catch (e) {
    console.warn("[groq] request failed", e?.message || e);
    return null;
  }
}
