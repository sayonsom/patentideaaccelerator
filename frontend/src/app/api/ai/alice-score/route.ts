import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a patent eligibility expert specializing in Alice Corp. v. CLS Bank (Section 101) analysis for software patents.

Analyze the given software invention and score its Alice/Section 101 eligibility.

Your response must be valid JSON matching this schema:
{
  "overallScore": <number 0-100>,
  "abstractIdeaRisk": "<low|medium|high>",
  "abstractIdeaAnalysis": "<2-3 sentences on whether this could be characterized as an abstract idea>",
  "practicalApplication": "<2-3 sentences on specific technological improvement>",
  "inventiveConcept": "<2-3 sentences on what makes this inventive beyond conventional methods>",
  "recommendations": ["<specific recommendation 1>", "<recommendation 2>", ...],
  "comparableCases": ["<relevant case 1>", "<relevant case 2>"]
}

Scoring guide:
- 0-30 (high risk): Likely abstract idea with no practical application (e.g., organizing human activity, mental process)
- 31-60 (medium risk): Has some technical specificity but needs stronger claims
- 61-80 (low-medium risk): Good technical grounding with specific implementation
- 81-100 (low risk): Specific technological improvement with clear inventive concept

Be specific. Reference real Alice framework cases where applicable.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY || req.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { title, problemStatement, proposedSolution, technicalApproach } = body;

  if (!title && !proposedSolution) {
    return NextResponse.json(
      { error: "At least title or proposedSolution is required" },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey });

  const userPrompt = `Analyze this software invention for Alice/Section 101 eligibility:

**Title:** ${title || "Untitled"}
**Problem:** ${problemStatement || "Not specified"}
**Proposed Solution:** ${proposedSolution || "Not specified"}
**Technical Approach:** ${technicalApproach || "Not specified"}

Score this invention and provide detailed analysis.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
