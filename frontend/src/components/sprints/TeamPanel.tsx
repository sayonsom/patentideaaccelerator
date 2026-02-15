"use client";

import type { Member } from "@/lib/types";
import { Badge, Card } from "@/components/ui";

interface TeamPanelProps {
  members: Member[];
  dataMinisterId: string | null;
  activeMemberId: string | null;
  onActiveMemberChange: (id: string | null) => void;
  onDataMinisterChange?: (id: string | null) => void;
  categoryBreakdown?: { count: number; total: number };
}

export function TeamPanel({
  members,
  dataMinisterId,
  activeMemberId,
  onActiveMemberChange,
  onDataMinisterChange,
  categoryBreakdown,
}: TeamPanelProps) {
  const dm = members.find((m) => m.id === dataMinisterId);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">Team</h3>
        {categoryBreakdown && (
          <span className="text-xs font-mono font-bold text-green-400">
            {categoryBreakdown.count}/{categoryBreakdown.total} categories
          </span>
        )}
      </div>

      {/* Members list */}
      <div className="space-y-2 mb-4">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-full bg-surface-deep flex items-center justify-center text-xs font-bold text-text-secondary">
              {m.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-text-primary text-xs font-medium flex-1">{m.name}</span>
            {m.id === dataMinisterId && (
              <Badge variant="outline">DM</Badge>
            )}
          </div>
        ))}
      </div>

      {/* Data Minister selection */}
      {onDataMinisterChange && (
        <div className="mb-4">
          <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Data Minister
          </label>
          <select
            value={dataMinisterId ?? ""}
            onChange={(e) => onDataMinisterChange(e.target.value || null)}
            className="w-full px-2.5 py-1.5 text-xs bg-surface-deep border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          {dm && (
            <p className="text-[10px] text-text-muted mt-1">
              {dm.name} tracks prior art and patent search.
            </p>
          )}
        </div>
      )}

      {/* Active contributor */}
      <div>
        <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
          Contributing As
        </label>
        <select
          value={activeMemberId ?? ""}
          onChange={(e) => onActiveMemberChange(e.target.value || null)}
          className="w-full px-2.5 py-1.5 text-xs bg-surface-deep border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <p className="text-[10px] text-text-muted mt-1">
          Attribution for new ideas and edits.
        </p>
      </div>
    </Card>
  );
}
