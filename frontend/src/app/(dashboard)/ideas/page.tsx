"use client";

import { useState } from "react";
import Link from "next/link";
import { useIdeas } from "@/hooks/useIdeas";
import { IdeaCard } from "@/components/ideas/IdeaCard";
import { TableView } from "@/components/ideas/TableView";
import { Button, EmptyState, Badge } from "@/components/ui";
import type { Idea, IdeaStatus } from "@/lib/types";
import { SOLO_PIPELINE_STAGES, getIdeaProgress, getTotalScore, getAliceRiskColor } from "@/lib/utils";

const STATUS_FILTERS: { label: string; value: IdeaStatus | null }[] = [
  { label: "All", value: null },
  { label: "Draft", value: "draft" },
  { label: "Developing", value: "developing" },
  { label: "Scored", value: "scored" },
  { label: "Filed", value: "filed" },
];

type ViewMode = "grid" | "pipeline" | "table";

/** Find the first incomplete stage for an idea */
function getNextStageId(idea: Idea): string {
  for (const stage of SOLO_PIPELINE_STAGES) {
    if (!stage.complete(idea)) return stage.id;
  }
  return "complete";
}

export default function IdeasPage() {
  const {
    ideas,
    allIdeas,
    filterStatus,
    searchQuery,
    setFilterStatus,
    setSearchQuery,
  } = useIdeas();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-ink">Ideas</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-white rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1 rounded text-xs font-normal transition-colors ${
                viewMode === "grid" ? "bg-white text-ink shadow-sm" : "text-text-muted hover:text-ink"
              }`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("pipeline")}
              className={`px-2.5 py-1 rounded text-xs font-normal transition-colors ${
                viewMode === "pipeline" ? "bg-white text-ink shadow-sm" : "text-text-muted hover:text-ink"
              }`}
              title="Pipeline view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded text-xs font-normal transition-colors ${
                viewMode === "table" ? "bg-white text-ink shadow-sm" : "text-text-muted hover:text-ink"
              }`}
              title="Table view (with Magic Columns)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12H3.375m7.5 0h7.5m-7.5 0c.621 0 1.125.504 1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Status chips */}
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-normal transition-colors ${
                filterStatus === f.value
                  ? "bg-accent-light text-blue-ribbon"
                  : "bg-white text-neutral-dark hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ideas..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-border text-ink text-xs focus:outline-none focus:ring-2 focus:ring-blue-ribbon/40"
          />
        </div>

        {/* Count */}
        <span className="text-xs text-text-muted">
          {ideas.length} of {allIdeas.length} ideas
        </span>
      </div>

      {/* Grid or empty state */}
      {allIdeas.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          }
          title="No ideas yet"
          description="Turn the clever engineering problems you solve every day into defensible patent claims. Describe a problem, and AI helps you find what's patentable."
          action={
            <Link href="/ideas/new">
              <Button variant="accent">Create your first idea</Button>
            </Link>
          }
        />
      ) : ideas.length === 0 ? (
        <EmptyState
          title="No matching ideas"
          description="Try adjusting your filters or search query."
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      ) : viewMode === "table" ? (
        <TableView ideas={ideas} />
      ) : (
        <PipelineView ideas={ideas} />
      )}
    </div>
  );
}

// ─── Pipeline View ──────────────────────────────────────────────

function PipelineView({ ideas }: { ideas: Idea[] }) {
  // Group ideas by their next incomplete stage
  const columns = [
    ...SOLO_PIPELINE_STAGES.map((stage) => ({
      id: stage.id,
      label: stage.label,
      ideas: ideas.filter((idea) => getNextStageId(idea) === stage.id),
    })),
    {
      id: "complete",
      label: "Complete",
      ideas: ideas.filter((idea) => getNextStageId(idea) === "complete"),
    },
  ];

  return (
    <>
      {/* Desktop: horizontal scroll kanban */}
      <div className="hidden md:flex gap-3 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col.id} className="min-w-[220px] w-[220px] shrink-0">
            <div className="flex items-center gap-2 mb-3 px-1">
              <h3 className="text-xs font-medium text-ink truncate">{col.label}</h3>
              <Badge variant="outline" size="sm">{col.ideas.length}</Badge>
            </div>
            <div className="space-y-2">
              {col.ideas.map((idea) => (
                <PipelineCard key={idea.id} idea={idea} />
              ))}
              {col.ideas.length === 0 && (
                <div className="py-6 text-center text-[10px] text-text-muted border border-dashed border-border rounded-lg">
                  No ideas
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: vertical grouped list */}
      <div className="md:hidden space-y-6">
        {columns.filter((c) => c.ideas.length > 0).map((col) => (
          <div key={col.id}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xs font-medium text-ink">{col.label}</h3>
              <Badge variant="outline" size="sm">{col.ideas.length}</Badge>
            </div>
            <div className="space-y-2">
              {col.ideas.map((idea) => (
                <PipelineCard key={idea.id} idea={idea} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PipelineCard({ idea }: { idea: Idea }) {
  const total = getTotalScore(idea.score);
  const progress = getIdeaProgress(idea);

  return (
    <Link href={`/ideas/${idea.id}`} className="block group">
      <div className="rounded-lg border border-border bg-white p-3 hover:border-blue-ribbon/40 transition-colors">
        <h4 className="text-xs font-normal text-ink mb-1 line-clamp-2 group-hover:text-blue-ribbon transition-colors">
          {idea.title || "Untitled"}
        </h4>

        <div className="flex items-center gap-2 mb-2">
          {idea.score && (
            <span className="text-[10px] text-text-muted font-mono">{total}/9</span>
          )}
          {idea.aliceScore && (
            <span
              className="text-[10px] font-normal px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${getAliceRiskColor(idea.aliceScore.abstractIdeaRisk)}20`,
                color: getAliceRiskColor(idea.aliceScore.abstractIdeaRisk),
              }}
            >
              Alice {idea.aliceScore.overallScore}
            </span>
          )}
        </div>

        {/* Mini progress */}
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-1 bg-white rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress.percent}%`,
                background: progress.percent >= 87 ? "#10b981" : progress.percent >= 50 ? "#f59e0b" : "#6B7280",
              }}
            />
          </div>
          <span className="text-[9px] text-text-muted">{progress.completed}/{progress.total}</span>
        </div>
      </div>
    </Link>
  );
}
