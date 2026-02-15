"use client";

import Link from "next/link";
import { useIdeas } from "@/hooks/useIdeas";
import { IdeaCard } from "@/components/ideas/IdeaCard";
import { Button, EmptyState } from "@/components/ui";
import type { IdeaStatus } from "@/lib/types";

const STATUS_FILTERS: { label: string; value: IdeaStatus | null }[] = [
  { label: "All", value: null },
  { label: "Draft", value: "draft" },
  { label: "Developing", value: "developing" },
  { label: "Scored", value: "scored" },
  { label: "Filed", value: "filed" },
];

export default function IdeasPage() {
  const {
    ideas,
    allIdeas,
    filterStatus,
    searchQuery,
    setFilterStatus,
    setSearchQuery,
  } = useIdeas();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-text-primary">Ideas</h1>
        <Link href="/ideas/new">
          <Button variant="accent" size="sm">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Idea
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Status chips */}
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterStatus === f.value
                  ? "bg-accent-gold/20 text-accent-gold"
                  : "bg-surface-deep text-text-secondary hover:text-text-primary"
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
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-deep border border-border-default text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
          />
        </div>

        {/* Count */}
        <span className="text-xs text-text-muted ml-auto">
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
          description="Start by describing a problem you've solved or a clever technical approach you've built."
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}
