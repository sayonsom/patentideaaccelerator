"use client";

import { usePriorArt } from "@/hooks/usePriorArt";
import { SearchForm } from "@/components/prior-art/SearchForm";
import { PatentResultCard } from "@/components/prior-art/PatentResultCard";
import { EmptyState } from "@/components/ui";

export default function PriorArtPage() {
  const { results, search, loading, error } = usePriorArt();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-text-primary">Prior Art Search</h1>
      </div>

      <div className="max-w-3xl mb-6">
        <SearchForm onSearch={search} loading={loading} />
      </div>

      {error && (
        <p className="text-sm text-red-400 mb-4">{error}</p>
      )}

      {results.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-text-muted">{results.length} results</p>
          {results.map((r, i) => (
            <PatentResultCard key={r.patentNumber || i} result={r} />
          ))}
        </div>
      ) : !loading ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          }
          title="Search patents and prior art"
          description="Enter a query to search Google Patents filtered by software CPC classes."
        />
      ) : null}
    </div>
  );
}
