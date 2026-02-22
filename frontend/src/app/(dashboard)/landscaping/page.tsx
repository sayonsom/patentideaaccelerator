"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Spinner, EmptyState } from "@/components/ui";
import { LandscapingWizard } from "@/components/landscaping/LandscapingWizard";
import { LandscapeResults } from "@/components/landscaping/LandscapeResults";
import type { LandscapingSession } from "@/lib/types";
import {
  listLandscapingSessionsAction,
  createLandscapingSessionAction,
  deleteLandscapingSessionAction,
} from "@/lib/actions/landscaping";

export default function LandscapingPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [sessions, setSessions] = useState<LandscapingSession[]>([]);
  const [activeSession, setActiveSession] = useState<LandscapingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    if (userId) loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadSessions = async () => {
    if (!userId) return;
    setLoading(true);
    const data = await listLandscapingSessionsAction(userId);
    setSessions(data);
    if (data.length > 0 && !activeSession) {
      setActiveSession(data[0]);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newDesc.trim() || !userId) return;
    const created = await createLandscapingSessionAction(userId, newName.trim(), newDesc.trim());
    setSessions((prev) => [created, ...prev]);
    setActiveSession(created);
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this landscaping session?")) return;
    await deleteLandscapingSessionAction(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSession?.id === id) {
      setActiveSession(sessions.find((s) => s.id !== id) ?? null);
    }
  };

  const handleSessionUpdate = (updated: LandscapingSession) => {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (activeSession?.id === updated.id) {
      setActiveSession(updated);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-ink">Patent Landscaping</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-2 text-sm font-normal bg-blue-ribbon text-white rounded-md hover:bg-blue-800 transition-colors"
        >
          + New Session
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-medium text-ink mb-4">New Landscaping Session</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Session Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Edge Computing IP Landscape"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Technology Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the technology area you want to analyze..."
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCreate(false)}
                className="px-3 py-2 text-sm text-text-secondary hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || !newDesc.trim()}
                className="px-4 py-2 text-sm bg-blue-ribbon text-white rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session tabs */}
      {sessions.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setActiveSession(s)}
                className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
                  activeSession?.id === s.id
                    ? "bg-blue-ribbon text-white"
                    : "bg-neutral-off-white text-text-secondary hover:text-ink hover:bg-neutral-100"
                }`}
              >
                {s.name}
                <span className="ml-1.5 text-xs opacity-70">
                  ({s.status})
                </span>
              </button>
              <button
                onClick={() => handleDelete(s.id)}
                className="p-0.5 text-neutral-400 hover:text-danger transition-colors rounded"
                title="Delete session"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      {activeSession ? (
        activeSession.status === "complete" ? (
          <LandscapeResults session={activeSession} onSessionUpdate={handleSessionUpdate} />
        ) : (
          <LandscapingWizard session={activeSession} onSessionUpdate={handleSessionUpdate} />
        )
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          }
          title="No landscaping sessions"
          description='Map the competitive patent landscape before you file. Identify whitespace opportunities and avoid wasted legal spend. Click "+ New Session" to begin.'
        />
      ) : null}

    </div>
  );
}
