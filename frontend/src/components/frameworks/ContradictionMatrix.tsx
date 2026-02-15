"use client";

import { useState } from "react";
import {
  SOFTWARE_PARAMETERS,
  lookupContradiction,
  getParameterById,
  getParametersByCategory,
} from "@/lib/software-principles";
import { Card, Select, Button } from "@/components/ui";
import type { SoftwareInventivePrinciple, ParameterCategory } from "@/lib/types";

const CATEGORY_LABELS: Record<ParameterCategory, string> = {
  performance: "Performance",
  scale: "Scale",
  reliability: "Reliability",
  security: "Security",
  product: "Product",
  engineering: "Engineering",
  operations: "Operations",
  ai_ml: "AI / ML",
  data: "Data",
  integration: "Integration",
  architecture: "Architecture",
};

const CATEGORY_ORDER: ParameterCategory[] = [
  "performance", "scale", "reliability", "security", "data",
  "architecture", "engineering", "operations", "ai_ml", "product", "integration",
];

function buildSelectOptions() {
  const grouped = getParametersByCategory();
  return CATEGORY_ORDER.flatMap((cat) => {
    const params = grouped[cat] ?? [];
    return params.map((p) => ({
      value: String(p.id),
      label: p.name,
      group: CATEGORY_LABELS[cat],
    }));
  });
}

export function ContradictionMatrix() {
  const [improvingId, setImprovingId] = useState<number | null>(null);
  const [worseningId, setWorseningId] = useState<number | null>(null);

  const selectOptions = buildSelectOptions();

  const principles: SoftwareInventivePrinciple[] =
    improvingId && worseningId ? lookupContradiction(improvingId, worseningId) : [];

  const improvingParam = improvingId ? getParameterById(improvingId) : null;
  const worseningParam = worseningId ? getParameterById(worseningId) : null;

  function swap() {
    setImprovingId(worseningId);
    setWorseningId(improvingId);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-text-primary mb-1">Software Contradiction Matrix</h2>
        <p className="text-sm text-text-secondary">
          Select the parameter you want to <strong className="text-green-400">improve</strong> and the parameter
          that <strong className="text-red-400">worsens</strong> as a result. The matrix suggests inventive principles
          tailored to software engineering.
        </p>
      </div>

      {/* Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-green-400 mb-1.5">
            Improving Parameter
          </label>
          <Select
            value={improvingId ? String(improvingId) : ""}
            onChange={(val) => setImprovingId(val ? Number(val) : null)}
            options={selectOptions}
            placeholder="Select parameter..."
          />
          {improvingParam && (
            <p className="text-xs text-text-muted mt-1">{improvingParam.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-red-400 mb-1.5">
            Worsening Parameter
          </label>
          <Select
            value={worseningId ? String(worseningId) : ""}
            onChange={(val) => setWorseningId(val ? Number(val) : null)}
            options={selectOptions}
            placeholder="Select parameter..."
          />
          {worseningParam && (
            <p className="text-xs text-text-muted mt-1">{worseningParam.description}</p>
          )}
        </div>
      </div>

      {/* Swap button */}
      {improvingId && worseningId && (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={swap}>
            {"\u21C4"} Swap Parameters
          </Button>
        </div>
      )}

      {/* Trade-off display */}
      {improvingParam && worseningParam && (
        <Card borderColor="#C69214">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Trade-off</h3>
          <p className="text-xs text-text-secondary">
            Improving <span className="text-green-400 font-medium">{improvingParam.name}</span>
            {" "}typically worsens{" "}
            <span className="text-red-400 font-medium">{worseningParam.name}</span>.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-text-muted">Example: </span>
              <span className="text-text-secondary">{improvingParam.exampleTradeoff}</span>
            </div>
            <div>
              <span className="text-text-muted">Example: </span>
              <span className="text-text-secondary">{worseningParam.exampleTradeoff}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {improvingId && worseningId && principles.length === 0 && (
        <Card>
          <div className="text-center py-4">
            <p className="text-sm text-text-secondary">
              No specific principles mapped for this combination yet.
            </p>
            <p className="text-xs text-text-muted mt-1">
              Try exploring similar parameters or consult the TRIZ worksheet for general principles.
            </p>
          </div>
        </Card>
      )}

      {principles.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Suggested Inventive Principles ({principles.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {principles.map((p) => (
              <Card key={p.id} hover>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-gold/10 text-accent-gold text-sm font-bold shrink-0">
                    {p.id}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{p.name}</h4>
                    <p className="text-xs text-text-secondary mt-0.5">{p.description}</p>
                    {p.softwareExamples.length > 0 && (
                      <div className="mt-2">
                        <span className="text-[10px] text-text-muted font-medium uppercase">Software Examples:</span>
                        <ul className="mt-1 space-y-0.5">
                          {p.softwareExamples.map((ex, i) => (
                            <li key={i} className="text-xs text-text-secondary flex items-start gap-1">
                              <span className="text-accent-gold shrink-0">{"\u2022"}</span>
                              {ex}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick reference: all parameters */}
      <details className="group">
        <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary">
          Show all {SOFTWARE_PARAMETERS.length} parameters
        </summary>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
          {SOFTWARE_PARAMETERS.map((p) => (
            <div
              key={p.id}
              className="text-[10px] text-text-secondary px-2 py-1 rounded bg-surface-deep"
            >
              <span className="text-text-muted font-mono mr-1">{p.id}.</span>
              {p.name}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
