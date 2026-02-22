import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIResponse, resolveAIConfig, parseJSONFromResponse, resolvePromptPreferences } from "@/lib/ai-client";
import { buildSystemPrompt } from "@/lib/prompt-preferences";

const SYSTEM_PROMPT = `You are a senior patent examiner and engineering critic. Your role is to find every possible weakness in a proposed software patent idea.

Be thorough, specific, and honest. Act as a devil's advocate. Consider:
1. Prior art: What existing patents, papers, or open-source projects address similar problems?
2. Alice/Section 101 risks: Could this be characterized as an abstract idea, mental process, or business method?
3. Obviousness: Would a person of ordinary skill in the art consider this an obvious combination?
4. Claim scope: Are the proposed claims too broad (easy to invalidate) or too narrow (easy to design around)?
5. Technical specificity: Is the technical implementation specific enough to survive examination?

Respond with valid JSON matching this schema:
{
  "critique": "<2-3 paragraph overall assessment>",
  "weaknesses": ["<specific weakness 1>", "<specific weakness 2>", ...],
  "priorArtConcerns": ["<specific prior art concern 1>", ...],
  "aliceRisks": ["<specific Alice/101 risk 1>", ...],
  "recommendations": ["<actionable recommendation 1>", ...]
}`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let config;
  try {
    config = resolveAIConfig(req);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "API key not configured" },
      { status: 500 }
    );
  }

  const preferences = await resolvePromptPreferences(session.user.id);

  const body = await req.json();
  const { title, problemStatement, proposedSolution, technicalApproach, aliceScoreSummary } = body;

  if (!title && !problemStatement) {
    return NextResponse.json(
      { error: "title or problemStatement is required" },
      { status: 400 }
    );
  }

  const userPrompt = `Critique this patent idea mercilessly:

**Title:** ${title || "Untitled"}
**Problem:** ${problemStatement || "Not specified"}
**Proposed Solution:** ${proposedSolution || "Not specified"}
**Technical Approach:** ${technicalApproach || "Not specified"}
${aliceScoreSummary ? `**Alice Pre-Screen Summary:** ${aliceScoreSummary}` : ""}

Find every weakness. Be specific about prior art risks, Alice/101 concerns, and claim vulnerabilities.`;

  try {
    const systemPrompt = buildSystemPrompt(SYSTEM_PROMPT, preferences);
    const { text } = await generateAIResponse(config, systemPrompt, userPrompt, 2000);

    // Try to parse JSON from the response
    try {
      const parsed = parseJSONFromResponse(text);
      return NextResponse.json(parsed);
    } catch {
      // Fallback: return the whole text as the critique
      return NextResponse.json({
        critique: text,
        weaknesses: [],
        priorArtConcerns: [],
        aliceRisks: [],
        recommendations: [],
      });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Red team analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
