"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Idea, IdeaScore, RedTeamResult, FrameworkType, PatentReport, ClaimDraft } from "@/lib/types";
import { useIdeaStore } from "@/lib/store";
import { useAI } from "@/hooks/useAI";
import { useDebouncedField } from "@/hooks/useDebouncedField";
import { usePriorArt } from "@/hooks/usePriorArt";
import { Button, Tabs, TabPanel, Input, Textarea, Badge, Card, TagInput, Modal, Spinner } from "@/components/ui";
import { ScoreMatrix } from "./ScoreMatrix";
import { AlignmentPanel } from "./AlignmentPanel";
import { CompletionPill } from "./CompletionPill";
import { NextStepBanner } from "./NextStepBanner";
import { OverflowMenu } from "./OverflowMenu";
import { AIRefineButton } from "./AIRefineButton";
import { ClaimDraftDisplay } from "./ClaimDraft";
import { InventiveStepCard } from "./InventiveStepCard";
import { MarketNeedsCard } from "./MarketNeedsCard";
import { SearchForm } from "@/components/prior-art/SearchForm";
import { PatentResultCard } from "@/components/prior-art/PatentResultCard";
import { TRIZWorksheet } from "@/components/frameworks/TRIZWorksheet";
import { SITWorksheet } from "@/components/frameworks/SITWorksheet";
import { CKWorksheet } from "@/components/frameworks/CKWorksheet";
import { FMEAInversion } from "@/components/frameworks/FMEAInversion";
import { ContinuationPanel } from "./ContinuationPanel";
import { DocumentTab } from "@/components/editor/DocumentTab";
import { getStatusColor, getTotalScore, getScoreVerdict, timeAgo } from "@/lib/utils";

interface IdeaDetailProps {
  idea: Idea;
}

const STATUS_OPTIONS: { value: Idea["status"]; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "developing", label: "Developing" },
  { value: "scored", label: "Scored" },
  { value: "filed", label: "Filed" },
  { value: "archived", label: "Archived" },
];

const BASE_DETAIL_TABS: { id: string; label: string; status?: "complete" | "partial" | "empty" }[] = [
  { id: "overview", label: "Overview" },
  { id: "framework", label: "Framework" },
  { id: "claims", label: "Claims" },
  { id: "document", label: "Document" },
  { id: "patent-filing", label: "Patent Filing" },
  { id: "red-team", label: "Red Team" },
  { id: "prior-art", label: "Prior Art" },
];

const emptyClaimDraft: ClaimDraft = {
  methodClaim: "",
  systemClaim: "",
  crmClaim: "",
  methodDependentClaims: [],
  systemDependentClaims: [],
  crmDependentClaims: [],
  abstractText: "",
  claimStrategy: "",
  aliceMitigationNotes: "",
  prosecutionTips: [],
  notes: "",
};

const FRAMEWORK_OPTIONS: { value: FrameworkType; label: string; desc: string }[] = [
  { value: "triz", label: "TRIZ", desc: "Contradiction analysis with inventive principles" },
  { value: "sit", label: "SIT", desc: "Systematic Inventive Thinking templates" },
  { value: "ck", label: "C-K Theory", desc: "Concept-Knowledge space mapping" },
  { value: "fmea", label: "FMEA Inversion", desc: "Turn failure modes into patent candidates" },
];

// ─── Tab status computation ──────────────────────────────────────────

function getTabStatus(idea: Idea, tabId: string): "complete" | "partial" | "empty" {
  switch (tabId) {
    case "overview": {
      const hasProblem = !!idea.problemStatement && idea.problemStatement.length > 20;
      const hasSolution = !!idea.proposedSolution && !!idea.technicalApproach;
      if (hasProblem && hasSolution) return "complete";
      if (hasProblem || hasSolution) return "partial";
      return "empty";
    }
    case "framework":
      return idea.frameworkUsed !== "none" ? "complete" : "empty";
    case "claims":
      return idea.claimDraft !== null ? "complete" : "empty";
    case "patent-filing": {
      const hasInv = !!idea.inventiveStepAnalysis;
      const hasMkt = !!idea.marketNeedsAnalysis;
      if (hasInv && hasMkt) return "complete";
      if (hasInv || hasMkt) return "partial";
      return "empty";
    }
    case "red-team":
      return !!idea.redTeamNotes && idea.redTeamNotes.length > 20 ? "complete" : "empty";
    case "prior-art":
      return !!idea.priorArtNotes && idea.priorArtNotes.length > 10 ? "complete" : "empty";
    default:
      return "empty";
  }
}

// ─── Collapsible sidebar section ─────────────────────────────────────

function SidebarSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2"
      >
        <h3 className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
          {title}
        </h3>
        <svg
          className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="space-y-4 pb-2">{children}</div>}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function IdeaDetail({ idea }: IdeaDetailProps) {
  const router = useRouter();
  const updateIdea = useIdeaStore((s) => s.updateIdea);
  const removeIdea = useIdeaStore((s) => s.removeIdea);
  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const showContinuations = idea.status === "filed" || idea.status === "scored";

  // Compute tab statuses
  const detailTabs = useMemo(() => {
    const tabs = BASE_DETAIL_TABS.map((tab) => ({
      ...tab,
      status: getTabStatus(idea, tab.id),
    }));
    if (showContinuations) {
      tabs.push({ id: "continuations", label: "Continuations", status: "empty" as const });
    }
    return tabs;
  }, [idea, showContinuations]);

  const update = useCallback(
    (updates: Partial<Idea>) => {
      updateIdea(idea.id, updates);
    },
    [idea.id, updateIdea]
  );

  const saveTitle = useCallback((v: string) => update({ title: v }), [update]);
  const title = useDebouncedField(idea.title, saveTitle);

  function handleDelete() {
    if (window.confirm("Delete this idea? This cannot be undone.")) {
      removeIdea(idea.id);
      router.push("/ideas");
    }
  }

  function handleArchive() {
    update({ status: "archived" });
  }

  function handleStageClick(tabId: string) {
    setActiveTab(tabId);
  }

  function handleNextAction(actionId: string) {
    // For actions that map to tabs, navigate there
    const tabMap: Record<string, string> = {
      alice: "overview",
      claims: "claims",
      "inventive-step": "patent-filing",
      "market-needs": "patent-filing",
      "red-team": "red-team",
    };
    const tab = tabMap[actionId];
    if (tab) setActiveTab(tab);
  }

  // Alice score bar color
  const aliceBarColor = idea.aliceScore
    ? idea.aliceScore.overallScore >= 70
      ? "#10b981"
      : idea.aliceScore.overallScore >= 40
        ? "#f59e0b"
        : "#ef4444"
    : undefined;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: main content */}
      <div className="flex-1 min-w-0">
        {/* ── Title Area ── */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {editing ? (
              <Input
                value={title.localValue}
                onChange={(e) => title.onChange(e.target.value)}
                onBlur={title.flush}
                className="text-xl font-semibold"
              />
            ) : (
              <h1 className="text-xl font-serif font-bold text-ink leading-snug line-clamp-2">
                {idea.title || "Untitled Idea"}
              </h1>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="solid" color={getStatusColor(idea.status)}>
                {idea.status}
              </Badge>
              <span className="text-xs text-text-muted">{timeAgo(idea.updatedAt)}</span>
              <CompletionPill idea={idea} onStageClick={handleStageClick} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-4 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
              {editing ? "Done" : "Edit"}
            </Button>
            <OverflowMenu
              ideaId={idea.id}
              ideaTitle={idea.title}
              onDelete={handleDelete}
              onArchive={handleArchive}
            />
          </div>
        </div>

        {/* ── Next Step Banner ── */}
        <NextStepBanner
          idea={idea}
          onNavigate={handleStageClick}
          onAction={handleNextAction}
        />

        {/* ── Tabs ── */}
        <Tabs tabs={detailTabs} activeTab={activeTab} onChange={setActiveTab}>
          <TabPanel id="overview" activeTab={activeTab}>
            <OverviewTab idea={idea} update={update} editing={editing} />
          </TabPanel>
          <TabPanel id="framework" activeTab={activeTab}>
            <FrameworkTab idea={idea} update={update} />
          </TabPanel>
          <TabPanel id="claims" activeTab={activeTab}>
            <ClaimsTab idea={idea} update={update} editing={editing} />
          </TabPanel>
          <TabPanel id="patent-filing" activeTab={activeTab}>
            <PatentFilingTab idea={idea} update={update} />
          </TabPanel>
          <TabPanel id="red-team" activeTab={activeTab}>
            <RedTeamTab idea={idea} update={update} editing={editing} />
          </TabPanel>
          <TabPanel id="document" activeTab={activeTab}>
            <DocumentTab idea={idea} />
          </TabPanel>
          <TabPanel id="prior-art" activeTab={activeTab}>
            <PriorArtTab idea={idea} update={update} />
          </TabPanel>
          {showContinuations && (
            <TabPanel id="continuations" activeTab={activeTab}>
              <ContinuationPanel idea={idea} />
            </TabPanel>
          )}
        </Tabs>
      </div>

      {/* ── Sidebar collapse toggle ── */}
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hidden lg:flex items-center justify-center w-5 shrink-0 group"
        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        <div className="w-px h-full bg-border group-hover:bg-neutral-light transition-colors relative">
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-8 flex items-center justify-center rounded bg-white border border-border group-hover:border-neutral-light opacity-0 group-hover:opacity-100 transition-opacity">
            <svg
              className={`w-3 h-3 text-text-muted transition-transform ${sidebarOpen ? "" : "rotate-180"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </button>

      {/* ── Right sidebar ── */}
      <div
        className={`shrink-0 transition-all duration-200 overflow-hidden ${
          sidebarOpen ? "w-full lg:w-80" : "w-0 lg:w-0"
        }`}
      >
        <div className="w-full lg:w-80 space-y-2">
          {/* Scoring Section */}
          <SidebarSection title="Scoring">
            <Card>
              <ScoreMatrix
                score={idea.score}
                onChange={(score: IdeaScore) => update({ score })}
                compact
              />
              {idea.score && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div
                    className="text-sm font-normal"
                    style={{ color: getScoreVerdict(getTotalScore(idea.score)).color }}
                  >
                    {getScoreVerdict(getTotalScore(idea.score)).label} ({getTotalScore(idea.score)}/9)
                  </div>
                </div>
              )}
            </Card>

            {/* Alice score — compact bar mode */}
            {idea.aliceScore ? (
              <AliceScoreCompact score={idea.aliceScore} barColor={aliceBarColor!} />
            ) : (
              <AliceCheckButton idea={idea} update={update} />
            )}

            {/* Business Alignment */}
            <AlignmentPanel idea={idea} />
          </SidebarSection>

          {/* Properties Section */}
          <SidebarSection title="Properties">
            {/* Status */}
            <Card>
              <h3 className="text-sm font-medium text-ink mb-2">Status</h3>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update({ status: opt.value })}
                    className={`px-2.5 py-1 rounded text-xs font-normal transition-colors ${
                      idea.status === opt.value
                        ? "bg-accent-light text-blue-ribbon"
                        : "bg-white text-neutral-dark hover:text-ink"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Card>

            {/* Tags */}
            <Card>
              <h3 className="text-sm font-medium text-ink mb-2">Tags</h3>
              <TagInput
                tags={idea.tags}
                onChange={(tags) => update({ tags })}
                placeholder="Add tags..."
              />
            </Card>
          </SidebarSection>

          {/* Metadata Section */}
          <SidebarSection title="Metadata" defaultOpen={false}>
            {/* Sprint Association */}
            {idea.sprintId && (
              <Card>
                <h3 className="text-sm font-medium text-ink mb-2">Sprint</h3>
                <div className="flex items-center justify-between">
                  <Link
                    href={`/sprints/${idea.sprintId}`}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-ribbon hover:underline"
                  >
                    <span>&#9651;</span>
                    View Sprint
                  </Link>
                  <button
                    onClick={async () => {
                      const { unlinkFromSprint } = await import("@/lib/api");
                      await unlinkFromSprint(idea.id);
                      update({ sprintId: null });
                    }}
                    className="text-[11px] text-text-muted hover:text-red-500 transition-colors"
                  >
                    Remove from Sprint
                  </button>
                </div>
              </Card>
            )}

            <Card>
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-text-muted">Created</dt>
                  <dd className="text-neutral-dark">{timeAgo(idea.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted">Framework</dt>
                  <dd className="text-neutral-dark">{idea.frameworkUsed === "none" ? "Freeform" : idea.frameworkUsed.toUpperCase()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted">Phase</dt>
                  <dd className="text-neutral-dark capitalize">{idea.phase}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted">ID</dt>
                  <dd className="text-text-muted font-mono">{idea.id.slice(0, 8)}</dd>
                </div>
              </dl>
            </Card>
          </SidebarSection>
        </div>
      </div>
    </div>
  );
}

// ─── Compact Alice Score (sidebar bar mode) ──────────────────────────

function AliceScoreCompact({
  score,
  barColor,
}: {
  score: NonNullable<Idea["aliceScore"]>;
  barColor: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-ink">Section 101</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-mono tabular-nums text-ink">{score.overallScore}</span>
          <span className="text-[10px] text-text-muted">/100</span>
          <Badge variant="solid" color={barColor} size="sm">
            {score.abstractIdeaRisk}
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-neutral-off-white rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score.overallScore}%`, backgroundColor: barColor }}
        />
      </div>

      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-[11px] text-blue-ribbon hover:text-accent-hover transition-colors"
        >
          View Details
        </button>
      ) : (
        <div className="space-y-2.5 pt-2 border-t border-border animate-fade-in">
          <SidebarDetail title="Abstract Idea Risk" text={score.abstractIdeaAnalysis} />
          <SidebarDetail title="Practical Application" text={score.practicalApplication} />
          <SidebarDetail title="Inventive Concept" text={score.inventiveConcept} />
          {score.recommendations.length > 0 && (
            <div>
              <h4 className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">Recommendations</h4>
              <ul className="space-y-1">
                {score.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-neutral-dark flex items-start gap-1">
                    <span className="text-blue-ribbon shrink-0">{"\u2022"}</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-[11px] text-text-muted hover:text-ink transition-colors"
          >
            Collapse
          </button>
        </div>
      )}
    </Card>
  );
}

function SidebarDetail({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h4 className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">{title}</h4>
      <p className="text-xs text-neutral-dark">{text}</p>
    </div>
  );
}

// ─── Alice Check Button (sidebar) ─────────────────────────────

function AliceCheckButton({ idea, update }: { idea: Idea; update: (u: Partial<Idea>) => void }) {
  const { scoreAlice, loading } = useAI();

  async function handleRunAlice() {
    const result = await scoreAlice({
      title: idea.title,
      problemStatement: idea.problemStatement,
      proposedSolution: idea.proposedSolution,
      technicalApproach: idea.technicalApproach,
    });
    if (result) {
      update({ aliceScore: result });
    }
  }

  return (
    <Card>
      <h3 className="text-sm font-medium text-ink mb-2">Alice / 101 Score</h3>
      <p className="text-xs text-neutral-dark mb-3">
        Run an AI pre-screen to assess Section 101 eligibility risks.
      </p>
      <Button
        variant="accent"
        size="sm"
        onClick={handleRunAlice}
        disabled={loading || !idea.problemStatement}
      >
        {loading ? <><Spinner size="sm" /> Analyzing...</> : "Run Alice Check"}
      </Button>
      {!idea.problemStatement && (
        <p className="text-[10px] text-text-muted mt-1">Add a problem statement first.</p>
      )}
    </Card>
  );
}

// ─── Tab Components ────────────────────────────────────────────

function OverviewTab({ idea, update, editing }: { idea: Idea; update: (u: Partial<Idea>) => void; editing: boolean }) {
  const context = `Title: ${idea.title}\nProblem: ${idea.problemStatement}\nSolution: ${idea.proposedSolution}\nTechnical Approach: ${idea.technicalApproach}`;

  const saveProblem = useCallback((v: string) => update({ problemStatement: v }), [update]);
  const saveExisting = useCallback((v: string) => update({ existingApproach: v }), [update]);
  const saveSolution = useCallback((v: string) => update({ proposedSolution: v }), [update]);
  const saveTechnical = useCallback((v: string) => update({ technicalApproach: v }), [update]);
  const saveContradiction = useCallback((v: string) => update({ contradictionResolved: v }), [update]);

  const problem = useDebouncedField(idea.problemStatement, saveProblem);
  const existing = useDebouncedField(idea.existingApproach, saveExisting);
  const solution = useDebouncedField(idea.proposedSolution, saveSolution);
  const technical = useDebouncedField(idea.technicalApproach, saveTechnical);
  const contradiction = useDebouncedField(idea.contradictionResolved, saveContradiction);

  return (
    <div className="space-y-6">
      <Section label="Problem Statement" refineSlot={
        editing && <AIRefineButton field="problemStatement" value={idea.problemStatement} context={context} onAccept={(v) => update({ problemStatement: v })} />
      }>
        {editing ? (
          <Textarea
            value={problem.localValue}
            onChange={(e) => problem.onChange(e.target.value)}
            onBlur={problem.flush}
            rows={4}
          />
        ) : (
          <p className="text-sm text-neutral-dark whitespace-pre-wrap">
            {idea.problemStatement || "No problem statement yet."}
          </p>
        )}
      </Section>

      <Section label="Existing Approach">
        {editing ? (
          <Textarea
            value={existing.localValue}
            onChange={(e) => existing.onChange(e.target.value)}
            onBlur={existing.flush}
            rows={3}
          />
        ) : (
          <p className="text-sm text-neutral-dark whitespace-pre-wrap">
            {idea.existingApproach || "Not described."}
          </p>
        )}
      </Section>

      <Section label="Proposed Solution" refineSlot={
        editing && <AIRefineButton field="proposedSolution" value={idea.proposedSolution} context={context} onAccept={(v) => update({ proposedSolution: v })} />
      }>
        {editing ? (
          <Textarea
            value={solution.localValue}
            onChange={(e) => solution.onChange(e.target.value)}
            onBlur={solution.flush}
            rows={3}
          />
        ) : (
          <p className="text-sm text-neutral-dark whitespace-pre-wrap">
            {idea.proposedSolution || "Not described."}
          </p>
        )}
      </Section>

      <Section label="Technical Approach" refineSlot={
        editing && <AIRefineButton field="technicalApproach" value={idea.technicalApproach} context={context} onAccept={(v) => update({ technicalApproach: v })} />
      }>
        {editing ? (
          <Textarea
            value={technical.localValue}
            onChange={(e) => technical.onChange(e.target.value)}
            onBlur={technical.flush}
            rows={4}
          />
        ) : (
          <p className="text-sm text-neutral-dark whitespace-pre-wrap">
            {idea.technicalApproach || "Not described."}
          </p>
        )}
      </Section>

      <Section label="Contradiction Resolved" refineSlot={
        editing && <AIRefineButton field="contradictionResolved" value={idea.contradictionResolved} context={context} onAccept={(v) => update({ contradictionResolved: v })} />
      }>
        {editing ? (
          <Textarea
            value={contradiction.localValue}
            onChange={(e) => contradiction.onChange(e.target.value)}
            onBlur={contradiction.flush}
            rows={2}
          />
        ) : (
          <p className="text-sm text-neutral-dark whitespace-pre-wrap">
            {idea.contradictionResolved || "No contradiction noted."}
          </p>
        )}
      </Section>

      {idea.techStack.length > 0 && (
        <Section label="Tech Stack">
          <div className="flex flex-wrap gap-1.5">
            {idea.techStack.map((t) => (
              <Badge key={t} variant="outline">{t}</Badge>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function FrameworkTab({ idea, update }: { idea: Idea; update: (u: Partial<Idea>) => void }) {
  const [worksheetOpen, setWorksheetOpen] = useState(false);

  function selectFramework(fw: FrameworkType) {
    update({ frameworkUsed: fw });
  }

  // No framework selected — show selection cards
  if (idea.frameworkUsed === "none") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-neutral-dark">
          Choose an inventive framework to structure your thinking:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FRAMEWORK_OPTIONS.map((fw) => (
            <button
              key={fw.value}
              onClick={() => selectFramework(fw.value)}
              className="text-left p-4 rounded-xl border border-border bg-white hover:border-blue-ribbon/50 hover:bg-neutral-off-white transition-all"
            >
              <h4 className="text-sm font-medium text-ink mb-1">{fw.label}</h4>
              <p className="text-xs text-neutral-dark">{fw.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Framework selected — show data + open worksheet button
  const worksheetTitle = `${idea.frameworkUsed.toUpperCase()} Worksheet`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-dark">
          Framework: <span className="font-normal text-ink">{idea.frameworkUsed.toUpperCase()}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="accent" size="sm" onClick={() => setWorksheetOpen(true)}>
            Open Worksheet
          </Button>
          <Button variant="ghost" size="sm" onClick={() => update({ frameworkUsed: "none", frameworkData: {} })}>
            Change
          </Button>
        </div>
      </div>

      {/* Inline data preview */}
      {idea.frameworkData.triz && idea.frameworkUsed === "triz" && (
        <Card>
          <h4 className="text-sm font-medium text-ink mb-2">TRIZ Data</h4>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-text-muted">Improving:</dt><dd className="text-neutral-dark">{idea.frameworkData.triz.improving || "—"}</dd></div>
            <div><dt className="text-text-muted">Worsening:</dt><dd className="text-neutral-dark">{idea.frameworkData.triz.worsening || "—"}</dd></div>
            <div><dt className="text-text-muted">Resolution:</dt><dd className="text-neutral-dark">{idea.frameworkData.triz.resolution || "—"}</dd></div>
          </dl>
        </Card>
      )}
      {idea.frameworkData.ck && idea.frameworkUsed === "ck" && (
        <Card>
          <h4 className="text-sm font-medium text-ink mb-2">C-K Theory</h4>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-text-muted">Concepts:</dt><dd className="text-neutral-dark whitespace-pre-wrap">{idea.frameworkData.ck.concepts || "—"}</dd></div>
            <div><dt className="text-text-muted">Knowledge:</dt><dd className="text-neutral-dark whitespace-pre-wrap">{idea.frameworkData.ck.knowledge || "—"}</dd></div>
            <div><dt className="text-text-muted">Opportunity:</dt><dd className="text-neutral-dark whitespace-pre-wrap">{idea.frameworkData.ck.opportunity || "—"}</dd></div>
          </dl>
        </Card>
      )}
      {idea.frameworkData.sit && idea.frameworkUsed === "sit" && (
        <Card>
          <h4 className="text-sm font-medium text-ink mb-2">SIT Templates</h4>
          <dl className="space-y-2 text-sm">
            {Object.entries(idea.frameworkData.sit).map(([k, v]) => (
              <div key={k}><dt className="text-text-muted capitalize">{k}:</dt><dd className="text-neutral-dark whitespace-pre-wrap">{v || "—"}</dd></div>
            ))}
          </dl>
        </Card>
      )}
      {idea.frameworkData.fmea && idea.frameworkUsed === "fmea" && (
        <Card>
          <h4 className="text-sm font-medium text-ink mb-2">FMEA Entries</h4>
          <p className="text-xs text-neutral-dark">{idea.frameworkData.fmea.length} failure mode(s) analyzed</p>
        </Card>
      )}

      {/* Worksheet modal */}
      <Modal open={worksheetOpen} onClose={() => setWorksheetOpen(false)} title={worksheetTitle} maxWidth="xl">
        {idea.frameworkUsed === "triz" && (
          <TRIZWorksheet
            data={idea.frameworkData.triz}
            onChange={(data) => update({ frameworkData: { ...idea.frameworkData, triz: data } })}
          />
        )}
        {idea.frameworkUsed === "sit" && (
          <SITWorksheet
            data={idea.frameworkData.sit}
            onChange={(data) => update({ frameworkData: { ...idea.frameworkData, sit: data } })}
          />
        )}
        {idea.frameworkUsed === "ck" && (
          <CKWorksheet
            data={idea.frameworkData.ck}
            onChange={(data) => update({ frameworkData: { ...idea.frameworkData, ck: data } })}
          />
        )}
        {idea.frameworkUsed === "fmea" && (
          <FMEAInversion
            data={idea.frameworkData.fmea}
            onChange={(data) => update({ frameworkData: { ...idea.frameworkData, fmea: data } })}
          />
        )}
      </Modal>
    </div>
  );
}

function ClaimsTab({ idea, update, editing }: { idea: Idea; update: (u: Partial<Idea>) => void; editing: boolean }) {
  const { draftClaims, loading } = useAI();

  async function handleGenerate() {
    const result = await draftClaims({
      title: idea.title,
      problemStatement: idea.problemStatement,
      existingApproach: idea.existingApproach,
      proposedSolution: idea.proposedSolution,
      technicalApproach: idea.technicalApproach,
      contradictionResolved: idea.contradictionResolved,
      techStack: idea.techStack,
      frameworkUsed: idea.frameworkUsed,
      frameworkData: idea.frameworkData,
      aliceScore: idea.aliceScore,
      score: idea.score,
    });
    if (result) {
      update({ claimDraft: result });
    }
  }

  const claim = idea.claimDraft;

  return (
    <div className="space-y-6">
      {/* Generate button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-dark">
          AI-generated claim skeletons for method, system, and CRM claims.
        </p>
        <Button
          variant="accent"
          size="sm"
          onClick={handleGenerate}
          disabled={loading || !idea.technicalApproach}
        >
          {loading ? <><Spinner size="sm" /> Generating...</> : claim ? "Regenerate Claims" : "Generate Claims"}
        </Button>
      </div>

      {!idea.technicalApproach && (
        <p className="text-xs text-text-muted">Add a technical approach in the Overview tab first.</p>
      )}

      {/* Display generated claims */}
      {claim && (
        <ClaimDraftDisplay
          claims={claim}
          onRegenerate={handleGenerate}
          loading={loading}
        />
      )}

      {/* Manual editing fallback */}
      {editing && (
        <ClaimsManualEdit claim={claim} update={update} />
      )}

      {/* No claims and not editing */}
      {!claim && !editing && (
        <div className="py-8 text-center">
          <p className="text-sm text-neutral-dark">No claim drafts yet.</p>
          <p className="text-xs text-text-muted mt-1">Click &quot;Generate Claims&quot; above to create AI-drafted claim skeletons.</p>
        </div>
      )}
    </div>
  );
}

function ClaimsManualEdit({ claim, update }: { claim: ClaimDraft | null | undefined; update: (u: Partial<Idea>) => void }) {
  const base = claim ?? emptyClaimDraft;

  const saveMethod = useCallback(
    (v: string) => update({ claimDraft: { ...base, methodClaim: v } }),
    [update, base]
  );
  const saveSystem = useCallback(
    (v: string) => update({ claimDraft: { ...base, systemClaim: v } }),
    [update, base]
  );
  const saveCrm = useCallback(
    (v: string) => update({ claimDraft: { ...base, crmClaim: v } }),
    [update, base]
  );

  const method = useDebouncedField(base.methodClaim, saveMethod);
  const system = useDebouncedField(base.systemClaim, saveSystem);
  const crm = useDebouncedField(base.crmClaim, saveCrm);

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">Manual Editing</h4>
      <Section label="Method Claim">
        <Textarea
          value={method.localValue}
          onChange={(e) => method.onChange(e.target.value)}
          onBlur={method.flush}
          rows={5}
          placeholder="A method for [verb]-ing ... comprising: [step a], [step b]..."
        />
      </Section>
      <Section label="System Claim">
        <Textarea
          value={system.localValue}
          onChange={(e) => system.onChange(e.target.value)}
          onBlur={system.flush}
          rows={5}
          placeholder="A system comprising: a processor; a memory storing instructions..."
        />
      </Section>
      <Section label="Computer-Readable Medium Claim">
        <Textarea
          value={crm.localValue}
          onChange={(e) => crm.onChange(e.target.value)}
          onBlur={crm.flush}
          rows={5}
          placeholder="A non-transitory computer-readable medium storing instructions..."
        />
      </Section>
    </div>
  );
}

function RedTeamTab({ idea, update, editing }: { idea: Idea; update: (u: Partial<Idea>) => void; editing: boolean }) {
  const { redTeam, loading } = useAI();
  const [result, setResult] = useState<RedTeamResult | null>(null);

  async function handleRedTeam() {
    const res = await redTeam({
      title: idea.title,
      problemStatement: idea.problemStatement,
      proposedSolution: idea.proposedSolution,
      technicalApproach: idea.technicalApproach,
      aliceScoreSummary: idea.aliceScore
        ? `Score: ${idea.aliceScore.overallScore}/100, Risk: ${idea.aliceScore.abstractIdeaRisk}`
        : undefined,
    });
    if (res) {
      setResult(res);
      // Append AI critique to red team notes
      const aiSummary = `--- AI Red Team Critique ---\n${res.critique}\n\nWeaknesses:\n${res.weaknesses.map((w) => `- ${w}`).join("\n")}\n\nPrior Art Concerns:\n${res.priorArtConcerns.map((p) => `- ${p}`).join("\n")}\n\nAlice/101 Risks:\n${res.aliceRisks.map((a) => `- ${a}`).join("\n")}\n\nRecommendations:\n${res.recommendations.map((r) => `- ${r}`).join("\n")}`;
      const existing = idea.redTeamNotes ? idea.redTeamNotes + "\n\n" : "";
      update({ redTeamNotes: existing + aiSummary });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-dark">
          Play devil&apos;s advocate. What are the weaknesses? Why might this <em>not</em> be patentable?
        </p>
        <Button
          variant="accent"
          size="sm"
          onClick={handleRedTeam}
          disabled={loading || !idea.problemStatement}
        >
          {loading ? <><Spinner size="sm" /> Analyzing...</> : "AI Red Team Critique"}
        </Button>
      </div>

      {/* AI result display */}
      {result && (
        <div className="space-y-3">
          <Card>
            <h4 className="text-xs font-medium text-blue-ribbon uppercase tracking-wider mb-2">AI Critique</h4>
            <p className="text-sm text-neutral-dark whitespace-pre-wrap">{result.critique}</p>
          </Card>

          <CollapsibleList title="Weaknesses" items={result.weaknesses} color="#ef4444" />
          <CollapsibleList title="Prior Art Concerns" items={result.priorArtConcerns} color="#f59e0b" />
          <CollapsibleList title="Alice / 101 Risks" items={result.aliceRisks} color="#f97316" />
          <CollapsibleList title="Recommendations" items={result.recommendations} color="#10b981" />
        </div>
      )}

      {/* Freeform notes */}
      <div className="pt-2">
        <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Your Notes</h4>
        {editing ? (
          <RedTeamNotesEditor idea={idea} update={update} />
        ) : (
          <p className="text-sm text-neutral-dark whitespace-pre-wrap">
            {idea.redTeamNotes || "No red team notes yet."}
          </p>
        )}
      </div>
    </div>
  );
}

function RedTeamNotesEditor({ idea, update }: { idea: Idea; update: (u: Partial<Idea>) => void }) {
  const saveNotes = useCallback((v: string) => update({ redTeamNotes: v }), [update]);
  const notes = useDebouncedField(idea.redTeamNotes, saveNotes);

  return (
    <Textarea
      value={notes.localValue}
      onChange={(e) => notes.onChange(e.target.value)}
      onBlur={notes.flush}
      rows={8}
      placeholder="List potential weaknesses, prior art concerns, Alice/101 risks, claim ambiguities..."
    />
  );
}

function PriorArtTab({ idea, update }: { idea: Idea; update: (u: Partial<Idea>) => void }) {
  const { results, search, loading, error } = usePriorArt();
  const [notesEditing, setNotesEditing] = useState(false);

  return (
    <div className="space-y-4">
      {/* Search form */}
      <SearchForm
        onSearch={search}
        loading={loading}
      />

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </h4>
          {results.map((r) => (
            <PatentResultCard key={r.patentNumber} result={r} />
          ))}
        </div>
      )}

      {/* Prior art notes */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">Prior Art Notes</h4>
          <button
            onClick={() => setNotesEditing(!notesEditing)}
            className="text-[10px] text-blue-ribbon hover:underline"
          >
            {notesEditing ? "Done" : "Edit"}
          </button>
        </div>
        {notesEditing ? (
          <PriorArtNotesEditor idea={idea} update={update} />
        ) : (
          <p className="text-sm text-neutral-dark whitespace-pre-wrap">
            {idea.priorArtNotes || "No prior art notes yet. Search above and document your findings here."}
          </p>
        )}
      </div>
    </div>
  );
}

function PriorArtNotesEditor({ idea, update }: { idea: Idea; update: (u: Partial<Idea>) => void }) {
  const saveNotes = useCallback((v: string) => update({ priorArtNotes: v }), [update]);
  const notes = useDebouncedField(idea.priorArtNotes, saveNotes);

  return (
    <Textarea
      value={notes.localValue}
      onChange={(e) => notes.onChange(e.target.value)}
      onBlur={notes.flush}
      rows={5}
      placeholder="Document prior art findings, relevant patents, and differentiation points..."
    />
  );
}

// ─── Patent Filing Tab ────────────────────────────────────────

function PatentFilingTab({ idea, update }: { idea: Idea; update: (u: Partial<Idea>) => void }) {
  const { analyzeInventiveStep, analyzeMarketNeeds, generatePatentReport, loading } = useAI();
  const [activeAction, setActiveAction] = useState<"inventive" | "market" | "report" | null>(null);

  async function handleAnalyzeInventiveStep() {
    setActiveAction("inventive");
    const result = await analyzeInventiveStep({
      title: idea.title,
      problemStatement: idea.problemStatement,
      proposedSolution: idea.proposedSolution,
      technicalApproach: idea.technicalApproach,
      existingApproach: idea.existingApproach,
    });
    if (result) {
      update({ inventiveStepAnalysis: result });
    }
    setActiveAction(null);
  }

  async function handleAnalyzeMarketNeeds() {
    setActiveAction("market");
    const result = await analyzeMarketNeeds({
      title: idea.title,
      problemStatement: idea.problemStatement,
      proposedSolution: idea.proposedSolution,
      technicalApproach: idea.technicalApproach,
      techStack: idea.techStack,
    });
    if (result) {
      update({ marketNeedsAnalysis: result });
    }
    setActiveAction(null);
  }

  async function handleGenerateReport() {
    setActiveAction("report");
    const result = await generatePatentReport({
      title: idea.title,
      problemStatement: idea.problemStatement,
      proposedSolution: idea.proposedSolution,
      technicalApproach: idea.technicalApproach,
      existingApproach: idea.existingApproach,
      techStack: idea.techStack,
      contradictionResolved: idea.contradictionResolved,
      frameworkUsed: idea.frameworkUsed,
      aliceScore: idea.aliceScore,
      inventiveStepAnalysis: idea.inventiveStepAnalysis,
      marketNeedsAnalysis: idea.marketNeedsAnalysis,
      claimDraft: idea.claimDraft,
      score: idea.score,
    });
    if (result) {
      update({ patentReport: result });
    }
    setActiveAction(null);
  }

  const isLoading = loading || activeAction !== null;
  const hasInventiveStep = !!idea.inventiveStepAnalysis;
  const hasMarketNeeds = !!idea.marketNeedsAnalysis;
  const canGenerateReport = hasInventiveStep && hasMarketNeeds;

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-dark">
        Comprehensive patent filing analyses. Run each analysis to build a complete filing strategy.
      </p>

      {/* Inventive Step Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">
            Inventive Step Analysis
          </h4>
          <Button
            variant="accent"
            size="sm"
            onClick={handleAnalyzeInventiveStep}
            disabled={isLoading || !idea.problemStatement}
          >
            {activeAction === "inventive" ? (
              <>
                <Spinner size="sm" /> Analyzing...
              </>
            ) : hasInventiveStep ? (
              "Re-analyze"
            ) : (
              "Analyze Inventive Step"
            )}
          </Button>
        </div>
        {!idea.problemStatement && (
          <p className="text-[10px] text-text-muted">Add a problem statement in the Overview tab first.</p>
        )}
        {hasInventiveStep && <InventiveStepCard analysis={idea.inventiveStepAnalysis!} />}
        {!hasInventiveStep && !isLoading && (
          <div className="py-6 text-center rounded-lg border border-dashed border-border">
            <p className="text-sm text-neutral-dark">No inventive step analysis yet.</p>
            <p className="text-xs text-text-muted mt-1">
              Click &quot;Analyze Inventive Step&quot; to identify non-obvious contributions.
            </p>
          </div>
        )}
      </div>

      {/* Market Needs Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">
            Market Needs Analysis
          </h4>
          <Button
            variant="accent"
            size="sm"
            onClick={handleAnalyzeMarketNeeds}
            disabled={isLoading || !idea.problemStatement}
          >
            {activeAction === "market" ? (
              <>
                <Spinner size="sm" /> Analyzing...
              </>
            ) : hasMarketNeeds ? (
              "Re-analyze"
            ) : (
              "Analyze Market Needs"
            )}
          </Button>
        </div>
        {hasMarketNeeds && <MarketNeedsCard analysis={idea.marketNeedsAnalysis!} />}
        {!hasMarketNeeds && !isLoading && (
          <div className="py-6 text-center rounded-lg border border-dashed border-border">
            <p className="text-sm text-neutral-dark">No market needs analysis yet.</p>
            <p className="text-xs text-text-muted mt-1">
              Click &quot;Analyze Market Needs&quot; to assess commercial potential.
            </p>
          </div>
        )}
      </div>

      {/* Full Patent Report Section */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Full Patent Report
            </h4>
            {!canGenerateReport && (
              <p className="text-[10px] text-text-muted mt-0.5">
                Complete both analyses above to generate a full report.
              </p>
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerateReport}
            disabled={isLoading || !canGenerateReport}
          >
            {activeAction === "report" ? (
              <>
                <Spinner size="sm" /> Generating...
              </>
            ) : idea.patentReport ? (
              "Regenerate Report"
            ) : (
              "Generate Report"
            )}
          </Button>
        </div>

        {idea.patentReport && (
          <PatentReportDisplay report={idea.patentReport} />
        )}
        {!idea.patentReport && !isLoading && (
          <div className="py-6 text-center rounded-lg border border-dashed border-border">
            <p className="text-sm text-neutral-dark">No patent report yet.</p>
            <p className="text-xs text-text-muted mt-1">
              Run the inventive step and market needs analyses first, then generate the full report.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PatentReportDisplay({ report }: { report: PatentReport }) {
  return (
    <Card>
      <h3 className="text-sm font-medium text-ink mb-4">Patent Filing Report</h3>

      <div className="space-y-4">
        {/* Executive Summary */}
        <div className="rounded-lg bg-accent-light border border-blue-ribbon/20 p-3">
          <h4 className="text-[10px] font-medium text-blue-ribbon uppercase tracking-wider mb-1">
            Executive Summary
          </h4>
          <p className="text-xs text-ink whitespace-pre-wrap">{report.executiveSummary}</p>
        </div>

        {/* Claim Strategy */}
        <div>
          <h4 className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">
            Claim Strategy
          </h4>
          <p className="text-xs text-neutral-dark">{report.claimStrategy}</p>
        </div>

        {/* Filing Recommendation */}
        <div>
          <h4 className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">
            Filing Recommendation
          </h4>
          <p className="text-xs text-neutral-dark">{report.filingRecommendation}</p>
        </div>

        {/* Risk Assessment */}
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <h4 className="text-[10px] font-medium text-red-700 uppercase tracking-wider mb-1">
            Risk Assessment
          </h4>
          <p className="text-xs text-neutral-dark">{report.riskAssessment}</p>
        </div>

        {/* Next Steps */}
        {report.nextSteps?.length > 0 && (
          <div>
            <h4 className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">
              Recommended Next Steps
            </h4>
            <ol className="space-y-1.5">
              {report.nextSteps.map((step, i) => (
                <li key={i} className="text-xs text-neutral-dark flex items-start gap-2">
                  <span className="text-blue-ribbon font-normal shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function Section({ label, children, refineSlot }: { label: string; children: React.ReactNode; refineSlot?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</h4>
        {refineSlot}
      </div>
      {children}
    </div>
  );
}

function CollapsibleList({ title, items, color }: { title: string; items: string[]; color: string }) {
  const [open, setOpen] = useState(true);

  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-neutral-off-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-normal text-ink">{title}</span>
          <Badge variant="outline" size="sm">{items.length}</Badge>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul className="px-3 py-2 space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-xs text-neutral-dark flex gap-2">
              <span className="text-text-muted shrink-0">{i + 1}.</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
