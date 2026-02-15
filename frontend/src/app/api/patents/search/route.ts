import { NextRequest, NextResponse } from "next/server";

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", hellip: "\u2026", nbsp: " ",
};

function decodeEntities(str: string): string {
  const s = String(str || "");
  if (!s) return "";
  return s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (full, code: string) => {
    if (code[0] === "#") {
      const isHex = code[1]?.toLowerCase() === "x";
      const numStr = isHex ? code.slice(2) : code.slice(1);
      const n = parseInt(numStr, isHex ? 16 : 10);
      if (!Number.isFinite(n)) return full;
      try { return String.fromCodePoint(n); } catch { return full; }
    }
    return NAMED_ENTITIES[code] ?? full;
  });
}

// Software-relevant CPC classes
const SOFTWARE_CPC_CLASSES = ["G06F", "G06N", "H04L", "G06Q", "G06T", "H04W"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const cpcFilter = searchParams.get("cpc")?.split(",").filter(Boolean) ?? [];

  if (!q) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
  }

  const limited = q.length > 400 ? q.slice(0, 400) : q;

  // Add CPC class filter to the query if specified
  const cpcClasses = cpcFilter.length > 0 ? cpcFilter : SOFTWARE_CPC_CLASSES;
  const cpcQuery = cpcClasses.map((c) => `cpc=${c}`).join(" OR ");
  const fullQuery = `${limited} (${cpcQuery})`;

  const urlParam = encodeURIComponent(`q=${fullQuery}`);
  const googleUrl = `https://patents.google.com/xhr/query?url=${urlParam}`;

  try {
    const r = await fetch(googleUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
        Accept: "application/json,text/plain,*/*",
      },
      cache: "no-store",
    });

    const json = await r.json().catch(() => null);
    if (!r.ok || !json?.results) {
      const msg = json?.error?.message || "Failed to fetch Google Patents results";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const cluster = json.results?.cluster?.[0]?.result || [];
    const results = cluster.slice(0, 20).map((item: Record<string, unknown>) => {
      const p = (item.patent || {}) as Record<string, string>;
      const id = item.id as string;
      return {
        patentNumber: p.publication_number || id || "",
        title: decodeEntities(p.title || ""),
        abstract: decodeEntities(p.snippet || ""),
        filingDate: p.filing_date || null,
        grantDate: p.grant_date || null,
        cpcClasses: [] as string[], // Google Patents XHR doesn't include CPC in results
        relevanceNote: "",
        url: id ? `https://patents.google.com/${id}` : "",
      };
    });

    return NextResponse.json({
      query: limited,
      total: json.results.total_num_results || 0,
      results,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
