import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIResponse, resolveAIConfig, resolvePromptPreferences } from "@/lib/ai-client";
import { buildSystemPrompt } from "@/lib/prompt-preferences";

export const runtime = "nodejs";

const CONTINUATION_SYSTEM_PROMPT = `You are VoltEdge AI, an expert patent continuation strategist.

Given a filed or scored patent idea, generate 3-5 continuation directions. Each direction should be a distinct, patentable evolution of the original idea.

Types of continuations:
- **continuation-in-part**: Adds new matter to the original disclosure while keeping existing claims
- **divisional**: Carves out a distinct inventive aspect already present in the parent
- **design-around**: Alternative implementation that achieves similar results through different technical means
- **improvement**: Next-generation enhancement building on the parent invention

For each continuation direction, provide:
- directionType: one of "continuation-in-part", "divisional", "design-around", "improvement"
- title: a specific patent-worthy title
- description: 2-3 sentences describing the continuation idea
- technicalDelta: 1-2 sentences explaining what is technically different from the parent

Return a JSON array. No other text or markdown formatting. Just the JSON array.`;

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

  const body = await req.json();
  const { title, problemStatement, proposedSolution, technicalApproach, techStack } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Idea title is required" }, { status: 400 });
  }

  const preferences = await resolvePromptPreferences(session.user.id);
  const systemPrompt = buildSystemPrompt(CONTINUATION_SYSTEM_PROMPT, preferences);

  const userMessage = `Generate continuation directions for this patent idea:

**Title:** ${title}
**Problem:** ${problemStatement || "Not specified"}
**Solution:** ${proposedSolution || "Not specified"}
**Technical Approach:** ${technicalApproach || "Not specified"}
**Tech Stack:** ${(techStack || []).join(", ") || "Not specified"}`;

  try {
    const raw = await generateAIResponse(config, systemPrompt, userMessage, 4096);

    let directions;
    try {
      const jsonMatch = raw.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found");
      directions = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse continuations from AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ directions });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
