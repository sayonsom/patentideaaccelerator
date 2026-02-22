"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Idea, MagicColumn, MagicColumnValue } from "@/lib/types";
import { useSettingsStore } from "@/lib/store";
import {
  listMagicColumnsAction,
  listAllMagicValuesForUserAction,
} from "@/lib/actions/magic-columns";
import { MagicColumnConfig } from "./MagicColumnConfig";

interface TableViewProps {
  ideas: Idea[];
}

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  developing: "bg-blue-50 text-blue-700",
  scored: "bg-amber-50 text-amber-700",
  filed: "bg-green-50 text-green-700",
  archived: "bg-neutral-50 text-neutral-400",
};

export function TableView({ ideas }: TableViewProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const provider = useSettingsStore((s) => s.provider);
  const getActiveKey = useSettingsStore((s) => s.getActiveKey);

  const [columns, setColumns] = useState<MagicColumn[]>([]);
  const [values, setValues] = useState<MagicColumnValue[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [computing, setComputing] = useState<string | null>(null); // columnId being computed

  useEffect(() => {
    if (userId) {
      loadColumnsAndValues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, ideas.length]);

  const loadColumnsAndValues = async () => {
    if (!userId) return;
    const cols = await listMagicColumnsAction(userId);
    setColumns(cols);

    const ideaIds = ideas.map((i) => i.id);
    if (cols.length > 0 && ideaIds.length > 0) {
      const vals = await listAllMagicValuesForUserAction(userId, ideaIds);
      setValues(vals);
    }
  };

  const getValue = (columnId: string, ideaId: string): MagicColumnValue | undefined => {
    return values.find((v) => v.columnId === columnId && v.ideaId === ideaId);
  };

  const handleCompute = async (columnId: string) => {
    const col = columns.find((c) => c.id === columnId);
    if (!col) return;
    setComputing(columnId);

    const key = getActiveKey();
    const batch = ideas.slice(0, 10).map((idea) => ({
      ideaId: idea.id,
      title: idea.title,
      problemStatement: idea.problemStatement,
      proposedSolution: idea.proposedSolution,
      technicalApproach: idea.technicalApproach,
      techStack: idea.techStack,
    }));

    try {
      const res = await fetch("/api/ai/magic-column-compute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(key ? { "x-api-key": key, "x-ai-provider": provider } : {}),
        },
        body: JSON.stringify({
          columnId,
          columnPrompt: col.prompt,
          ideas: batch,
        }),
      });

      if (res.ok) {
        // Reload values
        if (userId) {
          const ideaIds = ideas.map((i) => i.id);
          const vals = await listAllMagicValuesForUserAction(userId, ideaIds);
          setValues(vals);
        }
      }
    } catch {
      // Silent — individual errors are per-value
    } finally {
      setComputing(null);
    }
  };

  const handleColumnsChange = (newCols: MagicColumn[]) => {
    setColumns(newCols);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-text-secondary">{ideas.length} ideas</p>
        <button
          onClick={() => setShowConfig(true)}
          className="px-2.5 py-1 text-xs bg-blue-ribbon text-white rounded-md hover:bg-blue-800 transition-colors"
        >
          + Magic Column
        </button>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-neutral-off-white border-b border-border">
              <th className="text-left px-3 py-2 text-[10px] text-text-secondary uppercase tracking-wider font-normal sticky left-0 bg-neutral-off-white">
                Title
              </th>
              <th className="text-left px-3 py-2 text-[10px] text-text-secondary uppercase tracking-wider font-normal">
                Status
              </th>
              <th className="text-left px-3 py-2 text-[10px] text-text-secondary uppercase tracking-wider font-normal">
                Score
              </th>
              <th className="text-left px-3 py-2 text-[10px] text-text-secondary uppercase tracking-wider font-normal">
                Alice
              </th>
              {/* Magic columns */}
              {columns.map((col) => (
                <th
                  key={col.id}
                  className="text-left px-3 py-2 text-[10px] text-text-secondary uppercase tracking-wider font-normal"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-blue-ribbon">✦</span>
                    <span>{col.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompute(col.id);
                      }}
                      disabled={computing === col.id}
                      className="ml-1 p-0.5 text-blue-ribbon hover:text-blue-800 transition-colors disabled:opacity-30"
                      title="Compute values"
                    >
                      {computing === col.id ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ideas.map((idea) => (
              <tr
                key={idea.id}
                className="border-b border-border last:border-b-0 hover:bg-neutral-off-white/50 cursor-pointer"
                onClick={() => router.push(`/ideas/${idea.id}`)}
              >
                <td className="px-3 py-2.5 sticky left-0 bg-white">
                  <p className="text-sm text-ink font-medium truncate max-w-[250px]">
                    {idea.title || "Untitled"}
                  </p>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${STATUS_BADGE[idea.status] || STATUS_BADGE.draft}`}>
                    {idea.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-text-secondary">
                  {idea.score
                    ? `${idea.score.inventiveStep}/${idea.score.defensibility}/${idea.score.productFit}`
                    : "—"}
                </td>
                <td className="px-3 py-2.5 text-xs text-text-secondary">
                  {idea.aliceScore ? `${idea.aliceScore.overallScore}/100` : "—"}
                </td>
                {/* Magic column values */}
                {columns.map((col) => {
                  const val = getValue(col.id, idea.id);
                  return (
                    <td key={col.id} className="px-3 py-2.5 text-xs max-w-[180px]">
                      {!val || val.status === "pending" ? (
                        <span className="text-neutral-400">—</span>
                      ) : val.status === "computing" ? (
                        <span className="text-blue-ribbon animate-pulse text-[10px]">Computing...</span>
                      ) : val.status === "error" ? (
                        <span className="text-danger text-[10px]" title={val.value}>Error</span>
                      ) : (
                        <span className="text-ink line-clamp-2">{val.value}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Config modal */}
      {showConfig && (
        <MagicColumnConfig
          columns={columns}
          onColumnsChange={handleColumnsChange}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  );
}
