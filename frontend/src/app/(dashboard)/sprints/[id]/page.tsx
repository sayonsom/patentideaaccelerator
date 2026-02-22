"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSprintStore } from "@/lib/store";
import { SprintBoard } from "@/components/sprints/SprintBoard";
import { Spinner } from "@/components/ui";

export default function SprintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const {
    activeSprint,
    sprintIdeas,
    candidateIdeas,
    members,
    loading,
    loadSprintDetail,
    loadCandidates,
  } = useSprintStore();

  useEffect(() => {
    if (id) {
      loadSprintDetail(id);
      loadCandidates(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading && !activeSprint) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!activeSprint) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-medium text-ink mb-2">Sprint not found</h2>
        <p className="text-sm text-text-muted mb-4">This sprint may have been deleted.</p>
        <button
          onClick={() => router.push("/sprints")}
          className="text-sm text-blue-ribbon hover:underline"
        >
          Back to sprints
        </button>
      </div>
    );
  }

  return (
    <SprintBoard
      sprint={activeSprint}
      ideas={sprintIdeas}
      candidates={candidateIdeas}
      members={members}
      onBack={() => router.push("/sprints")}
    />
  );
}
