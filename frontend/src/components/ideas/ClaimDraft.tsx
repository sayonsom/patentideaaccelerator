"use client";

import { useState } from "react";
import type { ClaimDraft as ClaimDraftType, ClaimDependentClaim } from "@/lib/types";
import { Card, Button, Badge } from "@/components/ui";

interface ClaimDraftProps {
  claims: ClaimDraftType;
  onRegenerate?: () => void;
  loading?: boolean;
}

function ClaimSection({
  title,
  independentClaim,
  dependentClaims,
}: {
  title: string;
  independentClaim: string;
  dependentClaims?: ClaimDependentClaim[];
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  function copyAll() {
    const depText =
      dependentClaims && dependentClaims.length > 0
        ? "\n\n" + dependentClaims.map((d) => d.text).join("\n\n")
        : "";
    navigator.clipboard.writeText(independentClaim + depText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-off-white hover:bg-neutral-off-white/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-medium text-ink uppercase tracking-wider">{title}</h4>
          {dependentClaims && dependentClaims.length > 0 && (
            <Badge variant="outline" size="sm">
              +{dependentClaims.length} dependent
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyAll();
            }}
            className="text-[10px] text-text-muted hover:text-blue-ribbon transition-colors px-2 py-0.5 rounded hover:bg-white"
          >
            {copied ? "Copied!" : "Copy All"}
          </button>
          <svg
            className={`w-3.5 h-3.5 text-text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-3">
          {/* Independent claim */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[10px] font-normal text-blue-ribbon uppercase tracking-wider">Independent</span>
            </div>
            <pre className="text-xs text-neutral-dark whitespace-pre-wrap font-mono bg-white rounded-lg p-3 border border-border leading-relaxed">
              {independentClaim || "Not generated yet."}
            </pre>
          </div>

          {/* Dependent claims */}
          {dependentClaims && dependentClaims.length > 0 && (
            <div>
              <span className="text-[10px] font-normal text-text-muted uppercase tracking-wider">Dependent Claims</span>
              <div className="mt-1.5 space-y-2">
                {dependentClaims.map((dep) => (
                  <pre
                    key={dep.claimNumber}
                    className="text-xs text-neutral-dark whitespace-pre-wrap font-mono bg-neutral-off-white rounded-lg p-3 border border-border/50 leading-relaxed"
                  >
                    {dep.text}
                  </pre>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ClaimDraftDisplay({ claims, onRegenerate, loading }: ClaimDraftProps) {
  const [showStrategy, setShowStrategy] = useState(false);
  const [showProsecution, setShowProsecution] = useState(false);

  const totalClaims =
    1 +
    (claims.methodDependentClaims?.length ?? 0) +
    1 +
    (claims.systemDependentClaims?.length ?? 0) +
    1 +
    (claims.crmDependentClaims?.length ?? 0);

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-ink">Patent Claim Set</h3>
            <Badge variant="solid" color="blue">
              {totalClaims} claims
            </Badge>
          </div>
          {onRegenerate && (
            <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={loading}>
              {loading ? "Generating..." : "Regenerate"}
            </Button>
          )}
        </div>

        {/* Claim sections */}
        <div className="space-y-3">
          <ClaimSection
            title="Method Claims"
            independentClaim={claims.methodClaim}
            dependentClaims={claims.methodDependentClaims}
          />
          <ClaimSection
            title="System Claims"
            independentClaim={claims.systemClaim}
            dependentClaims={claims.systemDependentClaims}
          />
          <ClaimSection
            title="Computer-Readable Medium Claims"
            independentClaim={claims.crmClaim}
            dependentClaims={claims.crmDependentClaims}
          />
        </div>
      </Card>

      {/* Abstract */}
      {claims.abstractText && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">Patent Abstract</h4>
            <CopyButton text={claims.abstractText} />
          </div>
          <p className="text-xs text-neutral-dark leading-relaxed">{claims.abstractText}</p>
        </Card>
      )}

      {/* Alice Mitigation */}
      {claims.aliceMitigationNotes && (
        <Card>
          <div className="rounded-lg bg-green-50 border border-green-200 p-3">
            <h4 className="text-[10px] font-medium text-green-700 uppercase tracking-wider mb-1.5">
              Alice / 101 Defense Strategy
            </h4>
            <p className="text-xs text-neutral-dark leading-relaxed">{claims.aliceMitigationNotes}</p>
          </div>
        </Card>
      )}

      {/* Claim Strategy (collapsible) */}
      {claims.claimStrategy && (
        <Card>
          <button
            onClick={() => setShowStrategy(!showStrategy)}
            className="w-full flex items-center justify-between"
          >
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">Claim Strategy</h4>
            <svg
              className={`w-3.5 h-3.5 text-text-muted transition-transform ${showStrategy ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showStrategy && (
            <p className="text-xs text-neutral-dark leading-relaxed mt-3 whitespace-pre-wrap">
              {claims.claimStrategy}
            </p>
          )}
        </Card>
      )}

      {/* Prosecution Tips (collapsible) */}
      {claims.prosecutionTips && claims.prosecutionTips.length > 0 && (
        <Card>
          <button
            onClick={() => setShowProsecution(!showProsecution)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">Prosecution Tips</h4>
              <Badge variant="outline" size="sm">{claims.prosecutionTips.length}</Badge>
            </div>
            <svg
              className={`w-3.5 h-3.5 text-text-muted transition-transform ${showProsecution ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showProsecution && (
            <ol className="mt-3 space-y-2">
              {claims.prosecutionTips.map((tip, i) => (
                <li key={i} className="text-xs text-neutral-dark flex items-start gap-2">
                  <span className="text-blue-ribbon font-normal shrink-0">{i + 1}.</span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}

      {/* Summary notes */}
      {claims.notes && (
        <div className="px-1">
          <p className="text-[10px] text-text-muted italic">{claims.notes}</p>
        </div>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="text-[10px] text-text-muted hover:text-blue-ribbon transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
