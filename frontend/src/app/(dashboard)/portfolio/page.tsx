"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { usePortfolioStore } from "@/lib/store";
import { PortfolioDashboard } from "@/components/portfolio/PortfolioDashboard";
import { Spinner, EmptyState } from "@/components/ui";
import { ChatPanel, ChatToggleButton } from "@/components/chat/ChatPanel";
import type { ChatContext } from "@/lib/types";

export default function PortfolioPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const {
    portfolios,
    loading,
    activePortfolio,
    loadPortfolios,
    createPortfolio,
    setActivePortfolio,
  } = usePortfolioStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    if (userId) {
      loadPortfolios(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const chatContext: ChatContext = useMemo(
    () => ({
      type: "portfolio",
      id: activePortfolio?.id ?? null,
      label: activePortfolio?.name ?? "Patent Portfolio",
      data: {
        name: activePortfolio?.name,
        description: activePortfolio?.description,
        totalEntries: activePortfolio?.ideas?.length ?? 0,
        ideas: (activePortfolio?.ideas ?? []).slice(0, 15).map((entry) => ({
          title: entry.externalTitle || "Linked Idea",
          externalPatentNo: entry.externalPatentNo,
          status: entry.status,
        })),
      },
    }),
    [activePortfolio]
  );

  const handleCreate = async () => {
    if (!newName.trim() || !userId) return;
    await createPortfolio(userId, newName.trim(), newDesc.trim());
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
  };

  if (status === "loading" || (loading && portfolios.length === 0)) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-ink">Patent Portfolio</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-2 text-sm font-normal bg-blue-ribbon text-white rounded-md hover:bg-blue-800 transition-colors"
        >
          + New Portfolio
        </button>
      </div>

      {/* Create portfolio modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-medium text-ink mb-4">Create Portfolio</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Cloud Infrastructure IP"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
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
                disabled={!newName.trim()}
                className="px-4 py-2 text-sm bg-blue-ribbon text-white rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio selector tabs */}
      {portfolios.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {portfolios.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePortfolio(p.id)}
              className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
                activePortfolio?.id === p.id
                  ? "bg-blue-ribbon text-white"
                  : "bg-neutral-off-white text-text-secondary hover:text-ink hover:bg-neutral-100"
              }`}
            >
              {p.name}
              <span className="ml-1.5 text-xs opacity-70">
                ({p.ideas?.length ?? 0})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      {activePortfolio ? (
        <PortfolioDashboard portfolio={activePortfolio} />
      ) : portfolios.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          }
          title="No portfolios yet"
          description='Create a portfolio to track your filed patents and pending ideas. Click "+ New Portfolio" to get started.'
        />
      ) : (
        <p className="text-sm text-text-secondary">Select a portfolio to view its dashboard.</p>
      )}

      <ChatToggleButton context={chatContext} />
      <ChatPanel context={chatContext} />
    </div>
  );
}
