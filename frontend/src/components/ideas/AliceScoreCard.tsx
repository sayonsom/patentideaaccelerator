"use client";

import type { AliceScore } from "@/lib/types";
import { Badge, Card } from "@/components/ui";
import { getAliceRiskColor } from "@/lib/utils";

interface AliceScoreCardProps {
  score: AliceScore;
}

function ScoreGauge({ value }: { value: number }) {
  const color =
    value >= 70 ? "#10b981" : value >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-32 h-16 mx-auto mb-2">
      {/* Background arc */}
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <path
          d="M 10 55 A 50 50 0 0 1 110 55"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 10 55 A 50 50 0 0 1 110 55"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 157} 157`}
        />
      </svg>
      <div className="absolute inset-0 flex items-end justify-center pb-0">
        <span className="text-2xl font-semibold text-ink">{value}</span>
        <span className="text-xs text-text-muted ml-0.5 mb-1">/100</span>
      </div>
    </div>
  );
}

export function AliceScoreCard({ score }: AliceScoreCardProps) {
  return (
    <Card>
      <h3 className="text-sm font-medium text-ink mb-4 text-center">
        Alice / Section 101 Score
      </h3>

      <ScoreGauge value={score.overallScore} />

      <div className="flex justify-center mb-4">
        <Badge variant="solid" color={getAliceRiskColor(score.abstractIdeaRisk)}>
          {score.abstractIdeaRisk} risk
        </Badge>
      </div>

      <div className="space-y-3">
        <Section title="Abstract Idea Risk">
          <p className="text-xs text-neutral-dark">{score.abstractIdeaAnalysis}</p>
        </Section>

        <Section title="Practical Application">
          <p className="text-xs text-neutral-dark">{score.practicalApplication}</p>
        </Section>

        <Section title="Inventive Concept">
          <p className="text-xs text-neutral-dark">{score.inventiveConcept}</p>
        </Section>

        {score.recommendations.length > 0 && (
          <Section title="Recommendations">
            <ul className="space-y-1">
              {score.recommendations.map((rec, i) => (
                <li key={i} className="text-xs text-neutral-dark flex items-start gap-1">
                  <span className="text-blue-ribbon shrink-0">{"\u2022"}</span>
                  {rec}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {score.comparableCases.length > 0 && (
          <Section title="Comparable Cases">
            <ul className="space-y-1">
              {score.comparableCases.map((c, i) => (
                <li key={i} className="text-xs text-neutral-dark italic">{c}</li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">{title}</h4>
      {children}
    </div>
  );
}
