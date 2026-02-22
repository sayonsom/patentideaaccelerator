"use client";

import { useState } from "react";
import type { PortfolioIdea, PortfolioIdeaStatus } from "@/lib/types";
import { usePortfolioStore } from "@/lib/store";

interface PortfolioTableProps {
  entries: PortfolioIdea[];
  portfolioId: string;
  onRefresh: () => void;
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  filed: "bg-blue-50 text-blue-700 border-blue-200",
  granted: "bg-green-50 text-green-700 border-green-200",
  abandoned: "bg-neutral-50 text-neutral-500 border-neutral-200",
};

const STATUS_OPTIONS: PortfolioIdeaStatus[] = ["pending", "filed", "granted", "abandoned"];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PortfolioTable({ entries, portfolioId, onRefresh }: PortfolioTableProps) {
  const { updateEntry, removeEntry } = usePortfolioStore();
  const [sortField, setSortField] = useState<"status" | "filingDate" | "createdAt">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterStatus, setFilterStatus] = useState<PortfolioIdeaStatus | "all">("all");

  const sorted = [...entries]
    .filter((e) => filterStatus === "all" || e.status === filterStatus)
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "status") {
        cmp = a.status.localeCompare(b.status);
      } else if (sortField === "filingDate") {
        cmp = (a.filingDate ?? "").localeCompare(b.filingDate ?? "");
      } else {
        cmp = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleStatusChange = async (id: string, newStatus: PortfolioIdeaStatus) => {
    await updateEntry(id, { status: newStatus });
    onRefresh();
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this entry from the portfolio?")) return;
    await removeEntry(id);
    onRefresh();
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-0.5 text-[10px]">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-text-secondary">
        No entries in this portfolio yet. Add a patent or link an existing idea.
      </div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-text-secondary">Filter:</span>
        {(["all", ...STATUS_OPTIONS] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
              filterStatus === s
                ? "bg-blue-ribbon text-white border-blue-ribbon"
                : "bg-white text-text-secondary border-border hover:border-neutral-400"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-text-secondary">
          {sorted.length} of {entries.length} entries
        </span>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-off-white border-b border-border">
              <th className="text-left px-3 py-2 text-[10px] text-text-secondary uppercase tracking-wider font-normal">
                Title / Patent No.
              </th>
              <th
                className="text-left px-3 py-2 text-[10px] text-text-secondary uppercase tracking-wider font-normal cursor-pointer hover:text-ink"
                onClick={() => handleSort("status")}
              >
                Status <SortIcon field="status" />
              </th>
              <th
                className="text-left px-3 py-2 text-[10px] text-text-secondary uppercase tracking-wider font-normal cursor-pointer hover:text-ink"
                onClick={() => handleSort("filingDate")}
              >
                Filing Date <SortIcon field="filingDate" />
              </th>
              <th className="text-left px-3 py-2 text-[10px] text-text-secondary uppercase tracking-wider font-normal">
                CPC
              </th>
              <th className="text-left px-3 py-2 text-[10px] text-text-secondary uppercase tracking-wider font-normal">
                Notes
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry) => (
              <tr key={entry.id} className="border-b border-border last:border-b-0 hover:bg-neutral-off-white/50">
                <td className="px-3 py-2.5">
                  <div className="font-medium text-ink text-sm">
                    {entry.externalTitle || entry.externalPatentNo || "Linked Idea"}
                  </div>
                  {entry.externalPatentNo && entry.externalTitle && (
                    <div className="text-[10px] text-text-secondary font-mono mt-0.5">
                      {entry.externalPatentNo}
                    </div>
                  )}
                  {entry.ideaId && (
                    <div className="text-[10px] text-blue-ribbon mt-0.5">
                      Linked to idea
                    </div>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <select
                    value={entry.status}
                    onChange={(e) => handleStatusChange(entry.id, e.target.value as PortfolioIdeaStatus)}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-full border appearance-none cursor-pointer ${STATUS_BADGE[entry.status]}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2.5 text-xs text-text-secondary">
                  {entry.filingDate
                    ? new Date(entry.filingDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1 flex-wrap">
                    {entry.cpcClasses.slice(0, 3).map((cpc) => (
                      <span
                        key={cpc}
                        className="px-1.5 py-0.5 text-[10px] font-mono bg-neutral-100 text-neutral-600 rounded"
                      >
                        {cpc}
                      </span>
                    ))}
                    {entry.cpcClasses.length > 3 && (
                      <span className="text-[10px] text-text-secondary">
                        +{entry.cpcClasses.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-xs text-text-secondary max-w-[200px] truncate">
                  {entry.notes || "—"}
                </td>
                <td className="px-2 py-2.5">
                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="p-1 text-neutral-400 hover:text-danger transition-colors rounded"
                    title="Remove entry"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
