"use client";

import type { InventiveStepAnalysis } from "@/lib/types";
import { Card } from "@/components/ui";

interface InventiveStepCardProps {
  analysis: InventiveStepAnalysis;
}

export function InventiveStepCard({ analysis }: InventiveStepCardProps) {
  return (
    <Card>
      <h3 className="text-sm font-medium text-ink mb-4">
        Inventive Step Analysis
      </h3>

      <div className="space-y-4">
        {/* Primary Inventive Step - highlighted */}
        <div className="rounded-lg bg-accent-light border border-blue-ribbon/20 p-3">
          <h4 className="text-[10px] font-medium text-blue-ribbon uppercase tracking-wider mb-1">
            Primary Inventive Step
          </h4>
          <p className="text-sm text-ink font-normal">
            {analysis.primaryInventiveStep}
          </p>
        </div>

        {/* Secondary Steps */}
        {analysis.secondarySteps?.length > 0 && (
          <Section title="Secondary Inventive Steps">
            <ul className="space-y-1.5">
              {analysis.secondarySteps.map((step, i) => (
                <li
                  key={i}
                  className="text-xs text-neutral-dark flex items-start gap-1.5"
                >
                  <span className="text-blue-ribbon shrink-0 mt-0.5">
                    {"\u2022"}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Non-Obviousness Argument */}
        <Section title="Non-Obviousness Argument">
          <p className="text-xs text-neutral-dark">
            {analysis.nonObviousnessArgument}
          </p>
        </Section>

        {/* Closest Prior Art */}
        {analysis.closestPriorArt?.length > 0 && (
          <Section title="Closest Prior Art">
            <ul className="space-y-1">
              {analysis.closestPriorArt.map((art, i) => (
                <li key={i} className="text-xs text-neutral-dark flex items-start gap-1.5">
                  <span className="text-text-muted shrink-0">{i + 1}.</span>
                  {art}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Differentiating Factors */}
        {analysis.differentiatingFactors?.length > 0 && (
          <Section title="Differentiating Factors">
            <ul className="space-y-1">
              {analysis.differentiatingFactors.map((factor, i) => (
                <li
                  key={i}
                  className="text-xs text-neutral-dark flex items-start gap-1.5"
                >
                  <span className="text-green-600 shrink-0 mt-0.5">
                    {"\u2713"}
                  </span>
                  {factor}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Technical Advantage */}
        <Section title="Technical Advantage">
          <p className="text-xs text-neutral-dark">{analysis.technicalAdvantage}</p>
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
