import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIResponse, resolveAIConfig, resolvePromptPreferences } from "@/lib/ai-client";
import { buildSystemPrompt } from "@/lib/prompt-preferences";
import type { TaxonomyCategory } from "@/lib/types";

export const runtime = "nodejs";

const TAXONOMY_SYSTEM_PROMPT = `You are VoltEdge AI, an expert patent landscape analyst.

When given a technology description, generate a taxonomy of 4-8 categories that would be used to organize a patent landscape analysis.

Each category should represent a distinct technical sub-area within the described technology space.

Return a JSON array of categories. Each category has:
- id: a short kebab-case slug (e.g. "distributed-caching")
- label: human-readable name (e.g. "Distributed Caching Systems")
- description: 1-2 sentence description of what patents in this category cover
- keywords: array of 3-6 search keywords/phrases for finding patents in this category
- cpcClasses: array of 1-3 CPC classification codes most relevant to this category (e.g. "G06F 16/00")

IMPORTANT: Return ONLY the JSON array, no other text or markdown formatting.`;

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
  const { techDescription }: { techDescription: string } = body;

  if (!techDescription?.trim()) {
    return NextResponse.json({ error: "techDescription is required" }, { status: 400 });
  }

  const preferences = await resolvePromptPreferences(session.user.id);
  const systemPrompt = buildSystemPrompt(TAXONOMY_SYSTEM_PROMPT, preferences);

  const userPrompt = `Generate a patent landscape taxonomy for the following technology area:\n\n${techDescription}`;

  try {
    const raw = await generateAIResponse(config, systemPrompt, userPrompt, 4096);

    // Parse JSON from AI response
    let categories: TaxonomyCategory[];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = raw.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found in response");
      categories = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse taxonomy from AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      categories,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
