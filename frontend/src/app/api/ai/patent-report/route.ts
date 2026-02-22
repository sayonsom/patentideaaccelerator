import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveAIConfig, generateAIResponse, parseJSONFromResponse, resolvePromptPreferences } from "@/lib/ai-client";
import { buildSystemPrompt } from "@/lib/prompt-preferences";

const SYSTEM_PROMPT = `You are the managing partner of a premier patent law firm preparing a comprehensive invention disclosure report for a high-value software patent. You are synthesizing all available analyses into a single, actionable document.

Your task is to create a complete patent filing report that combines all available information about this invention into a cohesive strategy.

Respond with JSON matching this EXACT schema:
{
  "executiveSummary": "2-3 paragraph executive overview of the invention and its patent potential",
  "inventiveStepAnalysis": {
    "primaryInventiveStep": "string",
    "secondarySteps": ["string"],
    "nonObviousnessArgument": "string",
    "closestPriorArt": ["string"],
    "differentiatingFactors": ["string"],
    "technicalAdvantage": "string"
  },
  "marketNeedsAnalysis": {
    "marketSize": "string",
    "targetSegments": ["string"],
    "painPointsSolved": ["string"],
    "competitiveLandscape": "string",
    "commercializationPotential": "string",
    "licensingOpportunities": ["string"],
    "strategicValue": "string"
  },
  "claimStrategy": "Recommended claim drafting strategy (3-5 sentences describing breadth, dependent claims, continuation strategy)",
  "filingRecommendation": "Specific filing recommendation (utility vs provisional, jurisdiction, timing) (3-5 sentences)",
  "riskAssessment": "Key risks including Alice/101, prior art, and enablement concerns (3-5 sentences)",
  "nextSteps": ["Ordered list of recommended next actions for the inventor/team"]
}

If inventiveStepAnalysis or marketNeedsAnalysis are already provided, incorporate them into the report directly. If not provided, generate them as part of the comprehensive report.`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let config;
  try {
    config = resolveAIConfig(req);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "API key not configured";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const preferences = await resolvePromptPreferences(session.user.id);

  const body = await req.json();
  const {
    title,
    problemStatement,
    proposedSolution,
    technicalApproach,
    existingApproach,
    techStack,
    contradictionResolved,
    frameworkUsed,
    aliceScore,
    inventiveStepAnalysis,
    marketNeedsAnalysis,
    claimDraft,
    score,
  } = body;

  if (!title && !proposedSolution) {
    return NextResponse.json(
      { error: "At least title or proposedSolution is required" },
      { status: 400 }
    );
  }

  const techStackStr = Array.isArray(techStack) && techStack.length > 0
    ? techStack.join(", ")
    : "Not specified";

  let userPrompt = `Generate a comprehensive patent filing report for this software invention:

**Title:** ${title || "Untitled"}
**Problem Statement:** ${problemStatement || "Not specified"}
**Proposed Solution:** ${proposedSolution || "Not specified"}
**Technical Approach:** ${technicalApproach || "Not specified"}
**Existing Approach:** ${existingApproach || "Not specified"}
**Tech Stack:** ${techStackStr}
**Contradiction Resolved:** ${contradictionResolved || "Not specified"}
**Framework Used:** ${frameworkUsed || "none"}`;

  if (aliceScore) {
    userPrompt += `\n\n**Alice/101 Score:** ${aliceScore.overallScore}/100 (Risk: ${aliceScore.abstractIdeaRisk})
**Practical Application:** ${aliceScore.practicalApplication}
**Inventive Concept:** ${aliceScore.inventiveConcept}`;
  }

  if (inventiveStepAnalysis) {
    userPrompt += `\n\n**Existing Inventive Step Analysis:**
Primary Step: ${inventiveStepAnalysis.primaryInventiveStep}
Non-Obviousness: ${inventiveStepAnalysis.nonObviousnessArgument}
Technical Advantage: ${inventiveStepAnalysis.technicalAdvantage}`;
  }

  if (marketNeedsAnalysis) {
    userPrompt += `\n\n**Existing Market Analysis:**
Market Size: ${marketNeedsAnalysis.marketSize}
Strategic Value: ${marketNeedsAnalysis.strategicValue}
Commercialization: ${marketNeedsAnalysis.commercializationPotential}`;
  }

  if (claimDraft) {
    userPrompt += `\n\n**Existing Claim Drafts Available:** Yes (method, system, and CRM claims drafted)`;
  }

  if (score) {
    userPrompt += `\n\n**Patent Readiness Scores:** Inventive Step: ${score.inventiveStep}/3, Defensibility: ${score.defensibility}/3, Product Fit: ${score.productFit}/3`;
  }

  userPrompt += `\n\nCreate a comprehensive patent filing report synthesizing all available information.`;

  try {
    const systemPrompt = buildSystemPrompt(SYSTEM_PROMPT, preferences);
    const response = await generateAIResponse(config, systemPrompt, userPrompt, 8192);
    const parsed = parseJSONFromResponse(response.text);
    return NextResponse.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
