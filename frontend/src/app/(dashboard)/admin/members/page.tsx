"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button, Card, Badge, Modal, Input, Spinner, EmptyState } from "@/components/ui";
import { Select } from "@/components/ui";
import {
  listOrgMembers,
  updateOrgMemberRole,
  removeOrgMember,
  createOrgInvite,
  listOrgInvites,
} from "@/lib/actions/organizations";
import type { OrgMember, OrgRole, OrgInvite } from "@/lib/types";

// ─── Role display config ──────────────────────────────────────

const ROLE_BADGE_CONFIG: Record<OrgRole, { label: string; color: string }> = {
  business_admin: { label: "Business Admin", color: "#2251FF" },
  team_admin: { label: "Team Admin", color: "#16a34a" },
  member: { label: "Member", color: "#A2AAAD" },
};

const ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "team_admin", label: "Team Admin" },
  { value: "business_admin", label: "Business Admin" },
];

const INVITE_ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "team_admin", label: "Team Admin" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Main Page ────────────────────────────────────────────────

export default function AdminMembersPage() {
  const { data: session } = useSession();
  const orgId = session?.user?.orgId;
  const currentUserId = session?.user?.id;
  const currentRole = session?.user?.orgRole;
  const isAdmin = currentRole === "business_admin";

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [membersData, invitesData] = await Promise.all([
        listOrgMembers(orgId),
        listOrgInvites(orgId),
      ]);
      setMembers(membersData);
      setInvites(invitesData);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRoleChange(userId: string, newRole: OrgRole) {
    if (!orgId) return;
    try {
      await updateOrgMemberRole(orgId, userId, newRole);
      await loadData();
    } catch {
      // handle error
    }
    setRoleMenuOpen(null);
  }

  async function handleRemoveMember(userId: string, memberName: string) {
    if (!orgId) return;
    if (!window.confirm(`Remove ${memberName} from the organization? This cannot be undone.`)) return;
    try {
      await removeOrgMember(orgId, userId);
      await loadData();
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
          Create or join an organization to manage members.
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
        <h1 className="text-2xl font-serif font-bold text-ink">Members</h1>
        {isAdmin && (
          <Button variant="accent" size="sm" onClick={() => setShowInviteModal(true)}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
            Invite
          </Button>
        )}
      </div>

      {/* Members table */}
      {members.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
          title="No members yet"
          description="Invite team members to your organization to get started."
          action={
            isAdmin ? (
              <Button variant="accent" onClick={() => setShowInviteModal(true)}>
                Invite your first member
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-off-white">
                <th className="text-left px-4 py-3 font-normal text-ink">Name</th>
                <th className="text-left px-4 py-3 font-normal text-ink">Email</th>
                <th className="text-left px-4 py-3 font-normal text-ink">Role</th>
                <th className="text-left px-4 py-3 font-normal text-ink">Joined</th>
                {isAdmin && (
                  <th className="text-right px-4 py-3 font-normal text-ink">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const badgeConfig = ROLE_BADGE_CONFIG[member.role];
                const isSelf = member.userId === currentUserId;
                return (
                  <tr
                    key={member.userId}
                    className="border-t border-border hover:bg-neutral-off-white/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-normal text-ink">
                      {member.user?.name ?? "Unknown"}
                      {isSelf && (
                        <span className="ml-2 text-xs text-text-secondary">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {member.user?.email ?? "--"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={badgeConfig.color} size="sm">
                        {badgeConfig.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatDate(member.joinedAt)}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        {!isSelf && (
                          <div className="relative inline-flex items-center gap-1">
                            {/* Role change button */}
                            <button
                              onClick={() =>
                                setRoleMenuOpen(
                                  roleMenuOpen === member.userId ? null : member.userId
                                )
                              }
                              className="p-1.5 text-neutral-light hover:text-blue-ribbon transition-colors rounded hover:bg-accent-light"
                              title="Change role"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                              </svg>
                            </button>

                            {/* Remove button */}
                            <button
                              onClick={() =>
                                handleRemoveMember(
                                  member.userId,
                                  member.user?.name ?? "this member"
                                )
                              }
                              className="p-1.5 text-neutral-light hover:text-red-500 transition-colors rounded hover:bg-red-50"
                              title="Remove member"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                              </svg>
                            </button>

                            {/* Role dropdown */}
                            {roleMenuOpen === member.userId && (
                              <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-border rounded-md shadow-lg py-1 min-w-[160px]">
                                {ROLE_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.value}
                                    onClick={() =>
                                      handleRoleChange(member.userId, opt.value as OrgRole)
                                    }
                                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-off-white transition-colors ${
                                      member.role === opt.value
                                        ? "text-blue-ribbon font-normal"
                                        : "text-ink"
                                    }`}
                                  >
                                    {opt.label}
                                    {member.role === opt.value && (
                                      <svg className="w-3.5 h-3.5 inline ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                      </svg>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending invites */}
      {invites.length > 0 && (
        <div>
          <h2 className="text-lg font-serif font-medium text-ink mb-3">Pending Invites</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {invites.map((invite) => (
              <Card key={invite.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-normal text-ink truncate">
                      {invite.email || "Open invite"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        color={ROLE_BADGE_CONFIG[invite.role].color}
                        size="sm"
                      >
                        {ROLE_BADGE_CONFIG[invite.role].label}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-text-secondary">
                      Expires {formatDate(invite.expiresAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-border-subtle">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-neutral-off-white px-2 py-1 rounded text-ink font-mono tracking-wide">
                      {invite.code}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(invite.code)}
                      className="p-1 text-neutral-light hover:text-blue-ribbon transition-colors"
                      title="Copy code"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Invite modal */}
      <InviteModal
        open={showInviteModal}
        orgId={orgId}
        onClose={() => setShowInviteModal(false)}
        onInviteCreated={loadData}
      />
    </div>
  );
}

// ─── Invite Modal ──────────────────────────────────────────────

function InviteModal({
  open,
  orgId,
  onClose,
  onInviteCreated,
}: {
  open: boolean;
  orgId: string;
  onClose: () => void;
  onInviteCreated: () => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("member");
  const [saving, setSaving] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<OrgInvite | null>(null);

  function handleClose() {
    setEmail("");
    setRole("member");
    setCreatedInvite(null);
    onClose();
  }

  async function handleSendInvite() {
    setSaving(true);
    try {
      const invite = await createOrgInvite(orgId, email.trim() || undefined, role);
      setCreatedInvite(invite);
      await onInviteCreated();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Invite Member" onClose={handleClose}>
      {createdInvite ? (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-50 mx-auto flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-ink mb-1">Invite Created</h3>
            <p className="text-xs text-text-secondary">
              {createdInvite.email
                ? `Share this code with ${createdInvite.email}`
                : "Share this invite code with the team member"}
            </p>
          </div>

          <div className="bg-neutral-off-white rounded-md p-4 text-center">
            <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider font-normal">
              Invite Code
            </p>
            <p className="text-2xl font-mono font-normal text-ink tracking-[0.25em]">
              {createdInvite.code}
            </p>
            <p className="text-[10px] text-text-secondary mt-2">
              Expires {formatDate(createdInvite.expiresAt)}
            </p>
          </div>

          <div className="flex justify-center gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigator.clipboard.writeText(createdInvite.code)}
            >
              Copy Code
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-normal text-text-secondary mb-1">
              Email Address (optional)
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
            />
            <p className="text-[10px] text-text-secondary mt-1">
              Leave blank to create an open invite code.
            </p>
          </div>

          <div>
            <label className="block text-xs font-normal text-text-secondary mb-1">
              Role
            </label>
            <Select
              options={INVITE_ROLE_OPTIONS}
              value={role}
              onChange={(val) => setRole(val as OrgRole)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleSendInvite}
              disabled={saving}
              loading={saving}
            >
              Send Invite
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
