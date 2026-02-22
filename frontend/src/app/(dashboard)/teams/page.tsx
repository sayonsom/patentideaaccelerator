"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { listTeamsForUser, listTeamsForOrg } from "@/lib/actions/teams-management";
import { Button, Card, Spinner, EmptyState } from "@/components/ui";

interface VoltEdgeTeam {
  id: string;
  name: string;
  memberCount?: number;
}

export default function TeamsPage() {
  const { data: session, status } = useSession();
  const [teams, setTeams] = useState<VoltEdgeTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const isOrgAdmin =
    session?.user?.orgRole === "business_admin" ||
    session?.user?.orgRole === "team_admin";

  useEffect(() => {
    if (session?.user?.id) {
      setLoading(true);
      const fetcher =
        isOrgAdmin && session.user.orgId
          ? listTeamsForOrg(session.user.orgId)
          : listTeamsForUser(session.user.id);
      fetcher
        .then((data) => setTeams(data))
        .catch(() => setTeams([]))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, session?.user?.orgId, session?.user?.orgRole]);

  if (status === "loading" || loading) {
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
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Teams</h1>
          {isOrgAdmin && session?.user?.orgId && (
            <p className="text-xs text-text-muted mt-0.5">All organization teams</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/teams/join">
            <Button variant="ghost" size="sm">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                />
              </svg>
              Join Team
            </Button>
          </Link>
          <Link href="/teams/new">
            <Button variant="accent" size="sm">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Create Team
            </Button>
          </Link>
        </div>
      </div>

      {/* Teams grid or empty state */}
      {teams.length === 0 ? (
        <EmptyState
          icon={
            <svg
              className="w-12 h-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
              />
            </svg>
          }
          title="No teams yet"
          description="Create or join a team to start collaborating on patent ideas."
          action={
            <div className="flex items-center gap-3">
              <Link href="/teams/new">
                <Button variant="accent">Create a team</Button>
              </Link>
              <Link href="/teams/join">
                <Button variant="secondary">Join a team</Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`} className="block group">
              <Card hover padding="md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-ink group-hover:text-blue-ribbon transition-colors">
                      {team.name}
                    </h3>
                    <p className="text-xs text-text-muted mt-1">
                      {team.memberCount ?? 0}{" "}
                      {(team.memberCount ?? 0) === 1 ? "member" : "members"}
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-text-muted group-hover:text-blue-ribbon transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
