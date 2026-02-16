import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

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
  const { field, value, context } = body;

  if (!field || !value) {
    return NextResponse.json(
      { error: "field and value are required" },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey });

  const userPrompt = `Refine the following patent idea field.

**Field:** ${field}
**Current Value:** ${value}
**Context:** ${context || "A software patent idea"}

Improve the text to be more specific, technically precise, and suitable for patent claims. Keep the same meaning but strengthen the language. Return only the refined text, no JSON.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ refined: text.trim() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
