"use client";

import { useState } from "react";
import { TRIZ_PRINCIPLES } from "@/lib/constants";
import { Textarea } from "@/components/ui";
import { useFrameworkCoach } from "@/hooks/useFrameworkCoach";
import { AICoachPanel } from "./AICoachPanel";
import type { TRIZData } from "@/lib/types";

interface TRIZWorksheetProps {
  data?: TRIZData;
  onChange?: (data: TRIZData) => void;
}

export function TRIZWorksheet({ data, onChange }: TRIZWorksheetProps) {
  const [local, setLocal] = useState<TRIZData>(
    data ?? { improving: "", worsening: "", principles: [], resolution: "" }
  );
  const { coach, coaching, loading, error, clearCoaching } = useFrameworkCoach();

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

  function handleCoach() {
    const focusArea = !local.improving && !local.worsening
      ? "contradiction"
      : local.principles.length === 0
        ? "principles"
        : "resolution";

    coach({
      framework: "triz",
      worksheetState: {
        improving: local.improving,
        worsening: local.worsening,
        selectedPrinciples: local.principles.map((id) => {
          const p = TRIZ_PRINCIPLES.find((pr) => pr.id === id);
          return p ? `#${p.id} ${p.name}` : `#${id}`;
        }),
        resolution: local.resolution,
      },
      focusArea,
      previousCoaching: coaching ? JSON.stringify(coaching.questions.slice(0, 2)) : null,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-serif font-bold text-ink mb-1">TRIZ Worksheet</h2>
        <p className="text-sm text-neutral-dark">
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

      {/* AI Coach */}
      <AICoachPanel
        coaching={coaching}
        loading={loading}
        error={error}
        onCoach={handleCoach}
        onClear={clearCoaching}
      />

      <div>
        <h3 className="text-sm font-medium text-ink mb-3">Select Applicable Principles</h3>
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
                    ? "border-blue-ribbon bg-accent-light"
                    : "border-border bg-neutral-off-white hover:border-border-subtle"
                }`}
              >
                <div className="text-xs font-normal text-ink">
                  #{p.id} {p.name}
                </div>
                <div className="text-[10px] text-neutral-dark mt-0.5">{p.hint}</div>
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
