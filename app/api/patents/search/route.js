function decodeEntities(str) {
  const s = String(str || "");
  if (!s) return "";

  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: "\"",
    apos: "'",
    hellip: "…",
    nbsp: " ",
  };

  return s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (_, code) => {
    if (code[0] === "#") {
      const isHex = code[1]?.toLowerCase() === "x";
      const numStr = isHex ? code.slice(2) : code.slice(1);
      const n = parseInt(numStr, isHex ? 16 : 10);
      if (!Number.isFinite(n)) return _;
      try {
        return String.fromCodePoint(n);
      } catch {
        return _;
      }
    }
    return named[code] ?? _;
  });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) {
    return Response.json({ error: "Missing q" }, { status: 400 });
  }

  const limited = q.length > 400 ? q.slice(0, 400) : q;
  const urlParam = encodeURIComponent(`q=${limited}`);
  const googleUrl = `https://patents.google.com/xhr/query?url=${urlParam}`;

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
    return Response.json({ error: msg }, { status: 502 });
  }

  const cluster = json.results.cluster?.[0]?.result || [];
  const results = cluster.slice(0, 10).map((item) => {
    const p = item.patent || {};
    const id = item.id;
    return {
      id,
      url: id ? `https://patents.google.com/${id}` : null,
      title: decodeEntities(p.title),
      snippet: decodeEntities(p.snippet),
      publicationNumber: p.publication_number || "",
      filingDate: p.filing_date || "",
      priorityDate: p.priority_date || "",
      publicationDate: p.publication_date || "",
      grantDate: p.grant_date || "",
      assignee: p.assignee || "",
      inventor: p.inventor || "",
      pdf: p.pdf || "",
    };
  });

  return Response.json({
    query: limited,
    total: json.results.total_num_results || 0,
    results,
  });
}
