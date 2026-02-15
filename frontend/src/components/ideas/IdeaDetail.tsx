"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Idea, IdeaScore } from "@/lib/types";
import { useIdeaStore } from "@/lib/store";
import { Button, Tabs, TabPanel, Input, Textarea, Badge, Card, TagInput } from "@/components/ui";
import { ScoreMatrix } from "./ScoreMatrix";
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

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: tabbed content */}
      <div className="flex-1 min-w-0">
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
            <FrameworkTab idea={idea} />
          </TabPanel>
          <TabPanel id="claims" activeTab={activeTab}>
            <ClaimsTab idea={idea} update={update} editing={editing} />
          </TabPanel>
          <TabPanel id="red-team" activeTab={activeTab}>
            <RedTeamTab idea={idea} update={update} editing={editing} />
          </TabPanel>
          <TabPanel id="prior-art" activeTab={activeTab}>
            <PriorArtTab idea={idea} />
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
        {idea.aliceScore && (
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
        )}

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

// ─── Tab Components ────────────────────────────────────────────

function OverviewTab({ idea, update, editing }: { idea: Idea; update: (u: Partial<Idea>) => void; editing: boolean }) {
  return (
    <div className="space-y-6">
      <Section label="Problem Statement">
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

      <Section label="Proposed Solution">
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

      <Section label="Technical Approach">
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

      <Section label="Contradiction Resolved">
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

function FrameworkTab({ idea }: { idea: Idea }) {
  if (idea.frameworkUsed === "none") {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-text-secondary">No framework was used for this idea.</p>
        <p className="text-xs text-text-muted mt-1">Visit the Frameworks page to apply TRIZ, SIT, or C-K Theory.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-text-secondary">
        Framework: <span className="font-semibold text-text-primary">{idea.frameworkUsed.toUpperCase()}</span>
      </div>
      {idea.frameworkData.triz && (
        <Card>
          <h4 className="text-sm font-semibold text-text-primary mb-2">TRIZ Data</h4>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-text-muted">Improving:</dt><dd className="text-text-secondary">{idea.frameworkData.triz.improving || "—"}</dd></div>
            <div><dt className="text-text-muted">Worsening:</dt><dd className="text-text-secondary">{idea.frameworkData.triz.worsening || "—"}</dd></div>
            <div><dt className="text-text-muted">Resolution:</dt><dd className="text-text-secondary">{idea.frameworkData.triz.resolution || "—"}</dd></div>
          </dl>
        </Card>
      )}
      {idea.frameworkData.ck && (
        <Card>
          <h4 className="text-sm font-semibold text-text-primary mb-2">C-K Theory</h4>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-text-muted">Concepts:</dt><dd className="text-text-secondary whitespace-pre-wrap">{idea.frameworkData.ck.concepts || "—"}</dd></div>
            <div><dt className="text-text-muted">Knowledge:</dt><dd className="text-text-secondary whitespace-pre-wrap">{idea.frameworkData.ck.knowledge || "—"}</dd></div>
            <div><dt className="text-text-muted">Opportunity:</dt><dd className="text-text-secondary whitespace-pre-wrap">{idea.frameworkData.ck.opportunity || "—"}</dd></div>
          </dl>
        </Card>
      )}
      {!idea.frameworkData.triz && !idea.frameworkData.ck && !idea.frameworkData.sit && (
        <p className="text-sm text-text-muted">Framework worksheet data will appear here once filled out.</p>
      )}
    </div>
  );
}

function ClaimsTab({ idea, update, editing }: { idea: Idea; update: (u: Partial<Idea>) => void; editing: boolean }) {
  const claim = idea.claimDraft;
  if (!claim && !editing) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-text-secondary">No claim drafts yet.</p>
        <p className="text-xs text-text-muted mt-1">AI claim generation will be available after integration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Section label="Method Claim">
        {editing ? (
          <Textarea
            value={claim?.methodClaim ?? ""}
            onChange={(e) =>
              update({ claimDraft: { ...(claim ?? { methodClaim: "", systemClaim: "", crmClaim: "", notes: "" }), methodClaim: e.target.value } })
            }
            rows={5}
            placeholder="A method for [verb]-ing ... comprising: [step a], [step b]..."
          />
        ) : (
          <p className="text-sm text-text-secondary whitespace-pre-wrap font-mono">
            {claim?.methodClaim || "—"}
          </p>
        )}
      </Section>

      <Section label="System Claim">
        {editing ? (
          <Textarea
            value={claim?.systemClaim ?? ""}
            onChange={(e) =>
              update({ claimDraft: { ...(claim ?? { methodClaim: "", systemClaim: "", crmClaim: "", notes: "" }), systemClaim: e.target.value } })
            }
            rows={5}
            placeholder="A system comprising: a processor; a memory storing instructions..."
          />
        ) : (
          <p className="text-sm text-text-secondary whitespace-pre-wrap font-mono">
            {claim?.systemClaim || "—"}
          </p>
        )}
      </Section>

      <Section label="Computer-Readable Medium Claim">
        {editing ? (
          <Textarea
            value={claim?.crmClaim ?? ""}
            onChange={(e) =>
              update({ claimDraft: { ...(claim ?? { methodClaim: "", systemClaim: "", crmClaim: "", notes: "" }), crmClaim: e.target.value } })
            }
            rows={5}
            placeholder="A non-transitory computer-readable medium storing instructions..."
          />
        ) : (
          <p className="text-sm text-text-secondary whitespace-pre-wrap font-mono">
            {claim?.crmClaim || "—"}
          </p>
        )}
      </Section>
    </div>
  );
}

function RedTeamTab({ idea, update, editing }: { idea: Idea; update: (u: Partial<Idea>) => void; editing: boolean }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Play devil&apos;s advocate. What are the weaknesses? Why might this <em>not</em> be patentable?
      </p>
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
  );
}

function PriorArtTab({ idea }: { idea: Idea }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-text-secondary">Prior art search results will appear here.</p>
      <p className="text-xs text-text-muted mt-1">Patent search integration coming in the next build.</p>
      {idea.priorArtNotes && (
        <div className="mt-4 text-left">
          <h4 className="text-xs font-semibold text-text-muted uppercase mb-1">Notes</h4>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{idea.priorArtNotes}</p>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{label}</h4>
      {children}
    </div>
  );
}
