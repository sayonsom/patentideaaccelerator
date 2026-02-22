import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIResponse, resolveAIConfig, resolvePromptPreferences } from "@/lib/ai-client";
import { buildSystemPrompt } from "@/lib/prompt-preferences";

const SYSTEM_PROMPT = `You are a patent language refinement assistant. When given a field from a patent idea, improve the text to be more specific, technically precise, and suitable for patent claims. Keep the same meaning but strengthen the language. Return only the refined text, no JSON wrapping.`;

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
  const { field, value, context } = body;

  if (!field || !value) {
    return NextResponse.json(
      { error: "field and value are required" },
      { status: 400 }
    );
  }

  const userPrompt = `Refine the following patent idea field.

**Field:** ${field}
**Current Value:** ${value}
**Context:** ${context || "A software patent idea"}

Improve the text to be more specific, technically precise, and suitable for patent claims. Keep the same meaning but strengthen the language. Return only the refined text, no JSON.`;

  try {
    const systemPrompt = buildSystemPrompt(SYSTEM_PROMPT, preferences);
    const { text } = await generateAIResponse(config, systemPrompt, userPrompt, 1024);

    return NextResponse.json({ refined: text.trim() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
