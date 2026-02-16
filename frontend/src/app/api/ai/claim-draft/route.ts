import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a patent claim drafting assistant for software inventions.

Generate three claim types for the given invention:
1. **Method claim** — "A method for [verb]-ing ... comprising: [step a]; [step b]; ..."
2. **System claim** — "A system comprising: a processor; a memory storing instructions; wherein the processor executes instructions to: ..."
3. **Computer-readable medium claim** — "A non-transitory computer-readable medium storing instructions that, when executed by a processor, cause the processor to: ..."

Follow patent claim best practices:
- Use "comprising" (open-ended) not "consisting of" (closed)
- Each step should be a separate clause
- Be specific about the technical implementation
- Avoid abstract language that triggers Alice concerns
- Include means-plus-function language where appropriate

Your response must be valid JSON:
{
  "methodClaim": "<full method claim text>",
  "systemClaim": "<full system claim text>",
  "crmClaim": "<full CRM claim text>",
  "notes": "<brief notes on claim strategy>"
}`;

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
  const { title, technicalApproach, proposedSolution } = body;

  if (!title && !technicalApproach) {
    return NextResponse.json(
      { error: "At least title or technicalApproach is required" },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey });

  const userPrompt = `Draft patent claims for this software invention:

**Title:** ${title || "Untitled"}
**Proposed Solution:** ${proposedSolution || "Not specified"}
**Technical Approach:** ${technicalApproach || "Not specified"}

Generate method, system, and CRM claims with appropriate specificity.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3072,
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
