"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Idea, FrameworkType, IdeaScore, GeneratedIdea, AliceScore } from "@/lib/types";
import { useIdeaStore } from "@/lib/store";
import { useAI } from "@/hooks/useAI";
import { useWizardDraft } from "@/hooks/useWizardDraft";
import { createBlankIdea } from "@/lib/utils";
import { Button, Stepper, Input, Textarea, TagInput, Card, Modal, Spinner } from "@/components/ui";
import { ScoreMatrix } from "./ScoreMatrix";
import { AliceScoreCard } from "./AliceScoreCard";

const WIZARD_STEPS = [
  { id: "problem", label: "Problem" },
  { id: "framework", label: "Framework" },
  { id: "ai-assist", label: "AI Assist", optional: true },
  { id: "refine", label: "Refine" },
  { id: "alice", label: "Alice Check", optional: true },
  { id: "review", label: "Review & Save" },
];

const FRAMEWORK_OPTIONS: { value: FrameworkType; label: string; desc: string; icon: string }[] = [
  { value: "triz", label: "TRIZ", desc: "Systematic inventive thinking via contradiction resolution", icon: "\u2699\uFE0F" },
  { value: "sit", label: "SIT", desc: "Systematic Inventive Thinking — 5 templates for innovation", icon: "\uD83D\uDD27" },
  { value: "ck", label: "C-K Theory", desc: "Map concept space and knowledge space to find gaps", icon: "\uD83E\uDDE0" },
  { value: "analogy", label: "Analogy", desc: "Cross-domain thinking — apply solutions from other fields", icon: "\uD83D\uDD17" },
  { value: "fmea", label: "FMEA Inversion", desc: "Turn failure modes into patentable mitigations", icon: "\u26A0\uFE0F" },
  { value: "none", label: "Freeform", desc: "No framework — describe your invention directly", icon: "\u270D\uFE0F" },
];

const TECH_SUGGESTIONS = [
  "distributed systems", "kubernetes", "ML inference", "microservices",
  "event-driven", "edge computing", "serverless", "GraphQL",
  "real-time", "data pipelines", "vector databases", "LLM",
  "caching", "observability", "CI/CD", "multi-tenant",
];

