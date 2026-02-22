"use client";

import Link from "next/link";
import type { Idea } from "@/lib/types";
import { Badge } from "@/components/ui";
import { getTotalScore, getScoreVerdict, getStatusColor, timeAgo, truncate, getIdeaProgress } from "@/lib/utils";

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
                active ? "bg-blue-ribbon" : "bg-border-subtle"
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

  const progress = getIdeaProgress(idea);

  return (
    <Link href={`/ideas/${idea.id}`} className="block group">
      <div className="rounded-xl border border-border bg-neutral-off-white p-4 hover:border-blue-ribbon/40 transition-colors">
        {/* Top row: status + score matrix */}
        <div className="flex items-start justify-between mb-3">
          <Badge variant="solid" color={getStatusColor(idea.status)}>
            {statusLabels[idea.status] ?? idea.status}
          </Badge>
          <ScoreMatrix idea={idea} />
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-ink mb-1 group-hover:text-blue-ribbon transition-colors line-clamp-2">
          {idea.title || "Untitled Idea"}
        </h3>

        {/* Problem snippet */}
        {idea.problemStatement && (
          <p className="text-xs text-neutral-dark mb-3 line-clamp-2">
            {truncate(idea.problemStatement, 120)}
          </p>
        )}

        {/* Alice score badge */}
        {idea.aliceScore && (
          <div className="mb-3">
            <span
              className={`inline-flex items-center gap-1 text-xs font-normal px-2 py-0.5 rounded-full ${
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

        {/* Alignment score badge */}
        {idea.alignmentScores.length > 0 && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 text-xs font-normal px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400">
              Align: {(idea.alignmentScores.reduce((s, a) => s + a.score, 0) / idea.alignmentScores.length).toFixed(1)}/10
            </span>
          </div>
        )}

        {/* Framework tag */}
        {idea.frameworkUsed !== "none" && (
          <Badge variant="outline" className="mb-3 text-xs">
            {idea.frameworkUsed.toUpperCase()}
          </Badge>
        )}

        {/* Sprint badge */}
        {idea.sprintId && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-ribbon/10 text-blue-ribbon border border-blue-ribbon/20">
              &#9651; Sprint
            </span>
          </div>
        )}

        {/* Bottom: tags + timestamp */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border-subtle">
          <div className="flex gap-1 overflow-hidden">
            {idea.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] text-text-muted bg-white px-1.5 py-0.5 rounded">
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
          <div className="mt-2 text-[10px] font-normal" style={{ color: verdict.color }}>
            {verdict.label} ({total}/9)
          </div>
        )}

        {/* Pipeline progress bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1 bg-white rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress.percent}%`,
                background: progress.percent >= 87 ? "#10b981" : progress.percent >= 50 ? "#f59e0b" : "#6B7280",
              }}
            />
          </div>
          <span className="text-[10px] text-text-muted shrink-0">
            {progress.completed}/{progress.total}
          </span>
        </div>
      </div>
    </Link>
  );
}
