"use client";

import type { PortfolioSummaryStats } from "@/lib/types";

interface PortfolioSummaryProps {
  stats: PortfolioSummaryStats;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  filed: "bg-blue-100 text-blue-800",
  granted: "bg-green-100 text-green-800",
  abandoned: "bg-neutral-100 text-neutral-600",
};

export function PortfolioSummary({ stats }: PortfolioSummaryProps) {
  const topCpc = Object.entries(stats.byCpc)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total entries */}
      <div className="bg-white border border-border rounded-lg p-4">
        <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Total Entries</p>
        <p className="text-2xl font-medium text-ink">{stats.totalEntries}</p>
      </div>

      {/* Filed this year */}
      <div className="bg-white border border-border rounded-lg p-4">
        <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Filed This Year</p>
        <p className="text-2xl font-medium text-blue-ribbon">{stats.filedThisYear}</p>
      </div>

      {/* Granted this year */}
      <div className="bg-white border border-border rounded-lg p-4">
        <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Granted This Year</p>
        <p className="text-2xl font-medium text-green-700">{stats.grantedThisYear}</p>
      </div>

      {/* Status breakdown */}
      <div className="bg-white border border-border rounded-lg p-4">
        <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">By Status</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(stats.byStatus)
            .filter(([, count]) => count > 0)
            .map(([status, count]) => (
              <span
                key={status}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[status] || "bg-neutral-100 text-neutral-600"}`}
              >
                {status}: {count}
              </span>
            ))}
          {stats.totalEntries === 0 && (
            <span className="text-xs text-text-secondary">No entries</span>
          )}
        </div>
      </div>

      {/* CPC distribution — spans full width when there's data */}
      {topCpc.length > 0 && (
        <div className="col-span-2 md:col-span-4 bg-white border border-border rounded-lg p-4">
          <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">
            Top CPC Classes
          </p>
          <div className="flex gap-3 flex-wrap">
            {topCpc.map(([cpc, count]) => (
              <div key={cpc} className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-medium text-ink">{cpc}</span>
                <div className="h-4 bg-blue-100 rounded" style={{ width: `${Math.max(24, count * 24)}px` }} />
                <span className="text-[10px] text-text-secondary">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
