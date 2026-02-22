import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listApiKeys, saveApiKey, revokeApiKey, deleteApiKey } from "@/lib/actions/api-keys";
import type { AIProvider } from "@/lib/types";

const VALID_PROVIDERS = new Set<string>(["anthropic", "openai", "google"]);

// GET /api/settings/keys -- list user's saved keys (metadata only, no decrypted values)
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const keys = await listApiKeys(session.user.id);
  return NextResponse.json({ keys });
}

// POST /api/settings/keys -- save a key
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { provider, key } = body as { provider: AIProvider; key: string };

  if (!provider || !key) {
    return NextResponse.json({ error: "provider and key are required" }, { status: 400 });
  }

  if (!VALID_PROVIDERS.has(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const saved = await saveApiKey(session.user.id, provider, key);
  return NextResponse.json({ saved });
}

// DELETE /api/settings/keys -- revoke or delete a key
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider") as AIProvider;
  const hard = searchParams.get("hard") === "true";

  if (!provider || !VALID_PROVIDERS.has(provider)) {
    return NextResponse.json({ error: "Valid provider is required" }, { status: 400 });
  }

  if (hard) {
    await deleteApiKey(session.user.id, provider);
  } else {
    await revokeApiKey(session.user.id, provider);
  }
  return NextResponse.json({ ok: true });
}
