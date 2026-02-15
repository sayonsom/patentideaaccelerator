"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";

interface SearchFormProps {
  onSearch: (query: string, cpcFilter: string[]) => void;
  loading: boolean;
}

const CPC_OPTIONS = [
  { value: "G06F", label: "G06F — Computing; Calculating; Counting" },
  { value: "G06N", label: "G06N — AI / Machine Learning" },
  { value: "H04L", label: "H04L — Transmission of Digital Info" },
  { value: "G06Q", label: "G06Q — Data Processing for Business" },
  { value: "G06T", label: "G06T — Image Data Processing" },
  { value: "H04W", label: "H04W — Wireless Networks" },
];

export function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [query, setQuery] = useState("");
  const [selectedCpc, setSelectedCpc] = useState<string[]>([]);

  function toggleCpc(value: string) {
    setSelectedCpc((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), selectedCpc);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., distributed caching invalidation method"
          />
        </div>
        <Button type="submit" variant="accent" disabled={loading || !query.trim()}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
          CPC Class Filter (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {CPC_OPTIONS.map((cpc) => (
            <button
              key={cpc.value}
              type="button"
              onClick={() => toggleCpc(cpc.value)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedCpc.includes(cpc.value)
                  ? "bg-accent-gold/20 text-accent-gold"
                  : "bg-surface-deep text-text-secondary hover:text-text-primary"
              }`}
            >
              {cpc.value}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
