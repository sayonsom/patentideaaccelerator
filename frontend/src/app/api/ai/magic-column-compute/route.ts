import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIResponse, resolveAIConfig, resolvePromptPreferences } from "@/lib/ai-client";
import { buildSystemPrompt } from "@/lib/prompt-preferences";
import {
  upsertMagicColumnValueAction,
  setMagicColumnValueStatusAction,
} from "@/lib/actions/magic-columns";

export const runtime = "nodejs";

const BASE_SYSTEM = `You are VoltEdge AI, analyzing patent ideas. You will be given a column prompt and idea details. Follow the prompt instructions exactly. Keep responses concise (1-2 sentences max unless the prompt says otherwise).`;

interface ComputeRequest {
  columnId: string;
  columnPrompt: string;
  ideas: {
    ideaId: string;
    title: string;
    problemStatement: string;
    proposedSolution: string;
    technicalApproach: string;
    techStack: string[];
  }[];
}

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

  const body: ComputeRequest = await req.json();
  const { columnId, columnPrompt, ideas } = body;

  if (!columnId || !columnPrompt || !ideas?.length) {
    return NextResponse.json({ error: "columnId, columnPrompt, and ideas are required" }, { status: 400 });
  }

  // Limit to 10 ideas per batch
  const batch = ideas.slice(0, 10);

  const preferences = await resolvePromptPreferences(session.user.id);
  const systemPrompt = buildSystemPrompt(BASE_SYSTEM, preferences);

  const results: { ideaId: string; value: string; error?: string }[] = [];

  // Process each idea sequentially to avoid rate limits
  for (const idea of batch) {
    try {
      // Mark as computing
      await setMagicColumnValueStatusAction(columnId, idea.ideaId, "computing");

      const userMsg = `Column prompt: ${columnPrompt}

Evaluate this patent idea:
- Title: ${idea.title}
- Problem: ${idea.problemStatement || "Not specified"}
- Solution: ${idea.proposedSolution || "Not specified"}
- Technical Approach: ${idea.technicalApproach || "Not specified"}
- Tech Stack: ${idea.techStack?.join(", ") || "Not specified"}`;

      const response = await generateAIResponse(
        config,
        systemPrompt,
        userMsg,
        256
      );

      // Save result
      await upsertMagicColumnValueAction(columnId, idea.ideaId, response.text.trim(), "done");
      results.push({ ideaId: idea.ideaId, value: response.text.trim() });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Compute error";
      await upsertMagicColumnValueAction(columnId, idea.ideaId, errorMsg, "error");
      results.push({ ideaId: idea.ideaId, value: "", error: errorMsg });
    }
  }

  return NextResponse.json({ results });
}
