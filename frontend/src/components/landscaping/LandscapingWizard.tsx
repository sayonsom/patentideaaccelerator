"use client";

import { useState } from "react";
import type { LandscapingSession, TaxonomyCategory, LandscapingTaxonomy, PatentResult } from "@/lib/types";
import { updateLandscapingSessionAction, addLandscapingPatentsAction, clearLandscapingPatentsAction, getLandscapingSessionAction } from "@/lib/actions/landscaping";
import { useSettingsStore } from "@/lib/store";
import { TaxonomyEditor } from "./TaxonomyEditor";

interface LandscapingWizardProps {
  session: LandscapingSession;
  onSessionUpdate: (session: LandscapingSession) => void;
}

type WizardStep = "describe" | "taxonomy" | "search";

export function LandscapingWizard({ session, onSessionUpdate }: LandscapingWizardProps) {
  const provider = useSettingsStore((s) => s.provider);
  const getActiveKey = useSettingsStore((s) => s.getActiveKey);

  const [step, setStep] = useState<WizardStep>(
    session.status === "taxonomy_ready" || session.status === "searching"
      ? "taxonomy"
      : "describe"
  );
  const [techDesc, setTechDesc] = useState(session.techDescription);
  const [taxonomy, setTaxonomy] = useState<TaxonomyCategory[]>(session.taxonomy?.categories ?? []);
  const [generating, setGenerating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState("");
  const [error, setError] = useState("");

  const handleGenerateTaxonomy = async () => {
    setGenerating(true);
    setError("");
    try {
      // Save tech description first
      await updateLandscapingSessionAction(session.id, { techDescription: techDesc });

      const key = getActiveKey();
      const res = await fetch("/api/ai/landscaping-taxonomy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(key ? { "x-api-key": key, "x-ai-provider": provider } : {}),
        },
        body: JSON.stringify({ techDescription: techDesc }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate taxonomy");
      }

      const data = await res.json();
      const cats: TaxonomyCategory[] = data.categories;
      setTaxonomy(cats);

      // Save taxonomy to session
      const tax: LandscapingTaxonomy = {
        categories: cats,
        generatedAt: data.generatedAt,
      };
      const updated = await updateLandscapingSessionAction(session.id, {
        taxonomy: tax,
        status: "taxonomy_ready",
      });
      if (updated) onSessionUpdate(updated);
      setStep("taxonomy");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate taxonomy");
    } finally {
      setGenerating(false);
    }
  };

  const handleSearchPatents = async () => {
    setSearching(true);
    setError("");
    try {
      // Update status to searching
      await updateLandscapingSessionAction(session.id, { status: "searching" });

      // Clear previous patents
      await clearLandscapingPatentsAction(session.id);

      let totalAdded = 0;

      // Search for each taxonomy category
      for (let i = 0; i < taxonomy.length; i++) {
        const cat = taxonomy[i];
        setSearchProgress(`Searching category ${i + 1}/${taxonomy.length}: ${cat.label}...`);

        // Build search query from keywords
        const query = cat.keywords.slice(0, 3).join(" ");

        try {
          const res = await fetch("/api/patents/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query,
              cpcFilters: cat.cpcClasses,
              maxResults: 10,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const results: PatentResult[] = data.results ?? [];

            if (results.length > 0) {
              const count = await addLandscapingPatentsAction(
                session.id,
                results.map((r) => ({
                  patentNumber: r.patentNumber,
                  title: r.title,
                  abstract: r.abstract,
                  filingDate: r.filingDate ?? undefined,
                  cpcClasses: r.cpcClasses,
                  taxonomyBucket: cat.id,
                  relevanceScore: 0.5,
                }))
              );
              totalAdded += count;
            }
          }
        } catch {
          // Continue with next category even if one fails
        }
      }

      setSearchProgress(`Found ${totalAdded} patents across ${taxonomy.length} categories`);

      // Mark session as complete
      const updated = await getLandscapingSessionAction(session.id);
      if (updated) {
        const final = await updateLandscapingSessionAction(session.id, { status: "complete" });
        if (final) onSessionUpdate(final);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleSaveTaxonomy = async (cats: TaxonomyCategory[]) => {
    setTaxonomy(cats);
    const tax: LandscapingTaxonomy = {
      categories: cats,
      generatedAt: session.taxonomy?.generatedAt ?? new Date().toISOString(),
    };
    const updated = await updateLandscapingSessionAction(session.id, { taxonomy: tax });
    if (updated) onSessionUpdate(updated);
  };

  return (
    <div className="max-w-3xl">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {(["describe", "taxonomy", "search"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-border" />}
            <button
              onClick={() => {
                if (s === "describe") setStep("describe");
                if (s === "taxonomy" && taxonomy.length > 0) setStep("taxonomy");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                step === s
                  ? "bg-blue-ribbon text-white"
                  : s === "describe" || (s === "taxonomy" && taxonomy.length > 0)
                  ? "bg-neutral-100 text-text-secondary hover:text-ink"
                  : "bg-neutral-50 text-neutral-400"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                {i + 1}
              </span>
              {s === "describe" ? "Describe" : s === "taxonomy" ? "Taxonomy" : "Search"}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-danger">
          {error}
        </div>
      )}

      {/* Step 1: Describe */}
      {step === "describe" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Technology Description</label>
            <textarea
              value={techDesc}
              onChange={(e) => setTechDesc(e.target.value)}
              placeholder="Describe the technology area you want to analyze. Be specific about the technical domain, key methods, and application areas..."
              rows={6}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon resize-none"
            />
            <p className="text-[10px] text-text-secondary mt-1">
              The AI will generate a taxonomy of patent categories based on this description.
            </p>
          </div>
          <button
            onClick={handleGenerateTaxonomy}
            disabled={!techDesc.trim() || generating}
            className="px-4 py-2 text-sm bg-blue-ribbon text-white rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            {generating ? "Generating Taxonomy..." : "Generate Taxonomy →"}
          </button>
        </div>
      )}

      {/* Step 2: Taxonomy */}
      {step === "taxonomy" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-ink">
              Edit Taxonomy Categories ({taxonomy.length})
            </h3>
            <button
              onClick={handleGenerateTaxonomy}
              disabled={generating}
              className="text-xs text-blue-ribbon hover:underline"
            >
              Regenerate
            </button>
          </div>

          <TaxonomyEditor
            categories={taxonomy}
            onChange={handleSaveTaxonomy}
          />

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep("describe")}
              className="px-3 py-2 text-sm text-text-secondary hover:text-ink transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleSearchPatents}
              disabled={taxonomy.length === 0 || searching}
              className="px-4 py-2 text-sm bg-blue-ribbon text-white rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50"
            >
              {searching ? searchProgress || "Searching..." : "Search Patents →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
