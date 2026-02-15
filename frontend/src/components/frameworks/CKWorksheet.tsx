"use client";

import { useState } from "react";
import { CK_PROMPTS } from "@/lib/constants";
import { Card, Textarea } from "@/components/ui";
import type { CKData } from "@/lib/types";

interface CKWorksheetProps {
  data?: CKData;
  onChange?: (data: CKData) => void;
}

export function CKWorksheet({ data, onChange }: CKWorksheetProps) {
  const [local, setLocal] = useState<CKData>(
    data ?? { concepts: "", knowledge: "", opportunity: "" }
  );

  function update(partial: Partial<CKData>) {
    const next = { ...local, ...partial };
    setLocal(next);
    onChange?.(next);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-text-primary mb-1">C-K Theory Worksheet</h2>
        <p className="text-sm text-text-secondary">
          Map the boundary between what you can <em>imagine</em> (Concept space) and what you <em>know</em> (Knowledge space).
          The gaps between them are your patent opportunities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Concept space */}
        <Card borderColor="#C69214">
          <h3 className="text-sm font-semibold text-accent-gold mb-1">Concept Space (C)</h3>
          <p className="text-xs text-text-secondary mb-3 italic">{CK_PROMPTS.concept}</p>
          <Textarea
            value={local.concepts}
            onChange={(e) => update({ concepts: e.target.value })}
            rows={6}
            placeholder="List bold ideas you can imagine but can't yet prove..."
          />
        </Card>

        {/* Knowledge space */}
        <Card borderColor="#3b82f6">
          <h3 className="text-sm font-semibold text-blue-400 mb-1">Knowledge Space (K)</h3>
          <p className="text-xs text-text-secondary mb-3 italic">{CK_PROMPTS.knowledge}</p>
          <Textarea
            value={local.knowledge}
            onChange={(e) => update({ knowledge: e.target.value })}
            rows={6}
            placeholder="What's proven? What's emerging? What are the gaps?"
          />
        </Card>
      </div>

      {/* Expansion / opportunity */}
      <Card borderColor="#10b981">
        <h3 className="text-sm font-semibold text-green-400 mb-1">Patent Opportunity (C-K Expansion)</h3>
        <p className="text-xs text-text-secondary mb-3 italic">{CK_PROMPTS.expansion}</p>
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
