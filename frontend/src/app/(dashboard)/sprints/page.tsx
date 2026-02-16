"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTeamStore } from "@/lib/store";
import { SPRINT_PHASES, SESSION_MODES } from "@/lib/constants";
import { uid } from "@/lib/utils";
import { Button, Card, Badge, EmptyState, Modal, Input } from "@/components/ui";
import { DEFAULT_TEAM_TIME_BUDGET_SECONDS } from "@/lib/team-timer";
import type { Team, Member } from "@/lib/types";

export default function SprintsPage() {
  const { data: session } = useSession();
  const { teams, loadTeams, addTeam } = useTeamStore();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadTeams(session.user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-text-primary">Invention Sprints</h1>
        <Button variant="accent" size="sm" onClick={() => setShowCreate(true)}>
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Sprint
        </Button>
      </div>

      {/* Process overview */}
      <div className="bg-surface-deep rounded-lg border border-border-default p-4 mb-6">
        <div className="text-xs font-bold text-accent-gold mb-2">THE PROCESS</div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {SESSION_MODES.map((m) => (
            <div key={m.key}>
              <div className="text-sm font-bold" style={{ color: m.color }}>{m.label}</div>
              <div className="text-xs text-text-muted">{m.target}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sprint list */}
      {teams.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          }
          title="No sprints yet"
          description="Run structured invention sprints with your team. 72-hour sessions to go from concepts to filings."
          action={
            <Button variant="accent" onClick={() => setShowCreate(true)}>Create your first sprint</Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {teams.map((team) => {
            const phaseCounts = SPRINT_PHASES.map((p) => ({
              ...p,
              count: team.ideas.filter((i) => i.phase === p.key).length,
            }));
            return (
              <Link key={team.id} href={`/sprints/${team.id}`}>
                <Card className="hover:border-accent-gold/30 transition-colors cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-accent-gold text-lg">{"\u25B3"}</span>
                        <h3 className="text-base font-bold text-text-primary">{team.name}</h3>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {team.members.map((m) => m.name).join(", ")}
                        {" \u00B7 "}{team.ideas.length} concept{team.ideas.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="bg-surface-deep rounded-lg px-3 py-2 text-center">
                      <div className="text-xl font-bold font-mono text-text-primary">{team.ideas.length}</div>
                      <div className="text-[10px] text-text-muted font-semibold">CONCEPTS</div>
                    </div>
                  </div>

                  {/* Phase bar */}
                  {team.ideas.length > 0 && (
                    <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
                      {phaseCounts.filter((p) => p.count > 0).map((p) => (
                        <div key={p.key} className="rounded-full" style={{ flex: p.count, backgroundColor: p.color + "60" }} />
                      ))}
                    </div>
                  )}

                  <div className="flex gap-1.5 mt-2">
                    <Badge variant="outline">
                      {team.sessionMode}
                    </Badge>
                    <Badge variant="outline">
                      {team.sprintPhase}
                    </Badge>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create sprint modal */}
      <CreateSprintModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={(team) => {
          addTeam(team);
          setShowCreate(false);
        }}
      />
    </div>
  );
}

// ─── Create Sprint Modal ──────────────────────────────────────────

function CreateSprintModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (team: Team) => void;
}) {
  const [name, setName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);

  const addMember = () => {
    if (!memberName.trim()) return;
    setMembers((prev) => [
      ...prev,
      { id: uid(), name: memberName.trim(), email: "", interests: [] },
    ]);
    setMemberName("");
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const team: Team = {
      id: uid(),
      name: name.trim(),
      members,
      dataMinister: null,
      ideas: [],
      sessionMode: "quantity",
      sprintPhase: "foundation",
      lastActivityAt: Date.now(),
      timer: {
        budgetSeconds: DEFAULT_TEAM_TIME_BUDGET_SECONDS,
        spentSeconds: 0,
        runningSinceMs: null,
        startedAtMs: null,
        startedStage: null,
      },
    };
    onCreate(team);
    setName("");
    setMembers([]);
  };

  return (
    <Modal open={open} title="Create Invention Sprint" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Sprint Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Q1 Patent Sprint" />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Team Members</label>
          <div className="flex gap-2 mb-2">
            <Input
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Member name"
              onKeyDown={(e) => e.key === "Enter" && addMember()}
              className="flex-1"
            />
            <Button variant="secondary" size="sm" onClick={addMember} disabled={!memberName.trim()}>
              Add
            </Button>
          </div>
          {members.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {members.map((m) => (
                <span key={m.id} className="inline-flex items-center gap-1 px-2 py-1 bg-surface-deep rounded text-xs text-text-secondary">
                  {m.name}
                  <button onClick={() => removeMember(m.id)} className="text-text-muted hover:text-red-400">&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="accent" onClick={handleCreate} disabled={!name.trim()}>
            Create Sprint
          </Button>
        </div>
      </div>
    </Modal>
  );
}
