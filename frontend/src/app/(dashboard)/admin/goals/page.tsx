"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button, Card, Modal, Input, Textarea, Spinner, EmptyState } from "@/components/ui";
import {
  listGoalsAction,
  createGoalAction,
  updateGoalAction,
  deleteGoalAction,
} from "@/lib/actions/goals";
import type { BusinessGoal } from "@/lib/types";

// ─── Color presets for goals ──────────────────────────────────

const GOAL_COLORS = [
  "#2251FF", "#1F4CEB", "#2F7F9D", "#2E6F4E", "#C69214",
  "#7A2E2E", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316",
];

// ─── Main Page ────────────────────────────────────────────────

export default function AdminGoalsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const orgId = session?.user?.orgId;

  const [goals, setGoals] = useState<BusinessGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editGoal, setEditGoal] = useState<BusinessGoal | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const data = await listGoalsAction(userId!);
        setGoals(data);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  async function handleCreate(data: { title: string; description: string; color: string }) {
    if (!userId) return;
    try {
      const created = await createGoalAction({
        userId,
        title: data.title,
        description: data.description,
        color: data.color,
      });
      setGoals((prev) => [...prev, created]);
    } catch {
      // handle error
    }
    setShowCreate(false);
  }

  async function handleUpdate(goalId: string, data: { title: string; description: string; color: string }) {
    try {
      const updated = await updateGoalAction(goalId, data);
      if (updated) {
        setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
      }
    } catch {
      // handle error
    }
    setEditGoal(null);
  }

  async function handleDelete(goalId: string) {
    if (!window.confirm("Delete this innovation goal? This action cannot be undone.")) return;
    try {
      await deleteGoalAction(goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch {
      // handle error
    }
  }

  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h3 className="text-lg font-medium text-ink mb-1">
          You are not part of an organization yet.
        </h3>
        <p className="text-sm text-text-secondary max-w-md">
          Create or join an organization to manage innovation goals.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-ink">Innovation Focus Areas</h1>
        <Button variant="accent" size="sm" onClick={() => setShowCreate(true)}>
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Goal
        </Button>
      </div>

      {/* Goals list */}
      {goals.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
            </svg>
          }
          title="No innovation goals yet"
          description="Define your organization's strategic innovation focus areas. Goals help align patent ideation with business objectives."
          action={
            <Button variant="accent" onClick={() => setShowCreate(true)}>
              Create your first goal
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <Card key={goal.id} className="relative group">
              <div className="flex items-start gap-3">
                <div
                  className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0"
                  style={{ backgroundColor: goal.color }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-ink">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-xs text-text-secondary mt-1.5 line-clamp-3">
                      {goal.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions footer */}
              <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-border-subtle">
                <button
                  onClick={() => setEditGoal(goal)}
                  className="p-1.5 text-neutral-light hover:text-blue-ribbon transition-colors rounded hover:bg-accent-light"
                  title="Edit goal"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="p-1.5 text-neutral-light hover:text-red-500 transition-colors rounded hover:bg-red-50"
                  title="Delete goal"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Goal Modal */}
      <GoalModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={handleCreate}
      />

      {/* Edit Goal Modal */}
      {editGoal && (
        <GoalModal
          open
          goal={editGoal}
          onClose={() => setEditGoal(null)}
          onSave={(data) => handleUpdate(editGoal.id, data)}
        />
      )}
    </div>
  );
}

// ─── Goal Create/Edit Modal ──────────────────────────────────

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
      title={goal ? "Edit Innovation Goal" : "Add Innovation Goal"}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-normal text-text-secondary mb-1">Goal Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., AI/ML Infrastructure Scaling"
          />
        </div>

        <div>
          <label className="block text-xs font-normal text-text-secondary mb-1">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the strategic focus area and what types of innovations align with it..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-xs font-normal text-text-secondary mb-1">Color</label>
          <div className="flex gap-2 flex-wrap">
            {GOAL_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  color === c ? "border-ink scale-110 ring-2 ring-offset-1 ring-blue-ribbon/30" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="accent"
            onClick={handleSave}
            disabled={!title.trim() || saving}
            loading={saving}
          >
            {goal ? "Save Changes" : "Create Goal"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
