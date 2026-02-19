"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Idea, IdeaScore, RedTeamResult, FrameworkType } from "@/lib/types";
import { useIdeaStore } from "@/lib/store";
import { useAI } from "@/hooks/useAI";
import { usePriorArt } from "@/hooks/usePriorArt";
import { Button, Tabs, TabPanel, Input, Textarea, Badge, Card, TagInput, Modal, Spinner } from "@/components/ui";
import { ScoreMatrix } from "./ScoreMatrix";
import { AlignmentPanel } from "./AlignmentPanel";
import { PipelineProgress } from "./PipelineProgress";
import { AIRefineButton } from "./AIRefineButton";
import { ClaimDraftDisplay } from "./ClaimDraft";
import { SearchForm } from "@/components/prior-art/SearchForm";
import { PatentResultCard } from "@/components/prior-art/PatentResultCard";
import { TRIZWorksheet } from "@/components/frameworks/TRIZWorksheet";
import { SITWorksheet } from "@/components/frameworks/SITWorksheet";
import { CKWorksheet } from "@/components/frameworks/CKWorksheet";
import { FMEAInversion } from "@/components/frameworks/FMEAInversion";
import { getStatusColor, getTotalScore, getScoreVerdict, timeAgo, getAliceRiskColor } from "@/lib/utils";

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

const DETAIL_TABS = [
  { id: "overview", label: "Overview" },
  { id: "framework", label: "Framework" },
  { id: "claims", label: "Claims" },
  { id: "red-team", label: "Red Team" },
  { id: "prior-art", label: "Prior Art" },
];

const FRAMEWORK_OPTIONS: { value: FrameworkType; label: string; desc: string }[] = [
  { value: "triz", label: "TRIZ", desc: "Contradiction analysis with inventive principles" },
  { value: "sit", label: "SIT", desc: "Systematic Inventive Thinking templates" },
  { value: "ck", label: "C-K Theory", desc: "Concept-Knowledge space mapping" },
  { value: "fmea", label: "FMEA Inversion", desc: "Turn failure modes into patent candidates" },
];

