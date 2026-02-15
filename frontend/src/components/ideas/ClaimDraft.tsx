"use client";

import { useState } from "react";
import type { ClaimDraft as ClaimDraftType } from "@/lib/types";
import { Card, Button } from "@/components/ui";

interface ClaimDraftProps {
  claims: ClaimDraftType;
  onRegenerate?: () => void;
  loading?: boolean;
}

function ClaimSection({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{title}</h4>
        <button
          onClick={copy}
          className="text-[10px] text-text-muted hover:text-accent-gold transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono bg-surface-deep rounded-lg p-3 border border-border-default">
        {text || "Not generated yet."}
      </pre>
    </div>
  );
}

export function ClaimDraftDisplay({ claims, onRegenerate, loading }: ClaimDraftProps) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Claim Skeletons</h3>
        {onRegenerate && (
          <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={loading}>
            {loading ? "Generating..." : "Regenerate"}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <ClaimSection title="Method Claim" text={claims.methodClaim} />
        <ClaimSection title="System Claim" text={claims.systemClaim} />
        <ClaimSection title="Computer-Readable Medium Claim" text={claims.crmClaim} />
      </div>

      {claims.notes && (
        <div className="mt-4 pt-3 border-t border-border-default">
          <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Strategy Notes</h4>
          <p className="text-xs text-text-secondary">{claims.notes}</p>
        </div>
      )}
    </Card>
  );
}
