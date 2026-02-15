"use client";

import Link from "next/link";
import type { Idea } from "@/lib/types";
import { Badge } from "@/components/ui";
import { getTotalScore, getScoreVerdict, getStatusColor, timeAgo, truncate } from "@/lib/utils";

interface IdeaCardProps {
  idea: Idea;
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  developing: "Developing",
  scored: "Scored",
  filed: "Filed",
  archived: "Archived",
};

function ScoreMatrix({ idea }: { idea: Idea }) {
  const score = idea.score;
  const cells = [
    { row: 0, col: 0, key: "inventiveStep" as const },
    { row: 0, col: 1, key: "defensibility" as const },
    { row: 0, col: 2, key: "productFit" as const },
  ];

  if (!score) {
    return (
      <div className="grid grid-cols-3 gap-0.5 w-8 h-8">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-[2px] bg-border-subtle" />
        ))}
      </div>
    );
  }

  // 3x3 matrix: rows = score levels (3,2,1 from top), cols = dimensions
  return (
    <div className="grid grid-cols-3 gap-0.5 w-8 h-8" title={`Score: ${getTotalScore(score)}/9`}>
      {[3, 2, 1].map((level) =>
        cells.map((cell) => {
          const val = score[cell.key];
          const active = val >= level;
          return (
            <div
              key={`${level}-${cell.key}`}
              className={`rounded-[2px] ${
                active ? "bg-accent-gold" : "bg-border-subtle"
              }`}
            />
          );
        })
      )}
    </div>
  );
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const total = getTotalScore(idea.score);
  const verdict = idea.score ? getScoreVerdict(total) : null;

  return (
    <Link href={`/ideas/${idea.id}`} className="block group">
      <div className="rounded-xl border border-border-default bg-surface-panel p-4 hover:border-accent-gold/40 transition-colors">
        {/* Top row: status + score matrix */}
        <div className="flex items-start justify-between mb-3">
          <Badge variant="solid" color={getStatusColor(idea.status)}>
            {statusLabels[idea.status] ?? idea.status}
          </Badge>
          <ScoreMatrix idea={idea} />
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-text-primary mb-1 group-hover:text-accent-gold transition-colors line-clamp-2">
          {idea.title || "Untitled Idea"}
        </h3>

        {/* Problem snippet */}
        {idea.problemStatement && (
          <p className="text-xs text-text-secondary mb-3 line-clamp-2">
            {truncate(idea.problemStatement, 120)}
          </p>
        )}

        {/* Alice score badge */}
        {idea.aliceScore && (
          <div className="mb-3">
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                idea.aliceScore.abstractIdeaRisk === "low"
                  ? "bg-green-900/30 text-green-400"
                  : idea.aliceScore.abstractIdeaRisk === "medium"
                  ? "bg-yellow-900/30 text-yellow-400"
                  : "bg-red-900/30 text-red-400"
              }`}
            >
              Alice: {idea.aliceScore.overallScore}/100
            </span>
          </div>
        )}

        {/* Framework tag */}
        {idea.frameworkUsed !== "none" && (
          <Badge variant="outline" className="mb-3 text-xs">
            {idea.frameworkUsed.toUpperCase()}
          </Badge>
        )}

        {/* Bottom: tags + timestamp */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border-subtle">
          <div className="flex gap-1 overflow-hidden">
            {idea.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] text-text-muted bg-surface-deep px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
            {idea.tags.length > 3 && (
              <span className="text-[10px] text-text-muted">+{idea.tags.length - 3}</span>
            )}
          </div>
          <span className="text-[10px] text-text-muted shrink-0">{timeAgo(idea.updatedAt)}</span>
        </div>

        {/* Score verdict */}
        {verdict && (
          <div className="mt-2 text-[10px] font-medium" style={{ color: verdict.color }}>
            {verdict.label} ({total}/9)
          </div>
        )}
      </div>
    </Link>
  );
}
