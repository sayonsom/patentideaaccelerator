"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTeamStore, useAuthStore } from "@/lib/store";
import { SprintBoard } from "@/components/sprints/SprintBoard";
import { Spinner } from "@/components/ui";
import type { Team } from "@/lib/types";

export default function SprintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { teams, loading, loadTeams, updateTeam, getTeam } = useTeamStore();
  const initAuth = useAuthStore((s) => s.init);

  useEffect(() => {
    initAuth();
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const team = getTeam(id);

  if (loading && teams.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-semibold text-text-primary mb-2">Sprint not found</h2>
        <p className="text-sm text-text-muted mb-4">This sprint may have been deleted.</p>
        <button
          onClick={() => router.push("/sprints")}
          className="text-sm text-accent-gold hover:underline"
        >
          Back to sprints
        </button>
      </div>
    );
  }

  return (
    <SprintBoard
      team={team}
      onUpdateTeam={(updated: Team) => updateTeam(id, updated)}
      onBack={() => router.push("/sprints")}
    />
  );
}
