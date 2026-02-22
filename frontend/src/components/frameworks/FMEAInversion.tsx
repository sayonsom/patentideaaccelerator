"use client";

import { useState } from "react";
import { Card, Button, Input, Textarea } from "@/components/ui";
import { useFrameworkCoach } from "@/hooks/useFrameworkCoach";
import { AICoachPanel } from "./AICoachPanel";
import type { FMEAEntry } from "@/lib/types";
import { uid } from "@/lib/utils";

interface FMEAInversionProps {
  data?: FMEAEntry[];
  onChange?: (data: FMEAEntry[]) => void;
}

function blankEntry(): FMEAEntry {
  return {
    id: uid(),
    failureMode: "",
    effect: "",
    severity: 5,
    novelMitigation: "",
    patentCandidate: false,
  };
}

export function FMEAInversion({ data, onChange }: FMEAInversionProps) {
  const [entries, setEntries] = useState<FMEAEntry[]>(
    data && data.length > 0 ? data : [blankEntry()]
  );
  const { coach, coaching, loading, error, clearCoaching } = useFrameworkCoach();

  function updateEntries(next: FMEAEntry[]) {
    setEntries(next);
    onChange?.(next);
  }

  function updateEntry(id: string, partial: Partial<FMEAEntry>) {
    updateEntries(entries.map((e) => (e.id === id ? { ...e, ...partial } : e)));
  }

  function addEntry() {
    updateEntries([...entries, blankEntry()]);
  }

  function removeEntry(id: string) {
    if (entries.length <= 1) return;
    updateEntries(entries.filter((e) => e.id !== id));
  }

  function handleCoach() {
    const hasAnyMitigation = entries.some((e) => e.novelMitigation.trim());
    const focusArea = entries.every((e) => !e.failureMode.trim())
      ? "failure-modes"
      : !hasAnyMitigation
        ? "mitigations"
        : "patent-candidates";

    coach({
      framework: "fmea",
      worksheetState: {
        entries: entries.map((e) => ({
          failureMode: e.failureMode,
          effect: e.effect,
          severity: e.severity,
          novelMitigation: e.novelMitigation,
          patentCandidate: e.patentCandidate,
        })),
      },
      focusArea,
      previousCoaching: coaching ? JSON.stringify(coaching.questions.slice(0, 2)) : null,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-serif font-bold text-ink mb-1">FMEA Inversion</h2>
        <p className="text-sm text-neutral-dark">
          List failure modes in your system. For each one, invent a novel mitigation.
          High-severity failures with novel mitigations are strong patent candidates.
        </p>
      </div>

      {/* AI Coach */}
      <AICoachPanel
        coaching={coaching}
        loading={loading}
        error={error}
        onCoach={handleCoach}
        onClear={clearCoaching}
      />

      <div className="space-y-4">
        {entries.map((entry, i) => (
          <Card key={entry.id}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-ink">Failure #{i + 1}</h3>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={entry.patentCandidate}
                    onChange={(e) => updateEntry(entry.id, { patentCandidate: e.target.checked })}
                    className="rounded border-border bg-white text-blue-ribbon focus:ring-blue-ribbon/40"
                  />
                  <span className="text-xs text-blue-ribbon font-normal">Patent candidate</span>
                </label>
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="text-text-muted hover:text-red-400 text-xs"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <Input
                label="Failure Mode"
                value={entry.failureMode}
                onChange={(e) => updateEntry(entry.id, { failureMode: e.target.value })}
                placeholder="What can go wrong?"
              />
              <Input
                label="Effect"
                value={entry.effect}
                onChange={(e) => updateEntry(entry.id, { effect: e.target.value })}
                placeholder="What happens when it fails?"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-normal text-neutral-dark mb-1">
                Severity: {entry.severity}/10
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={entry.severity}
                onChange={(e) => updateEntry(entry.id, { severity: Number(e.target.value) })}
                className="w-full accent-blue-ribbon"
              />
            </div>

            <Textarea
              label="Novel Mitigation (Inventive Solution)"
              value={entry.novelMitigation}
              onChange={(e) => updateEntry(entry.id, { novelMitigation: e.target.value })}
              rows={3}
              placeholder="How would you solve this in a way nobody has before?"
            />
          </Card>
        ))}
      </div>

      <Button variant="secondary" onClick={addEntry}>
        + Add Failure Mode
      </Button>
    </div>
  );
}
