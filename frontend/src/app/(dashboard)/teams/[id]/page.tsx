"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getTeamById, listTeamMembers, isTeamAdmin, createTeamInvite, listTeamInvites, revokeTeamInvite } from "@/lib/actions/teams-management";
import { listTeamIdeasAction } from "@/lib/actions/ideas";
import { listTeamSprintsAction } from "@/lib/actions/sprints";
import { Button, Card, Spinner, Badge, Tabs, TabPanel, Modal, Input } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import type { VoltEdgeTeam, TeamMemberRecord, TeamInvite, Idea, Sprint } from "@/lib/types";

export default function TeamDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const { data: session, status } = useSession();

  const [team, setTeam] = useState<VoltEdgeTeam | null>(null);
  const [members, setMembers] = useState<TeamMemberRecord[]>([]);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("members");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ code: string; email?: string } | null>(null);
  const [pendingInvites, setPendingInvites] = useState<TeamInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [teamIdeas, setTeamIdeas] = useState<Idea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [teamSprints, setTeamSprints] = useState<Sprint[]>([]);
  const [sprintsLoading, setSprintsLoading] = useState(false);

  // ─── Client-side membership pre-check (fast UX gate) ─────────
  // Uses teamIds[] from the JWT session to redirect immediately if
  // the user is not a member, avoiding a round-trip to the server.
  // NOTE: The real security boundary is in the server actions.
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (status !== "loading" && session?.user) {
      const isMember = session.user.teamIds?.includes(teamId);
      if (!isMember) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
    }
  }, [status, session?.user, teamId]);

  useEffect(() => {
    if (!session?.user?.id || !teamId || accessDenied) return;

    async function loadData() {
      setLoading(true);
      try {
        const [teamData, memberData, adminStatus] = await Promise.all([
          getTeamById(teamId),
          listTeamMembers(teamId),
          isTeamAdmin(teamId, session!.user.id),
        ]);
        setTeam(teamData);
        setMembers(memberData);
        setAdmin(adminStatus);
      } catch {
        // Server-side auth guard rejected — treat as no access
        setAccessDenied(true);
        setTeam(null);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, teamId, accessDenied]);

  async function loadInvites() {
    setInvitesLoading(true);
    try {
      const invites = await listTeamInvites(teamId);
      setPendingInvites(invites);
    } catch { /* silent */ }
    finally { setInvitesLoading(false); }
  }

  // ─── Lazy-load Ideas and Sprints when tabs become active ─────
  useEffect(() => {
    if (activeTab === "ideas" && teamId && !accessDenied && teamIdeas.length === 0 && !ideasLoading) {
      setIdeasLoading(true);
      listTeamIdeasAction(teamId)
        .then(setTeamIdeas)
        .catch(() => setTeamIdeas([]))
        .finally(() => setIdeasLoading(false));
    }
    if (activeTab === "sprints" && teamId && !accessDenied && teamSprints.length === 0 && !sprintsLoading) {
      setSprintsLoading(true);
      listTeamSprintsAction(teamId)
        .then(setTeamSprints)
        .catch(() => setTeamSprints([]))
        .finally(() => setSprintsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, teamId, accessDenied]);

  async function handleCreateInvite() {
    setInviteLoading(true);
    try {
      const invite = await createTeamInvite(teamId, inviteEmail.trim() || undefined, inviteRole);
      setInviteResult({ code: invite.code, email: inviteEmail.trim() || undefined });
      setInviteEmail("");
      toast("Invite created successfully!");
      await loadInvites();
    } catch {
      toast("Failed to create invite.", "error");
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    try {
      await revokeTeamInvite(inviteId);
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast("Invite revoked.");
    } catch {
      toast("Failed to revoke invite.", "error");
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard!");
    } catch {
      toast("Failed to copy.", "error");
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (accessDenied || !team) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-ink mb-2">
          {accessDenied ? "Access denied" : "Team not found"}
        </h2>
        <p className="text-sm text-text-muted mb-4">
          {accessDenied
            ? "You are not a member of this team. Ask a team admin for an invite."
            : "This team may have been removed."}
        </p>
        <button
          onClick={() => router.push("/teams")}
          className="text-sm text-blue-ribbon hover:underline"
        >
          Back to Teams
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "members", label: "Members", badge: String(members.length) },
    { id: "ideas", label: "Ideas", badge: teamIdeas.length > 0 ? String(teamIdeas.length) : undefined },
    { id: "sprints", label: "Sprints", badge: teamSprints.length > 0 ? String(teamSprints.length) : undefined },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/teams")}
            className="text-text-muted hover:text-ink transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <h1 className="text-2xl font-serif font-bold text-ink">{team.name}</h1>
        </div>
        <Link href={`/teams/${teamId}/settings`}>
          <button
            className="p-2 rounded-md text-text-muted hover:text-ink hover:bg-neutral-off-white transition-colors"
            title="Team settings"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
        {/* Members Tab */}
        <TabPanel id="members" activeTab={activeTab}>
          {admin && (
            <div className="mb-4">
              <Button variant="secondary" size="sm" onClick={() => { setInviteOpen(true); setInviteResult(null); loadInvites(); }}>
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
                Invite Member
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {members.map((member) => {
              const name = member.user?.name ?? "Unknown";
              const email = member.user?.email ?? "";
              const initials = name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "?";

              return (
                <Card key={member.userId} padding="sm" hover>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-ribbon/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-ribbon">
                          {initials}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-normal text-ink">{name}</p>
                        <p className="text-xs text-text-muted">{email}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      color={member.role === "admin" ? "#2251FF" : "#A2AAAD"}
                      size="sm"
                    >
                      {member.role}
                    </Badge>
                  </div>
                </Card>
              );
            })}

            {members.length === 0 && (
              <p className="text-sm text-text-muted text-center py-8">
                No members found.
              </p>
            )}
          </div>
        </TabPanel>

        {/* Ideas Tab */}
        <TabPanel id="ideas" activeTab={activeTab}>
          {ideasLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="md" />
            </div>
          ) : teamIdeas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg
                className="w-10 h-10 text-neutral-light mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                />
              </svg>
              <p className="text-sm text-text-muted">No team ideas yet</p>
              <p className="text-xs text-text-muted mt-1">
                Ideas created with this team scope will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {teamIdeas.map((idea) => (
                <Link key={idea.id} href={`/ideas/${idea.id}`} className="block group">
                  <Card hover padding="sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-ink group-hover:text-blue-ribbon transition-colors truncate">
                          {idea.title || "Untitled"}
                        </h4>
                        {idea.problemStatement && (
                          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                            {idea.problemStatement}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" size="sm">
                            {idea.status}
                          </Badge>
                          {idea.frameworkUsed !== "none" && (
                            <span className="text-[10px] text-text-muted uppercase">
                              {idea.frameworkUsed}
                            </span>
                          )}
                        </div>
                      </div>
                      {idea.aliceScore && (
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                            idea.aliceScore.abstractIdeaRisk === "low"
                              ? "bg-green-50 text-green-700"
                              : idea.aliceScore.abstractIdeaRisk === "medium"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          Alice {idea.aliceScore.overallScore}
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabPanel>

        {/* Sprints Tab */}
        <TabPanel id="sprints" activeTab={activeTab}>
          {sprintsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="md" />
            </div>
          ) : teamSprints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg
                className="w-10 h-10 text-neutral-light mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
              <p className="text-sm text-text-muted">No team sprints yet</p>
              <p className="text-xs text-text-muted mt-1">
                Create a sprint scoped to this team from the Sprints page.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {teamSprints.map((sprint) => (
                <Link key={sprint.id} href={`/sprints/${sprint.id}`} className="block group">
                  <Card hover padding="sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-ribbon text-sm">{"\u25B3"}</span>
                          <h4 className="text-sm font-medium text-ink group-hover:text-blue-ribbon transition-colors truncate">
                            {sprint.name}
                          </h4>
                        </div>
                        {sprint.theme && (
                          <p className="text-xs text-text-muted mt-0.5 ml-5 truncate">
                            {sprint.theme}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" size="sm">
                          {sprint.sessionMode}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {sprint.phase}
                        </Badge>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
                            sprint.status === "active"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : sprint.status === "paused"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          }`}
                        >
                          {sprint.status}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabPanel>
      </Tabs>

      {/* Invite Member Modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Team Member" maxWidth="md">
        {!inviteResult ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-normal text-ink mb-1">Email (optional)</label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
              />
              <p className="text-xs text-text-muted mt-1">Leave blank to create a generic invite code anyone can use.</p>
            </div>
            <div>
              <label className="block text-sm font-normal text-ink mb-1">Role</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInviteRole("member")}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    inviteRole === "member"
                      ? "border-accent bg-accent/5 text-accent font-normal"
                      : "border-border text-text-secondary hover:border-text-muted"
                  }`}
                >
                  Member
                </button>
                <button
                  type="button"
                  onClick={() => setInviteRole("admin")}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    inviteRole === "admin"
                      ? "border-accent bg-accent/5 text-accent font-normal"
                      : "border-border text-text-secondary hover:border-text-muted"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
            <Button variant="accent" onClick={handleCreateInvite} disabled={inviteLoading} className="w-full">
              {inviteLoading ? <Spinner size="sm" /> : "Create Invite"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              {/* Success check icon */}
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-ink mb-1">Invite Created!</h3>
              {inviteResult.email && (
                <p className="text-sm text-text-secondary">Sent to {inviteResult.email}</p>
              )}
            </div>
            <div className="bg-neutral-off-white rounded-lg p-4 text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Invite Code</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-2xl font-mono font-normal text-ink tracking-widest">{inviteResult.code}</code>
                <button
                  onClick={() => copyToClipboard(inviteResult.code)}
                  className="p-1.5 rounded-md hover:bg-neutral-light/20 text-text-muted hover:text-ink transition-colors"
                  title="Copy code"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-text-muted mt-2">
                Share this code. Your teammate can join at <span className="font-mono text-ink">/teams/join</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setInviteResult(null)} className="flex-1">
                Create Another
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInviteOpen(false)} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Pending Invites Section */}
        {pendingInvites.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-ink mb-3">Pending Invites</h3>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between py-2 px-3 bg-neutral-off-white rounded-md">
                  <div className="flex items-center gap-3">
                    <code className="text-sm font-mono font-normal text-ink">{invite.code}</code>
                    {invite.email && (
                      <span className="text-xs text-text-muted">{invite.email}</span>
                    )}
                    <Badge variant="outline" size="sm" color={invite.role === "admin" ? "#2251FF" : "#A2AAAD"}>
                      {invite.role}
                    </Badge>
                  </div>
                  <button
                    onClick={() => handleRevokeInvite(invite.id)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {invitesLoading && (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        )}
      </Modal>
    </div>
  );
}
