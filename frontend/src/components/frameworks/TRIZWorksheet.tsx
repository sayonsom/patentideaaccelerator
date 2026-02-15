"use client";

import { useState } from "react";
import { TRIZ_PRINCIPLES } from "@/lib/constants";
import { Card, Textarea, Button } from "@/components/ui";
import type { TRIZData } from "@/lib/types";

interface TRIZWorksheetProps {
  data?: TRIZData;
  onChange?: (data: TRIZData) => void;
}

export function TRIZWorksheet({ data, onChange }: TRIZWorksheetProps) {
  const [local, setLocal] = useState<TRIZData>(
    data ?? { improving: "", worsening: "", principles: [], resolution: "" }
  );

  function update(partial: Partial<TRIZData>) {
    const next = { ...local, ...partial };
    setLocal(next);
    onChange?.(next);
  }

  function togglePrinciple(id: number) {
    const has = local.principles.includes(id);
    const next = has
      ? local.principles.filter((p) => p !== id)
      : [...local.principles, id];
    update({ principles: next });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-text-primary mb-1">TRIZ Worksheet</h2>
        <p className="text-sm text-text-secondary">
          Identify the contradiction in your system: what are you trying to <em>improve</em>, and what <em>worsens</em> as a result?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Textarea
          label="Improving Parameter"
          value={local.improving}
          onChange={(e) => update({ improving: e.target.value })}
          rows={3}
          placeholder="e.g., Response latency, throughput, cache hit rate..."
        />
        <Textarea
          label="Worsening Parameter"
          value={local.worsening}
          onChange={(e) => update({ worsening: e.target.value })}
          rows={3}
          placeholder="e.g., Data consistency, memory usage, complexity..."
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Select Applicable Principles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {TRIZ_PRINCIPLES.map((p) => {
            const selected = local.principles.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePrinciple(p.id)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  selected
                    ? "border-accent-gold bg-accent-gold/10"
                    : "border-border-default bg-surface-panel hover:border-border-subtle"
                }`}
              >
                <div className="text-xs font-semibold text-text-primary">
                  #{p.id} {p.name}
                </div>
                <div className="text-[10px] text-text-secondary mt-0.5">{p.hint}</div>
              </button>
            );
          })}
        </div>
      </div>

      <Textarea
        label="Resolution / Inventive Idea"
        value={local.resolution}
        onChange={(e) => update({ resolution: e.target.value })}
        rows={4}
        placeholder="How does applying these principles resolve the contradiction?"
      />
    </div>
  );
}
