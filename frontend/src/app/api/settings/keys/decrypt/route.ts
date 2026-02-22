import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDecryptedKey } from "@/lib/actions/api-keys";
import type { AIProvider } from "@/lib/types";

const VALID_PROVIDERS = new Set<string>(["anthropic", "openai", "google"]);

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider") as AIProvider;

  if (!provider || !VALID_PROVIDERS.has(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const key = await getDecryptedKey(session.user.id, provider);
  return NextResponse.json({ key });
}