export function IdeaDetail({ idea }: IdeaDetailProps) {
  const router = useRouter();
  const updateIdea = useIdeaStore((s) => s.updateIdea);
  const removeIdea = useIdeaStore((s) => s.removeIdea);
  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);

  const update = useCallback(
    (updates: Partial<Idea>) => {
      updateIdea(idea.id, updates);
    },
    [idea.id, updateIdea]
  );

  function handleDelete() {
    if (window.confirm("Delete this idea? This cannot be undone.")) {
      removeIdea(idea.id);
      router.push("/ideas");
    }
  }

  function handleStageClick(tabId: string) {
    setActiveTab(tabId);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: tabbed content */}
      <div className="flex-1 min-w-0">
        {/* Pipeline progress */}
        <PipelineProgress idea={idea} onStageClick={handleStageClick} />

        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {editing ? (
              <Input
                value={idea.title}
                onChange={(e) => update({ title: e.target.value })}
                className="text-xl font-bold"
              />
            ) : (
              <h1 className="text-xl font-display font-bold text-text-primary truncate">
                {idea.title || "Untitled Idea"}
              </h1>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="solid" color={getStatusColor(idea.status)}>
                {idea.status}
              </Badge>
              <span className="text-xs text-text-muted">Updated {timeAgo(idea.updatedAt)}</span>
            </div>
          </div>
          <div className="flex gap-2 ml-4 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
              {editing ? "Done" : "Edit"}
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>

        <Tabs tabs={DETAIL_TABS} activeTab={activeTab} onChange={setActiveTab}>
          <TabPanel id="overview" activeTab={activeTab}>
            <OverviewTab idea={idea} update={update} editing={editing} />
          </TabPanel>
          <TabPanel id="framework" activeTab={activeTab}>
            <FrameworkTab idea={idea} update={update} />
          </TabPanel>
          <TabPanel id="claims" activeTab={activeTab}>
            <ClaimsTab idea={idea} update={update} editing={editing} />
          </TabPanel>
          <TabPanel id="red-team" activeTab={activeTab}>
            <RedTeamTab idea={idea} update={update} editing={editing} />
          </TabPanel>
          <TabPanel id="prior-art" activeTab={activeTab}>
            <PriorArtTab idea={idea} update={update} />
          </TabPanel>
        </Tabs>
      </div>

      {/* Right sidebar */}
      <div className="w-full lg:w-80 shrink-0 space-y-4">
        {/* Score matrix */}
        <Card>
          <ScoreMatrix
            score={idea.score}
            onChange={(score: IdeaScore) => update({ score })}
          />
          {idea.score && (
            <div className="mt-3 pt-3 border-t border-border-default">
              <div
                className="text-sm font-semibold"
                style={{ color: getScoreVerdict(getTotalScore(idea.score)).color }}
              >
                {getScoreVerdict(getTotalScore(idea.score)).label} ({getTotalScore(idea.score)}/9)
              </div>
            </div>
          )}
        </Card>

        {/* Alice score */}
        {idea.aliceScore ? (
          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-2">Alice / 101 Score</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-text-primary">{idea.aliceScore.overallScore}</span>
              <span className="text-xs text-text-muted">/100</span>
              <Badge
                variant="solid"
                color={getAliceRiskColor(idea.aliceScore.abstractIdeaRisk)}
              >
                {idea.aliceScore.abstractIdeaRisk} risk
              </Badge>
            </div>
            <p className="text-xs text-text-secondary">{idea.aliceScore.practicalApplication}</p>
          </Card>
        ) : (
          <AliceCheckButton idea={idea} update={update} />
        )}

        {/* Business Alignment */}
        <AlignmentPanel idea={idea} />

        {/* Status */}
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Status</h3>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update({ status: opt.value })}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  idea.status === opt.value
                    ? "bg-accent-gold/20 text-accent-gold"
                    : "bg-surface-deep text-text-secondary hover:text-text-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Tags */}
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Tags</h3>
          <TagInput
            tags={idea.tags}
            onChange={(tags) => update({ tags })}
            placeholder="Add tags..."
          />
        </Card>

        {/* Metadata */}
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Metadata</h3>
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <dt className="text-text-muted">Created</dt>
              <dd className="text-text-secondary">{timeAgo(idea.createdAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Framework</dt>
              <dd className="text-text-secondary">{idea.frameworkUsed === "none" ? "Freeform" : idea.frameworkUsed.toUpperCase()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Phase</dt>
              <dd className="text-text-secondary capitalize">{idea.phase}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">ID</dt>
              <dd className="text-text-muted font-mono">{idea.id.slice(0, 8)}</dd>
            </div>
          </dl>
        </Card>
      </div>
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
      <h3 className="text-sm font-semibold text-text-primary mb-2">Alice / 101 Score</h3>
      <p className="text-xs text-text-secondary mb-3">
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

  return (
    <div className="space-y-6">
      <Section label="Problem Statement" refineSlot={
        editing && <AIRefineButton field="problemStatement" value={idea.problemStatement} context={context} onAccept={(v) => update({ problemStatement: v })} />
      }>
        {editing ? (
          <Textarea
            value={idea.problemStatement}
            onChange={(e) => update({ problemStatement: e.target.value })}
            rows={4}
          />
        ) : (
          <p className="text-sm text-text-secondary whitespace-pre-wrap">
            {idea.problemStatement || "No problem statement yet."}
          </p>
        )}
      </Section>

      <Section label="Existing Approach">
        {editing ? (
          <Textarea
            value={idea.existingApproach}
            onChange={(e) => update({ existingApproach: e.target.value })}
            rows={3}
          />
        ) : (
          <p className="text-sm text-text-secondary whitespace-pre-wrap">
            {idea.existingApproach || "Not described."}
          </p>
        )}
      </Section>

      <Section label="Proposed Solution" refineSlot={
        editing && <AIRefineButton field="proposedSolution" value={idea.proposedSolution} context={context} onAccept={(v) => update({ proposedSolution: v })} />
      }>
        {editing ? (
          <Textarea
            value={idea.proposedSolution}
            onChange={(e) => update({ proposedSolution: e.target.value })}
            rows={3}
          />
        ) : (
          <p className="text-sm text-text-secondary whitespace-pre-wrap">
            {idea.proposedSolution || "Not described."}
          </p>
        )}
      </Section>

      <Section label="Technical Approach" refineSlot={
        editing && <AIRefineButton field="technicalApproach" value={idea.technicalApproach} context={context} onAccept={(v) => update({ technicalApproach: v })} />
      }>
        {editing ? (
          <Textarea
            value={idea.technicalApproach}
            onChange={(e) => update({ technicalApproach: e.target.value })}
            rows={4}
          />
        ) : (
          <p className="text-sm text-text-secondary whitespace-pre-wrap">
            {idea.technicalApproach || "Not described."}
          </p>
        )}
      </Section>

      <Section label="Contradiction Resolved" refineSlot={
        editing && <AIRefineButton field="contradictionResolved" value={idea.contradictionResolved} context={context} onAccept={(v) => update({ contradictionResolved: v })} />
      }>
        {editing ? (
          <Textarea
            value={idea.contradictionResolved}
            onChange={(e) => update({ contradictionResolved: e.target.value })}
            rows={2}
          />
        ) : (
          <p className="text-sm text-text-secondary whitespace-pre-wrap">
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
        <p className="text-sm text-text-secondary">
          Choose an inventive framework to structure your thinking:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FRAMEWORK_OPTIONS.map((fw) => (
            <button
              key={fw.value}
              onClick={() => selectFramework(fw.value)}
              className="text-left p-4 rounded-xl border border-border-default bg-surface-card hover:border-accent-gold/50 hover:bg-surface-elevated transition-all"
            >
              <h4 className="text-sm font-semibold text-text-primary mb-1">{fw.label}</h4>
              <p className="text-xs text-text-secondary">{fw.desc}</p>
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
        <div className="text-sm text-text-secondary">
          Framework: <span className="font-semibold text-text-primary">{idea.frameworkUsed.toUpperCase()}</span>
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
          <h4 className="text-sm font-semibold text-text-primary mb-2">TRIZ Data</h4>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-text-muted">Improving:</dt><dd className="text-text-secondary">{idea.frameworkData.triz.improving || "—"}</dd></div>
            <div><dt className="text-text-muted">Worsening:</dt><dd className="text-text-secondary">{idea.frameworkData.triz.worsening || "—"}</dd></div>
            <div><dt className="text-text-muted">Resolution:</dt><dd className="text-text-secondary">{idea.frameworkData.triz.resolution || "—"}</dd></div>
          </dl>
        </Card>
      )}
      {idea.frameworkData.ck && idea.frameworkUsed === "ck" && (
        <Card>
          <h4 className="text-sm font-semibold text-text-primary mb-2">C-K Theory</h4>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-text-muted">Concepts:</dt><dd className="text-text-secondary whitespace-pre-wrap">{idea.frameworkData.ck.concepts || "—"}</dd></div>
            <div><dt className="text-text-muted">Knowledge:</dt><dd className="text-text-secondary whitespace-pre-wrap">{idea.frameworkData.ck.knowledge || "—"}</dd></div>
            <div><dt className="text-text-muted">Opportunity:</dt><dd className="text-text-secondary whitespace-pre-wrap">{idea.frameworkData.ck.opportunity || "—"}</dd></div>
          </dl>
        </Card>
      )}
      {idea.frameworkData.sit && idea.frameworkUsed === "sit" && (
        <Card>
          <h4 className="text-sm font-semibold text-text-primary mb-2">SIT Templates</h4>
          <dl className="space-y-2 text-sm">
            {Object.entries(idea.frameworkData.sit).map(([k, v]) => (
              <div key={k}><dt className="text-text-muted capitalize">{k}:</dt><dd className="text-text-secondary whitespace-pre-wrap">{v || "—"}</dd></div>
            ))}
          </dl>
        </Card>
      )}
      {idea.frameworkData.fmea && idea.frameworkUsed === "fmea" && (
        <Card>
          <h4 className="text-sm font-semibold text-text-primary mb-2">FMEA Entries</h4>
          <p className="text-xs text-text-secondary">{idea.frameworkData.fmea.length} failure mode(s) analyzed</p>
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
      technicalApproach: idea.technicalApproach,
      proposedSolution: idea.proposedSolution,
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
        <p className="text-sm text-text-secondary">
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
        <div className="space-y-4 pt-4 border-t border-border-default">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Manual Editing</h4>
          <Section label="Method Claim">
            <Textarea
              value={claim?.methodClaim ?? ""}
              onChange={(e) =>
                update({ claimDraft: { ...(claim ?? { methodClaim: "", systemClaim: "", crmClaim: "", notes: "" }), methodClaim: e.target.value } })
              }
              rows={5}
              placeholder="A method for [verb]-ing ... comprising: [step a], [step b]..."
            />
          </Section>
          <Section label="System Claim">
            <Textarea
              value={claim?.systemClaim ?? ""}
              onChange={(e) =>
                update({ claimDraft: { ...(claim ?? { methodClaim: "", systemClaim: "", crmClaim: "", notes: "" }), systemClaim: e.target.value } })
              }
              rows={5}
              placeholder="A system comprising: a processor; a memory storing instructions..."
            />
          </Section>
          <Section label="Computer-Readable Medium Claim">
            <Textarea
              value={claim?.crmClaim ?? ""}
              onChange={(e) =>
                update({ claimDraft: { ...(claim ?? { methodClaim: "", systemClaim: "", crmClaim: "", notes: "" }), crmClaim: e.target.value } })
              }
              rows={5}
              placeholder="A non-transitory computer-readable medium storing instructions..."
            />
          </Section>
        </div>
      )}

      {/* No claims and not editing */}
      {!claim && !editing && (
        <div className="py-8 text-center">
          <p className="text-sm text-text-secondary">No claim drafts yet.</p>
          <p className="text-xs text-text-muted mt-1">Click &quot;Generate Claims&quot; above to create AI-drafted claim skeletons.</p>
        </div>
      )}
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
        <p className="text-sm text-text-secondary">
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
            <h4 className="text-xs font-semibold text-accent-gold uppercase tracking-wider mb-2">AI Critique</h4>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{result.critique}</p>
          </Card>

          <CollapsibleList title="Weaknesses" items={result.weaknesses} color="#ef4444" />
          <CollapsibleList title="Prior Art Concerns" items={result.priorArtConcerns} color="#f59e0b" />
          <CollapsibleList title="Alice / 101 Risks" items={result.aliceRisks} color="#f97316" />
          <CollapsibleList title="Recommendations" items={result.recommendations} color="#10b981" />
        </div>
      )}

      {/* Freeform notes */}
      <div className="pt-2">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Your Notes</h4>
        {editing ? (
          <Textarea
            value={idea.redTeamNotes}
            onChange={(e) => update({ redTeamNotes: e.target.value })}
            rows={8}
            placeholder="List potential weaknesses, prior art concerns, Alice/101 risks, claim ambiguities..."
          />
        ) : (
          <p className="text-sm text-text-secondary whitespace-pre-wrap">
            {idea.redTeamNotes || "No red team notes yet."}
          </p>
        )}
      </div>
    </div>
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
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </h4>
          {results.map((r) => (
            <PatentResultCard key={r.patentNumber} result={r} />
          ))}
        </div>
      )}

      {/* Prior art notes */}
      <div className="pt-4 border-t border-border-default">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Prior Art Notes</h4>
          <button
            onClick={() => setNotesEditing(!notesEditing)}
            className="text-[10px] text-accent-gold hover:underline"
          >
            {notesEditing ? "Done" : "Edit"}
          </button>
        </div>
        {notesEditing ? (
          <Textarea
            value={idea.priorArtNotes}
            onChange={(e) => update({ priorArtNotes: e.target.value })}
            rows={5}
            placeholder="Document prior art findings, relevant patents, and differentiation points..."
          />
        ) : (
          <p className="text-sm text-text-secondary whitespace-pre-wrap">
            {idea.priorArtNotes || "No prior art notes yet. Search above and document your findings here."}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function Section({ label, children, refineSlot }: { label: string; children: React.ReactNode; refineSlot?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</h4>
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
    <div className="rounded-lg border border-border-default overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-surface-deep hover:bg-surface-elevated transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-semibold text-text-primary">{title}</span>
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
            <li key={i} className="text-xs text-text-secondary flex gap-2">
              <span className="text-text-muted shrink-0">{i + 1}.</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