export function IdeaWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const addIdea = useIdeaStore((s) => s.addIdea);

  const userId = session?.user?.id ?? "anonymous";
  const sprintId = searchParams.get("sprintId");
  const { hasDraft, draftData, saveDraft, clearDraft, dismissDraft } = useWizardDraft(userId);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Partial<Idea>>(() => {
    const blank = createBlankIdea(userId);
    return blank;
  });

  // ─── Show restore modal if draft exists ─────────────────────
  useEffect(() => {
    if (hasDraft && draftData) {
      setShowRestoreModal(true);
    }
  }, [hasDraft, draftData]);

  // ─── Auto-save on step/draft changes ────────────────────────
  useEffect(() => {
    // Only auto-save if user has started filling in content
    if (draft.problemStatement || draft.title || draft.proposedSolution) {
      saveDraft(step, draft);
    }
  }, [step, draft, saveDraft]);

  function handleRestore() {
    if (draftData) {
      setStep(draftData.step);
      setDraft((prev) => ({ ...prev, ...draftData.draft }));
    }
    setShowRestoreModal(false);
    dismissDraft();
  }

  function handleDiscard() {
    clearDraft();
    setShowRestoreModal(false);
  }

  const update = useCallback((updates: Partial<Idea>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  }, []);

  function next() {
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function save() {
    const ideaData = sprintId ? { ...draft, sprintId } : draft;
    const idea = await addIdea(ideaData, userId);
    clearDraft();
    if (sprintId) {
      router.push(`/sprints/${sprintId}`);
    } else {
      router.push(`/ideas/${idea.id}`);
    }
  }

  function formatTimeAgo(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
    return "over a day ago";
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Draft restore modal */}
      <Modal
        open={showRestoreModal}
        onClose={handleDiscard}
        title="Restore Draft?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-dark">
            You have an unsaved draft from{" "}
            <span className="font-normal text-ink">
              {draftData?.savedAt ? formatTimeAgo(draftData.savedAt) : "recently"}
            </span>.
            Would you like to continue where you left off?
          </p>
          {draftData?.draft?.title && (
            <div className="p-3 rounded-lg bg-neutral-off-white border border-border">
              <p className="text-xs text-neutral-light mb-0.5">Draft title</p>
              <p className="text-sm font-medium text-ink">{draftData.draft.title}</p>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={handleDiscard}>
              Discard
            </Button>
            <Button variant="primary" onClick={handleRestore}>
              Restore Draft
            </Button>
          </div>
        </div>
      </Modal>

      {/* Sprint context banner */}
      {sprintId && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-blue-ribbon/5 border border-blue-ribbon/20 flex items-center gap-2">
          <span className="text-blue-ribbon text-sm">&#9651;</span>
          <span className="text-xs text-blue-ribbon/80">Creating idea for sprint</span>
          <button
            onClick={() => router.push(`/sprints/${sprintId}`)}
            className="ml-auto text-xs text-text-muted hover:text-blue-ribbon"
          >
            Back to sprint
          </button>
        </div>
      )}

      {/* Stepper */}
      <div className="mb-8">
        <Stepper steps={WIZARD_STEPS} currentStep={step} onStepClick={setStep} />
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {step === 0 && (
          <StepProblem draft={draft} update={update} />
        )}
        {step === 1 && (
          <StepFramework draft={draft} update={update} />
        )}
        {step === 2 && (
          <StepAIIdeation draft={draft} update={update} />
        )}
        {step === 3 && (
          <StepRefine draft={draft} update={update} />
        )}
        {step === 4 && (
          <StepAliceCheck draft={draft} update={update} />
        )}
        {step === 5 && (
          <StepReview draft={draft} update={update} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <Button variant="ghost" onClick={back} disabled={step === 0}>
          Back
        </Button>
        <div className="flex gap-2">
          {step < WIZARD_STEPS.length - 1 ? (
            <Button variant="primary" onClick={next}>
              {WIZARD_STEPS[step + 1]?.optional ? "Skip" : "Continue"}
            </Button>
          ) : (
            <Button variant="accent" onClick={save}>
              Save Idea
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Problem ──────────────────────────────────────────────

function StepProblem({ draft, update }: { draft: Partial<Idea>; update: (u: Partial<Idea>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-serif font-bold text-ink mb-1">Describe the Problem</h2>
        <p className="text-sm text-neutral-dark">What problem did you solve? What was broken, slow, or inefficient?</p>
      </div>

      <Textarea
        label="Problem Statement"
        value={draft.problemStatement ?? ""}
        onChange={(e) => update({ problemStatement: e.target.value })}
        rows={4}
        placeholder="e.g., Our distributed cache had a 200ms cold-start penalty on every deployment, causing p99 latency spikes..."
      />

      <Textarea
        label="Existing Approach (What was there before?)"
        value={draft.existingApproach ?? ""}
        onChange={(e) => update({ existingApproach: e.target.value })}
        rows={3}
        placeholder="e.g., Standard LRU cache with TTL-based invalidation, full cache rebuild on deploy..."
      />

      <div>
        <label className="block text-sm font-normal text-neutral-dark mb-1.5">Tech Stack</label>
        <TagInput
          tags={draft.techStack ?? []}
          onChange={(tags) => update({ techStack: tags })}
          suggestions={TECH_SUGGESTIONS}
          placeholder="Add technologies..."
        />
      </div>
    </div>
  );
}

// ─── Step 2: Framework ────────────────────────────────────────────

function StepFramework({ draft, update }: { draft: Partial<Idea>; update: (u: Partial<Idea>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-serif font-bold text-ink mb-1">Choose a Framework</h2>
        <p className="text-sm text-neutral-dark">Pick an inventive framework to guide your thinking, or go freeform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FRAMEWORK_OPTIONS.map((fw) => (
          <Card
            key={fw.value}
            hover
            borderColor={draft.frameworkUsed === fw.value ? "#003BDE" : undefined}
            onClick={() => update({ frameworkUsed: fw.value })}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{fw.icon}</span>
              <div>
                <div className="text-sm font-medium text-ink">{fw.label}</div>
                <div className="text-xs text-neutral-dark mt-0.5">{fw.desc}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Step 3: AI Ideation ──────────────────────────────────────────

function StepAIIdeation({ draft, update }: { draft: Partial<Idea>; update: (u: Partial<Idea>) => void }) {
  const { ideate, loading, error } = useAI();
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);

  async function generate() {
    const result = await ideate({
      problemStatement: draft.problemStatement ?? "",
      techStack: draft.techStack ?? [],
      framework: (draft.frameworkUsed as FrameworkType) ?? "open",
      existingApproach: draft.existingApproach,
      numIdeas: 3,
    });
    if (result?.ideas) {
      setGeneratedIdeas(result.ideas);
    }
  }

  function selectIdea(idea: GeneratedIdea) {
    update({
      title: idea.title,
      proposedSolution: idea.proposedSolution,
      technicalApproach: idea.technicalApproach,
      contradictionResolved: idea.contradictionResolved ?? "",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-serif font-bold text-ink mb-1">AI Ideation</h2>
        <p className="text-sm text-neutral-dark">
          Claude will analyze your problem and generate inventive patent concepts.
        </p>
      </div>

      <Button variant="accent" onClick={generate} disabled={loading || !draft.problemStatement}>
        {loading ? <><Spinner size="sm" className="mr-2" /> Generating...</> : "\u2728 Generate Ideas"}
      </Button>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {generatedIdeas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-ink">Generated Concepts ({generatedIdeas.length})</h3>
          {generatedIdeas.map((idea, i) => (
            <Card key={i} hover onClick={() => selectIdea(idea)} borderColor={draft.title === idea.title ? "#003BDE" : undefined}>
              <h4 className="text-sm font-medium text-ink mb-1">{idea.title}</h4>
              <p className="text-xs text-neutral-dark mb-2">{idea.proposedSolution}</p>
              <div className="flex gap-2 flex-wrap">
                {idea.estimatedCpcClass && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-text-muted">
                    CPC: {idea.estimatedCpcClass}
                  </span>
                )}
                {idea.aliceRiskHint && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    idea.aliceRiskHint === "low" ? "bg-green-900/30 text-green-400" :
                    idea.aliceRiskHint === "medium" ? "bg-yellow-900/30 text-yellow-400" :
                    "bg-red-900/30 text-red-400"
                  }`}>
                    Alice: {idea.aliceRiskHint}
                  </span>
                )}
                {idea.inventivePrincipleUsed && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-text-muted">
                    {idea.inventivePrincipleUsed}
                  </span>
                )}
              </div>
            </Card>
          ))}
          <p className="text-xs text-text-muted">Click an idea to use it as your starting point.</p>
        </div>
      )}

      {!loading && generatedIdeas.length === 0 && (
        <p className="text-xs text-text-muted">
          Click Generate to get AI-powered patent concepts, or Continue to skip.
        </p>
      )}
    </div>
  );
}

// ─── Step 4: Refine ───────────────────────────────────────────────

function StepRefine({ draft, update }: { draft: Partial<Idea>; update: (u: Partial<Idea>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-serif font-bold text-ink mb-1">Refine Your Idea</h2>
        <p className="text-sm text-neutral-dark">Add the details that make this a defensible invention.</p>
      </div>

      <Input
        label="Idea Title"
        value={draft.title ?? ""}
        onChange={(e) => update({ title: e.target.value })}
        placeholder="e.g., Predictive Cache Warming for Zero-Downtime Deployments"
      />

      <Textarea
        label="Proposed Solution"
        value={draft.proposedSolution ?? ""}
        onChange={(e) => update({ proposedSolution: e.target.value })}
        rows={3}
        placeholder="What is the novel solution? How does it work at a high level?"
      />

      <Textarea
        label="Technical Approach"
        value={draft.technicalApproach ?? ""}
        onChange={(e) => update({ technicalApproach: e.target.value })}
        rows={4}
        placeholder="Describe the specific architecture, algorithm, or method..."
      />

      <Textarea
        label="Contradiction Resolved"
        value={draft.contradictionResolved ?? ""}
        onChange={(e) => update({ contradictionResolved: e.target.value })}
        rows={2}
        placeholder="What trade-off does this invention overcome? e.g., Cache freshness vs. deployment speed"
      />

      <div>
        <label className="block text-sm font-normal text-neutral-dark mb-1.5">Tags</label>
        <TagInput
          tags={draft.tags ?? []}
          onChange={(tags) => update({ tags })}
          placeholder="Add tags..."
        />
      </div>
    </div>
  );
}

// ─── Step 5: Alice Check ──────────────────────────────────────────

function StepAliceCheck({ draft, update }: { draft: Partial<Idea>; update: (u: Partial<Idea>) => void }) {
  const { scoreAlice, loading, error } = useAI();

  async function runCheck() {
    const result = await scoreAlice({
      title: draft.title ?? "",
      problemStatement: draft.problemStatement ?? "",
      proposedSolution: draft.proposedSolution ?? "",
      technicalApproach: draft.technicalApproach ?? "",
    });
    if (result) {
      update({ aliceScore: result });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-serif font-bold text-ink mb-1">Alice / Section 101 Pre-Screen</h2>
        <p className="text-sm text-neutral-dark">
          AI evaluates your idea against the Alice framework to estimate patent eligibility.
        </p>
      </div>

      <Button variant="accent" onClick={runCheck} disabled={loading || (!draft.title && !draft.proposedSolution)}>
        {loading ? <><Spinner size="sm" className="mr-2" /> Analyzing...</> : "\u2696\uFE0F Run Alice Check"}
      </Button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {draft.aliceScore && (
        <AliceScoreCard score={draft.aliceScore as AliceScore} />
      )}

      {!draft.aliceScore && !loading && (
        <p className="text-xs text-text-muted">
          Click Run Alice Check to evaluate eligibility, or Continue to skip.
        </p>
      )}
    </div>
  );
}

// ─── Step 6: Review & Save ────────────────────────────────────────

function StepReview({ draft, update }: { draft: Partial<Idea>; update: (u: Partial<Idea>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-serif font-bold text-ink mb-1">Review & Score</h2>
        <p className="text-sm text-neutral-dark">Review your idea and optionally score it on the patent readiness matrix.</p>
      </div>

      {/* Summary */}
      <Card>
        <h3 className="text-base font-medium text-ink mb-2">
          {draft.title || "Untitled Idea"}
        </h3>
        {draft.problemStatement && (
          <p className="text-sm text-neutral-dark mb-2">{draft.problemStatement}</p>
        )}
        {draft.proposedSolution && (
          <div className="text-sm text-neutral-dark">
            <span className="font-normal text-ink">Solution: </span>
            {draft.proposedSolution}
          </div>
        )}
        <div className="flex gap-2 mt-3 flex-wrap">
          {draft.frameworkUsed && draft.frameworkUsed !== "none" && (
            <span className="text-xs px-2 py-0.5 rounded bg-white text-text-muted">
              {draft.frameworkUsed.toUpperCase()}
            </span>
          )}
          {(draft.tags ?? []).map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded bg-white text-text-muted">{t}</span>
          ))}
        </div>
      </Card>

      {/* Score matrix */}
      <ScoreMatrix
        score={draft.score ?? null}
        onChange={(score: IdeaScore) => update({ score })}
      />
    </div>
  );
}
