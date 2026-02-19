import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

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

  const apiKey = process.env.ANTHROPIC_API_KEY || req.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

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

  const client = new Anthropic({ apiKey });

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
