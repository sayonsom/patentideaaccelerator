import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidatePreferencesCache } from "@/lib/ai-client";
import type { PromptPreferences } from "@/lib/types";
import { DEFAULT_PROMPT_PREFERENCES } from "@/lib/types";
import type { Prisma } from "@prisma/client";

const COMPANY_CONTEXT_MAX_LENGTH = 500;

const VALID_JURISDICTIONS = new Set(["uspto", "epo", "wipo", "jpo"]);
const VALID_CLAIM_STYLES = new Set(["broad", "narrow", "balanced"]);
const VALID_DEPTHS = new Set(["high", "medium", "accessible"]);
const VALID_TONES = new Set(["formal", "plain"]);
const VALID_DOMAINS = new Set([
  "general", "cloud_infrastructure", "ai_ml", "security", "iot",
  "data_analytics", "fintech", "healthcare", "blockchain",
  "edge_computing", "devtools",
]);

function validatePreferences(body: unknown): PromptPreferences | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const jurisdiction =
    typeof b.jurisdiction === "string" && VALID_JURISDICTIONS.has(b.jurisdiction)
      ? b.jurisdiction
      : "uspto";
  const claimStyle =
    typeof b.claimStyle === "string" && VALID_CLAIM_STYLES.has(b.claimStyle)
      ? b.claimStyle
      : "balanced";
  const technicalDepth =
    typeof b.technicalDepth === "string" && VALID_DEPTHS.has(b.technicalDepth)
      ? b.technicalDepth
      : "medium";
  const tone =
    typeof b.tone === "string" && VALID_TONES.has(b.tone) ? b.tone : "formal";
  const domainFocus =
    typeof b.domainFocus === "string" && VALID_DOMAINS.has(b.domainFocus)
      ? b.domainFocus
      : "general";
  const companyContext =
    typeof b.companyContext === "string"
      ? b.companyContext.slice(0, COMPANY_CONTEXT_MAX_LENGTH).trim()
      : "";

  return {
    jurisdiction,
    claimStyle,
    technicalDepth,
    tone,
    domainFocus,
    companyContext,
  } as PromptPreferences;
}

// GET /api/settings/prompt-preferences
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { promptPreferences: true },
  });

  const prefs =
    (user?.promptPreferences as PromptPreferences | null) ??
    DEFAULT_PROMPT_PREFERENCES;
  return NextResponse.json({ preferences: prefs });
}

// PUT /api/settings/prompt-preferences
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validated = validatePreferences(body);
  if (!validated) {
    return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { promptPreferences: validated as unknown as Prisma.InputJsonValue },
  });

  invalidatePreferencesCache(session.user.id);

  return NextResponse.json({ preferences: validated });
}
