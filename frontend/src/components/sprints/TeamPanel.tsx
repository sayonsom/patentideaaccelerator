"use client";

import type { SprintMemberRecord } from "@/lib/types";
import { Badge, Card } from "@/components/ui";

interface TeamPanelProps {
  members: SprintMemberRecord[];
  sprintOwnerId: string;
}

export function TeamPanel({ members, sprintOwnerId }: TeamPanelProps) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-ink">Sprint Members</h3>
        <span className="text-xs font-mono font-normal text-text-muted">
          {members.length}
        </span>
      </div>

      {/* Members list */}
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.userId} className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-normal text-neutral-dark border border-border">
              {(m.user?.name ?? "?").charAt(0).toUpperCase()}
            </div>
            <span className="text-ink text-xs font-normal flex-1">
              {m.user?.name ?? m.userId}
            </span>
            {m.userId === sprintOwnerId && (
              <Badge variant="outline">Lead</Badge>
            )}
            {m.role === "data_minister" && (
              <Badge variant="outline">DM</Badge>
            )}
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-xs text-text-muted">No members yet.</p>
        )}
      </div>
    </Card>
  );
}
