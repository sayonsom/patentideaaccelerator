"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { redeemTeamInvite } from "@/lib/actions/teams-management";
import { redeemOrgInvite } from "@/lib/actions/organizations";
import { Button, Input, Card, Spinner } from "@/components/ui";

function JoinTeamForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code") ?? "";

  const [code, setCode] = useState(codeFromUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    setCode(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 8 || !session?.user?.id) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Try team invite first
      const teamResult = await redeemTeamInvite(code, session.user.id);
      if (teamResult.success && teamResult.teamId) {
        router.push(`/teams/${teamResult.teamId}`);
        return;
      }

      // Fall back to org invite
      const orgResult = await redeemOrgInvite(code, session.user.id);
      if (orgResult.success) {
        setSuccess(true);
      } else {
        setError("Invalid or expired invite code. Please check and try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-ink mb-8">Join a Team</h1>

      <Card padding="lg" className="max-w-lg">
        {success ? (
          <div className="text-center py-4">
            <div className="mb-4">
              <svg
                className="w-12 h-12 mx-auto text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-ink mb-2">
              You&apos;re in!
            </h2>
            <p className="text-sm text-text-muted mb-6">
              You have successfully joined the team.
            </p>
            <Link href="/teams">
              <Button variant="primary">Go to Teams</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="Invite Code"
                placeholder="e.g. AB12CD34"
                value={code}
                onChange={handleCodeChange}
                maxLength={8}
                autoFocus
              />
              <p className="text-xs text-text-muted mt-1.5">
                Enter the 8-character invite code shared by your team admin.
              </p>
            </div>

            {error && (
              <p className="text-sm text-danger">{error}</p>
            )}

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={code.length !== 8}
              >
                Join
              </Button>
              <Link
                href="/teams"
                className="text-sm text-text-muted hover:text-ink transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function JoinTeamPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      }
    >
      <JoinTeamForm />
    </Suspense>
  );
}
