"use client";

import { useState } from "react";
import { CK_PROMPTS } from "@/lib/constants";
import { Card, Textarea } from "@/components/ui";
import { useFrameworkCoach } from "@/hooks/useFrameworkCoach";
import { AICoachPanel } from "./AICoachPanel";
import type { CKData } from "@/lib/types";

interface CKWorksheetProps {
  data?: CKData;
  onChange?: (data: CKData) => void;
}

export function CKWorksheet({ data, onChange }: CKWorksheetProps) {
  const [local, setLocal] = useState<CKData>(
    data ?? { concepts: "", knowledge: "", opportunity: "" }
  );
  const { coach, coaching, loading, error, clearCoaching } = useFrameworkCoach();

  function update(partial: Partial<CKData>) {
    const next = { ...local, ...partial };
    setLocal(next);
    onChange?.(next);
  }

  function handleCoach() {
    const focusArea = !local.concepts && !local.knowledge
      ? "concepts"
      : !local.opportunity
        ? "opportunity"
        : "opportunity";

    coach({
      framework: "ck",
      worksheetState: {
        concepts: local.concepts,
        knowledge: local.knowledge,
        opportunity: local.opportunity,
      },
      focusArea,
      previousCoaching: coaching ? JSON.stringify(coaching.questions.slice(0, 2)) : null,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-serif font-bold text-ink mb-1">C-K Theory Worksheet</h2>
        <p className="text-sm text-neutral-dark">
          Map the boundary between what you can <em>imagine</em> (Concept space) and what you <em>know</em> (Knowledge space).
          The gaps between them are your patent opportunities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Concept space */}
        <Card borderColor="#C69214">
          <h3 className="text-sm font-medium text-blue-ribbon mb-1">Concept Space (C)</h3>
          <p className="text-xs text-neutral-dark mb-3 italic">{CK_PROMPTS.concept}</p>
          <Textarea
            value={local.concepts}
            onChange={(e) => update({ concepts: e.target.value })}
            rows={6}
            placeholder="List bold ideas you can imagine but can't yet prove..."
          />
        </Card>

        {/* Knowledge space */}
        <Card borderColor="#3b82f6">
          <h3 className="text-sm font-medium text-blue-400 mb-1">Knowledge Space (K)</h3>
          <p className="text-xs text-neutral-dark mb-3 italic">{CK_PROMPTS.knowledge}</p>
          <Textarea
            value={local.knowledge}
            onChange={(e) => update({ knowledge: e.target.value })}
            rows={6}
            placeholder="What's proven? What's emerging? What are the gaps?"
          />
        </Card>
      </div>

      {/* AI Coach */}
      <AICoachPanel
        coaching={coaching}
        loading={loading}
        error={error}
        onCoach={handleCoach}
        onClear={clearCoaching}
      />

      {/* Expansion / opportunity */}
      <Card borderColor="#10b981">
        <h3 className="text-sm font-medium text-green-400 mb-1">Patent Opportunity (C-K Expansion)</h3>
        <p className="text-xs text-neutral-dark mb-3 italic">{CK_PROMPTS.expansion}</p>
        <Textarea
          value={local.opportunity}
          onChange={(e) => update({ opportunity: e.target.value })}
          rows={4}
          placeholder="Where do concepts meet knowledge gaps? Describe the inventive opportunity..."
        />
      </Card>
    </div>
  );
}
