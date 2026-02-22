"use client";

import { useState, useEffect } from "react";
import type { Portfolio, PortfolioSummaryStats } from "@/lib/types";
import { usePortfolioStore } from "@/lib/store";
import { PortfolioSummary } from "./PortfolioSummary";
import { PortfolioTable } from "./PortfolioTable";
import { AddPatentModal } from "./AddPatentModal";
import { getPortfolioStatsAction } from "@/lib/actions/portfolios";

interface PortfolioDashboardProps {
  portfolio: Portfolio;
}

export function PortfolioDashboard({ portfolio }: PortfolioDashboardProps) {
  const { deletePortfolio, updatePortfolio } = usePortfolioStore();
  const [stats, setStats] = useState<PortfolioSummaryStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(portfolio.name);
  const [editDesc, setEditDesc] = useState(portfolio.description);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolio.id, portfolio.ideas?.length]);

  useEffect(() => {
    setEditName(portfolio.name);
    setEditDesc(portfolio.description);
  }, [portfolio.name, portfolio.description]);

  const loadStats = async () => {
    const s = await getPortfolioStatsAction(portfolio.id);
    setStats(s);
  };

  const handleSaveEdit = async () => {
    await updatePortfolio(portfolio.id, {
      name: editName.trim(),
      description: editDesc.trim(),
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this portfolio and all its entries? This cannot be undone.")) return;
    await deletePortfolio(portfolio.id);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2 max-w-md">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-1.5 border border-border rounded text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon"
                autoFocus
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.5 border border-border rounded text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon resize-none"
                placeholder="Description..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-xs bg-blue-ribbon text-white rounded hover:bg-blue-800 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs text-text-secondary hover:text-ink transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-medium text-ink">{portfolio.name}</h2>
              {portfolio.description && (
                <p className="text-sm text-text-secondary mt-0.5">{portfolio.description}</p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 text-xs font-normal bg-blue-ribbon text-white rounded-md hover:bg-blue-800 transition-colors"
          >
            + Add Entry
          </button>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-text-secondary hover:text-ink transition-colors rounded"
              title="Edit portfolio"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-1.5 text-text-secondary hover:text-danger transition-colors rounded"
            title="Delete portfolio"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Summary stats */}
      {stats && <PortfolioSummary stats={stats} />}

      {/* Entries table */}
      <PortfolioTable
        entries={portfolio.ideas ?? []}
        portfolioId={portfolio.id}
        onRefresh={loadStats}
      />

      {/* Add entry modal */}
      {showAddModal && (
        <AddPatentModal
          portfolioId={portfolio.id}
          onClose={() => setShowAddModal(false)}
          onAdded={loadStats}
        />
      )}
    </div>
  );
}
