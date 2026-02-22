import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIResponse, resolveAIConfig, parseJSONFromResponse, resolvePromptPreferences } from "@/lib/ai-client";
import { buildSystemPrompt } from "@/lib/prompt-preferences";

const SYSTEM_PROMPT = `You are a strategic patent portfolio advisor. Given a patent idea and a list of business goals, score how well the idea aligns with each goal on a 0-10 scale.

Your response must be valid JSON matching this schema:
{
  "scores": [
    {
      "goalId": "<the goal ID provided>",
      "score": <number 0-10>,
      "rationale": "<1-2 sentences explaining the alignment score>"
    }
  ]
}

Scoring guide:
- 0-2: No meaningful alignment — the idea doesn't relate to this business goal
- 3-4: Weak alignment — tangential connection, could stretch to fit
- 5-6: Moderate alignment — some overlap but not a core fit
- 7-8: Strong alignment — directly supports this business goal
- 9-10: Critical alignment — this idea is a key enabler of this business goal

Be specific about why each idea does or doesn't align. Consider technical relevance, market impact, and strategic value.`;

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
  const { title, problemStatement, proposedSolution, technicalApproach, goals } = body;

  if (!title && !proposedSolution) {
    return NextResponse.json(
      { error: "At least title or proposedSolution is required" },
      { status: 400 }
    );
  }

  if (!goals || !Array.isArray(goals) || goals.length === 0) {
    return NextResponse.json(
      { error: "At least one business goal is required" },
      { status: 400 }
    );
  }

  const goalsSection = goals
    .map((g: { id: string; title: string; description: string }) =>
      `- Goal ID: ${g.id}\n  Title: ${g.title}\n  Description: ${g.description || "No description"}`
    )
    .join("\n");

  const userPrompt = `Score how well this patent idea aligns with each business goal:

**Idea Title:** ${title || "Untitled"}
**Problem:** ${problemStatement || "Not specified"}
**Proposed Solution:** ${proposedSolution || "Not specified"}
**Technical Approach:** ${technicalApproach || "Not specified"}

**Business Goals:**
${goalsSection}

Provide a score (0-10) and brief rationale for each goal.`;

  try {
    const systemPrompt = buildSystemPrompt(SYSTEM_PROMPT, preferences);
    const { text } = await generateAIResponse(config, systemPrompt, userPrompt, 2048);

    const parsed = parseJSONFromResponse(text);
    return NextResponse.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
