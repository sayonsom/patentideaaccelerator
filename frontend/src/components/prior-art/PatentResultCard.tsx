"use client";

import type { PatentResult } from "@/lib/types";
import { Card, Badge } from "@/components/ui";
import { truncate } from "@/lib/utils";

interface PatentResultCardProps {
  result: PatentResult;
}

export function PatentResultCard({ result }: PatentResultCardProps) {
  return (
    <Card hover>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-ink mb-1">
            {result.title || "Untitled Patent"}
          </h3>
          <p className="text-xs text-text-muted font-mono mb-2">
            {result.patentNumber}
          </p>
          {result.abstract && (
            <p className="text-xs text-neutral-dark mb-2">
              {truncate(result.abstract, 200)}
            </p>
          )}
          <div className="flex items-center gap-3 text-[10px] text-text-muted">
            {result.filingDate && <span>Filed: {result.filingDate}</span>}
            {result.grantDate && <span>Granted: {result.grantDate}</span>}
          </div>
          {result.cpcClasses.length > 0 && (
            <div className="flex gap-1 mt-2">
              {result.cpcClasses.map((c) => (
                <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
              ))}
            </div>
          )}
        </div>
        {result.url && (
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs text-blue-ribbon hover:underline"
          >
            View
          </a>
        )}
      </div>
    </Card>
  );
}
