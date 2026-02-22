"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createTeam } from "@/lib/actions/teams-management";
import { Button, Input, Card } from "@/components/ui";

export default function NewTeamPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !session?.user) return;

    setLoading(true);
    setError(null);

    try {
      const newTeam = await createTeam({
        name: name.trim(),
        orgId: session.user.orgId ?? undefined,
        creatorId: session.user.id,
      });
      router.push(`/teams/${newTeam.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-ink mb-8">Create a Team</h1>

      <Card padding="lg" className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Team Name"
            placeholder="e.g. Platform Engineering"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={!name.trim()}
            >
              Create Team
            </Button>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-text-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
