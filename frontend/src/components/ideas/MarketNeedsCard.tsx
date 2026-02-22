"use client";

import type { MarketNeedsAnalysis } from "@/lib/types";
import { Badge, Card } from "@/components/ui";

interface MarketNeedsCardProps {
  analysis: MarketNeedsAnalysis;
}

export function MarketNeedsCard({ analysis }: MarketNeedsCardProps) {
  return (
    <Card>
      <h3 className="text-sm font-medium text-ink mb-4">
        Market Needs Analysis
      </h3>

      <div className="space-y-4">
        {/* Market Size - highlighted */}
        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
          <h4 className="text-[10px] font-medium text-green-700 uppercase tracking-wider mb-1">
            Market Size
          </h4>
          <p className="text-sm text-ink font-normal">{analysis.marketSize}</p>
        </div>

        {/* Target Segments as badges */}
        {analysis.targetSegments?.length > 0 && (
          <Section title="Target Segments">
            <div className="flex flex-wrap gap-1.5">
              {analysis.targetSegments.map((segment, i) => (
                <Badge key={i} variant="outline" color="#2F7F9D">
                  {segment}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Pain Points Solved */}
        {analysis.painPointsSolved?.length > 0 && (
          <Section title="Pain Points Solved">
            <ul className="space-y-1.5">
              {analysis.painPointsSolved.map((pain, i) => (
                <li
                  key={i}
                  className="text-xs text-neutral-dark flex items-start gap-1.5"
                >
                  <span className="text-orange-500 shrink-0 mt-0.5">
                    {"\u26A0"}
                  </span>
                  {pain}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Competitive Landscape */}
        <Section title="Competitive Landscape">
          <p className="text-xs text-neutral-dark">
            {analysis.competitiveLandscape}
          </p>
        </Section>

        {/* Commercialization Potential */}
        <Section title="Commercialization Potential">
          <p className="text-xs text-neutral-dark">
            {analysis.commercializationPotential}
          </p>
        </Section>

        {/* Licensing Opportunities */}
        {analysis.licensingOpportunities?.length > 0 && (
          <Section title="Licensing Opportunities">
            <ul className="space-y-1">
              {analysis.licensingOpportunities.map((opp, i) => (
                <li
                  key={i}
                  className="text-xs text-neutral-dark flex items-start gap-1.5"
                >
                  <span className="text-blue-ribbon shrink-0">{"\u2022"}</span>
                  {opp}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Strategic Value */}
        <Section title="Strategic Value">
          <p className="text-xs text-neutral-dark">{analysis.strategicValue}</p>
        </Section>
      </div>
    </Card>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">
        {title}
      </h4>
      {children}
    </div>
  );
}
