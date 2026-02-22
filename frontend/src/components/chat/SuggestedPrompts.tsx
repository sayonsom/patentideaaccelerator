"use client";

import type { SuggestedPrompt } from "@/lib/types";

interface SuggestedPromptsProps {
  prompts: SuggestedPrompt[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function SuggestedPrompts({ prompts, onSelect, disabled }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {prompts.map((p) => (
        <button
          key={p.label}
          onClick={() => onSelect(p.prompt)}
          disabled={disabled}
          className="px-2.5 py-1.5 text-xs rounded-full border border-border text-text-secondary hover:text-ink hover:border-blue-ribbon hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
