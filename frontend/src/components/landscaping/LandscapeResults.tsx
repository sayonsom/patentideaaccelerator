"use client";

import { useState, useMemo } from "react";
import type { LandscapingSession, LandscapingPatent } from "@/lib/types";
import { updateLandscapingSessionAction } from "@/lib/actions/landscaping";

interface LandscapeResultsProps {
  session: LandscapingSession;
  onSessionUpdate: (session: LandscapingSession) => void;
}

export function LandscapeResults({ session, onSessionUpdate }: LandscapeResultsProps) {
  const patents = useMemo(() => session.patents ?? [], [session.patents]);
  const categories = session.taxonomy?.categories ?? [];
  const [activeBucket, setActiveBucket] = useState<string | "all">("all");

  // Group patents by taxonomy bucket
  const grouped = useMemo(() => {
    const map: Record<string, LandscapingPatent[]> = {};
    for (const p of patents) {
      const bucket = p.taxonomyBucket || "uncategorized";
      if (!map[bucket]) map[bucket] = [];
      map[bucket].push(p);
    }
    return map;
  }, [patents]);

  // CPC distribution
  const cpcCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of patents) {
      for (const cpc of p.cpcClasses) {
        const prefix = cpc.slice(0, 4);
        counts[prefix] = (counts[prefix] || 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [patents]);

  const filteredPatents = activeBucket === "all" ? patents : (grouped[activeBucket] ?? []);

  const handleResetSession = async () => {
    const updated = await updateLandscapingSessionAction(session.id, { status: "taxonomy_ready" });
    if (updated) onSessionUpdate(updated);
  };

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Total Patents</p>
          <p className="text-2xl font-medium text-ink">{patents.length}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Categories</p>
          <p className="text-2xl font-medium text-blue-ribbon">{categories.length}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">CPC Classes</p>
          <p className="text-2xl font-medium text-ink">{cpcCounts.length}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Actions</p>
          <button
            onClick={handleResetSession}
            className="text-xs text-blue-ribbon hover:underline mt-1"
          >
            Re-run search →
          </button>
        </div>
      </div>

      {/* CPC Distribution bar */}
      {cpcCounts.length > 0 && (
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-3">CPC Distribution</p>
          <div className="flex gap-3 flex-wrap">
            {cpcCounts.map(([cpc, count]) => (
              <div key={cpc} className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-medium text-ink">{cpc}</span>
                <div
                  className="h-5 bg-blue-100 rounded flex items-center justify-end px-1"
                  style={{ width: `${Math.max(30, (count / patents.length) * 200)}px` }}
                >
                  <span className="text-[10px] text-blue-700">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category filter + Results table */}
      <div>
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
          <span className="text-xs text-text-secondary shrink-0">Filter:</span>
          <button
            onClick={() => setActiveBucket("all")}
            className={`px-2 py-0.5 text-[10px] rounded-full border whitespace-nowrap transition-colors ${
              activeBucket === "all"
                ? "bg-blue-ribbon text-white border-blue-ribbon"
                : "bg-white text-text-secondary border-border hover:border-neutral-400"
            }`}
          >
            All ({patents.length})
          </button>
          {categories.map((cat) => {
            const count = grouped[cat.id]?.length ?? 0;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveBucket(cat.id)}
                className={`px-2 py-0.5 text-[10px] rounded-full border whitespace-nowrap transition-colors ${
                  activeBucket === cat.id
                    ? "bg-blue-ribbon text-white border-blue-ribbon"
                    : "bg-white text-text-secondary border-border hover:border-neutral-400"
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Patent table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-off-white border-b border-border">
                <th className="text-left px-3 py-2 text-[10px] text-text-secondary uppercase tracking-wider font-normal">
                  Patent
                </th>
                <th className="text-left px-3 py-2 text-[10px] text-text-secondary uppercase tracking-wider font-normal">
                  Title
                </th>
                <th className="text-left px-3 py-2 text-[10px] text-text-secondary uppercase tracking-wider font-normal">
                  Category
                </th>
                <th className="text-left px-3 py-2 text-[10px] text-text-secondary uppercase tracking-wider font-normal">
                  Filing Date
                </th>
                <th className="text-left px-3 py-2 text-[10px] text-text-secondary uppercase tracking-wider font-normal">
                  CPC
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPatents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-text-secondary">
                    No patents found in this category.
                  </td>
                </tr>
              ) : (
                filteredPatents.map((p) => {
                  const catLabel = categories.find((c) => c.id === p.taxonomyBucket)?.label ?? p.taxonomyBucket;
                  return (
                    <tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-neutral-off-white/50">
                      <td className="px-3 py-2.5 text-xs font-mono text-blue-ribbon whitespace-nowrap">
                        {p.patentNumber}
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-sm text-ink line-clamp-2">{p.title}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-700 rounded whitespace-nowrap">
                          {catLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-text-secondary whitespace-nowrap">
                        {p.filingDate
                          ? new Date(p.filingDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                            })
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1 flex-wrap">
                          {p.cpcClasses.slice(0, 2).map((cpc) => (
                            <span key={cpc} className="px-1 py-0.5 text-[10px] font-mono bg-neutral-100 text-neutral-600 rounded">
                              {cpc.slice(0, 7)}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredPatents.length > 0 && (
          <p className="text-[10px] text-text-secondary mt-2">
            Showing {filteredPatents.length} of {patents.length} patents
          </p>
        )}
      </div>
    </div>
  );
}
