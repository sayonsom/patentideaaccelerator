"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useIdeaStore } from "@/lib/store";
import { IdeaDetail } from "@/components/ideas/IdeaDetail";
import { Spinner } from "@/components/ui";
import { ChatPanel, ChatToggleButton } from "@/components/chat/ChatPanel";
import type { ChatContext } from "@/lib/types";

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: session, status } = useSession();
  const loadIdeas = useIdeaStore((s) => s.loadIdeas);
  const idea = useIdeaStore((s) => s.ideas.find((i) => i.id === id));
  const loaded = useIdeaStore((s) => s.ideas.length > 0 || !s.loading);

  useEffect(() => {
    if (session?.user?.id) {
      loadIdeas(session.user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Build chat context from the current idea (must be before early returns)
  const chatContext: ChatContext = useMemo(
    () => ({
      type: "idea" as const,
      id: idea?.id ?? null,
      label: idea?.title || "Untitled Idea",
      data: {
        title: idea?.title,
        problemStatement: idea?.problemStatement,
        proposedSolution: idea?.proposedSolution,
        technicalApproach: idea?.technicalApproach,
        contradictionResolved: idea?.contradictionResolved,
        frameworkUsed: idea?.frameworkUsed,
        techStack: idea?.techStack,
        status: idea?.status,
        score: idea?.score,
        aliceScore: idea?.aliceScore,
        claimDraft: idea?.claimDraft,
        redTeamNotes: idea?.redTeamNotes,
      },
    }),
    [idea]
  );

  if (status === "loading" || !loaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h2 className="text-lg font-medium text-ink mb-2">Idea not found</h2>
        <p className="text-sm text-neutral-dark mb-4">This idea may have been deleted.</p>
        <button
          onClick={() => router.push("/ideas")}
          className="text-sm text-blue-ribbon hover:underline"
        >
          Back to Ideas
        </button>
      </div>
    );
  }

  return (
    <>
      <IdeaDetail idea={idea} />
      <ChatToggleButton context={chatContext} />
      <ChatPanel context={chatContext} />
    </>
  );
}
