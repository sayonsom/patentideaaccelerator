"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useGoalStore, useIdeaStore } from "@/lib/store";
import { Button, Card, EmptyState, Modal, Input, Textarea } from "@/components/ui";
import type { BusinessGoal, Idea } from "@/lib/types";

// ─── Color presets for goals ─────────────────────────────────────

const GOAL_COLORS = [
  "#4F83CC", "#1F4CEB", "#2F7F9D", "#2E6F4E", "#C69214",
  "#7A2E2E", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316",
];

function getScoreColor(score: number): string {
  if (score >= 8) return "#10b981";
  if (score >= 5) return "#f59e0b";
  if (score >= 3) return "#f97316";
  return "#6B7280";
}

function getAggregateAlignment(idea: Idea, goalIds: string[]): number | null {
  const scores = idea.alignmentScores.filter((s) => goalIds.includes(s.goalId));
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((sum, s) => sum + s.score, 0) / scores.length) * 10) / 10;
}

// ─── Main Page ───────────────────────────────────────────────────

export default function AlignmentPage() {
  const { data: session } = useSession();
  const { goals, loading: goalsLoading, loadGoals, addGoal, updateGoal, removeGoal } = useGoalStore();
  const { ideas, loadIdeas } = useIdeaStore();

  const [showCreate, setShowCreate] = useState(false);
  const [editGoal, setEditGoal] = useState<BusinessGoal | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      loadGoals(session.user.id);
      loadIdeas(session.user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const goalIds = goals.map((g) => g.id);

  // Sort ideas by aggregate alignment descending
  const scoredIdeas = ideas
    .map((idea) => ({
      idea,
      aggregate: getAggregateAlignment(idea, goalIds),
    }))
    .sort((a, b) => (b.aggregate ?? -1) - (a.aggregate ?? -1));

  async function handleMoveUp(goal: BusinessGoal, idx: number) {
    if (idx <= 0) return;
    const prev = goals[idx - 1];
    await updateGoal(goal.id, { sortOrder: prev.sortOrder });
    await updateGoal(prev.id, { sortOrder: goal.sortOrder });
    if (session?.user?.id) loadGoals(session.user.id);
  }

  async function handleMoveDown(goal: BusinessGoal, idx: number) {
    if (idx >= goals.length - 1) return;
    const next = goals[idx + 1];
    await updateGoal(goal.id, { sortOrder: next.sortOrder });
    await updateGoal(next.id, { sortOrder: goal.sortOrder });
    if (session?.user?.id) loadGoals(session.user.id);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this business goal? All alignment scores for this goal will be removed.")) return;
    await removeGoal(id);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-text-primary">Business Alignment</h1>
        <Button variant="accent" size="sm" onClick={() => setShowCreate(true)}>
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Goal
        </Button>
      </div>

      {/* Goals section */}
      {goals.length === 0 && !goalsLoading ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
            </svg>
          }
          title="No business goals yet"
          description="Define your organization's strategic focus areas to score patent ideas on business alignment."
          action={
            <Button variant="accent" onClick={() => setShowCreate(true)}>
              Create your first goal
            </Button>
          }
        />
      ) : (
        <>
          {/* Goal cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {goals.map((goal, idx) => (
              <Card key={goal.id} className="relative">
                <div className="flex items-start gap-3">
                  <div
                    className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                    style={{ backgroundColor: goal.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2">{goal.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border-subtle">
                  <button
                    onClick={() => handleMoveUp(goal, idx)}
                    disabled={idx === 0}
                    className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                    title="Move up"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveDown(goal, idx)}
                    disabled={idx === goals.length - 1}
                    className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                    title="Move down"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => setEditGoal(goal)}
                    className="p-1 text-text-muted hover:text-accent-gold transition-colors"
                    title="Edit"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-1 text-text-muted hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Alignment Matrix */}
          {ideas.length > 0 && goals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Alignment Matrix</h2>
              <div className="overflow-x-auto rounded-lg border border-border-default">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface-deep">
                      <th className="text-left px-3 py-2 font-semibold text-text-primary sticky left-0 bg-surface-deep min-w-[200px]">
                        Idea
                      </th>
                      {goals.map((g) => (
                        <th key={g.id} className="px-3 py-2 text-center font-semibold text-text-primary min-w-[90px]">
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                            <span className="truncate">{g.title}</span>
                          </div>
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center font-semibold text-accent-gold min-w-[70px]">
                        Avg
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoredIdeas.map(({ idea, aggregate }) => (
                      <tr key={idea.id} className="border-t border-border-subtle hover:bg-surface-deep/50">
                        <td className="px-3 py-2 sticky left-0 bg-surface-panel">
                          <Link href={`/ideas/${idea.id}`} className="text-text-primary hover:text-accent-gold font-medium truncate block max-w-[200px]">
                            {idea.title || "Untitled"}
                          </Link>
                        </td>
                        {goals.map((g) => {
                          const score = idea.alignmentScores.find((s) => s.goalId === g.id);
                          return (
                            <td key={g.id} className="px-3 py-2 text-center">
                              {score ? (
                                <span
                                  className="inline-block px-1.5 py-0.5 rounded text-xs font-bold"
                                  style={{
                                    color: getScoreColor(score.score),
                                    backgroundColor: `${getScoreColor(score.score)}15`,
                                  }}
                                >
                                  {score.score}
                                </span>
                              ) : (
                                <span className="text-text-muted">--</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center">
                          {aggregate !== null ? (
                            <span
                              className="font-bold"
                              style={{ color: getScoreColor(aggregate) }}
                            >
                              {aggregate}
                            </span>
                          ) : (
                            <span className="text-text-muted">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Goal Modal */}
      <GoalModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={async (data) => {
          if (session?.user?.id) {
            await addGoal({ ...data, userId: session.user.id });
          }
          setShowCreate(false);
        }}
      />

      {/* Edit Goal Modal */}
      {editGoal && (
        <GoalModal
          open
          goal={editGoal}
          onClose={() => setEditGoal(null)}
          onSave={async (data) => {
            await updateGoal(editGoal.id, data);
            setEditGoal(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Goal Create/Edit Modal ─────────────────────────────────────

function GoalModal({
  open,
  goal,
  onClose,
  onSave,
}: {
  open: boolean;
  goal?: BusinessGoal;
  onClose: () => void;
  onSave: (data: { title: string; description: string; color: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [color, setColor] = useState(goal?.color ?? GOAL_COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(goal?.title ?? "");
    setDescription(goal?.description ?? "");
    setColor(goal?.color ?? GOAL_COLORS[0]);
  }, [goal]);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({ title: title.trim(), description: description.trim(), color });
    setSaving(false);
  }

  return (
    <Modal
      open={open}
      title={goal ? "Edit Business Goal" : "Add Business Goal"}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Goal Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Cloud Infrastructure Growth"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this business goal encompasses..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Color</label>
          <div className="flex gap-2 flex-wrap">
            {GOAL_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  color === c ? "border-white scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="accent" onClick={handleSave} disabled={!title.trim() || saving}>
            {goal ? "Save Changes" : "Create Goal"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
