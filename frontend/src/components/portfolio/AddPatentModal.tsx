"use client";

import { useState } from "react";
import { usePortfolioStore } from "@/lib/store";
import { useIdeaStore } from "@/lib/store";
import type { PortfolioIdeaStatus } from "@/lib/types";

interface AddPatentModalProps {
  portfolioId: string;
  onClose: () => void;
  onAdded: () => void;
}

type AddMode = "external" | "link";

export function AddPatentModal({ portfolioId, onClose, onAdded }: AddPatentModalProps) {
  const { addEntry } = usePortfolioStore();
  const ideas = useIdeaStore((s) => s.ideas);

  const [mode, setMode] = useState<AddMode>("external");
  const [saving, setSaving] = useState(false);

  // External patent fields
  const [patentNo, setPatentNo] = useState("");
  const [title, setTitle] = useState("");
  const [filingDate, setFilingDate] = useState("");
  const [grantDate, setGrantDate] = useState("");
  const [status, setStatus] = useState<PortfolioIdeaStatus>("filed");
  const [notes, setNotes] = useState("");
  const [cpcInput, setCpcInput] = useState("");

  // Link idea fields
  const [selectedIdeaId, setSelectedIdeaId] = useState("");

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (mode === "external") {
        await addEntry(portfolioId, {
          externalPatentNo: patentNo.trim() || undefined,
          externalTitle: title.trim() || undefined,
          filingDate: filingDate || undefined,
          grantDate: grantDate || undefined,
          status,
          notes: notes.trim(),
          cpcClasses: cpcInput
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        });
      } else if (mode === "link" && selectedIdeaId) {
        const idea = ideas.find((i) => i.id === selectedIdeaId);
        await addEntry(portfolioId, {
          ideaId: selectedIdeaId,
          externalTitle: idea?.title || "Linked Idea",
          status: "pending",
        });
      }
      onAdded();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // Only show filed/scored ideas for linking
  const linkableIdeas = ideas.filter(
    (i) => i.status === "filed" || i.status === "scored" || i.status === "developing"
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <h2 className="text-lg font-medium text-ink mb-4">Add Portfolio Entry</h2>

        {/* Mode selector */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setMode("external")}
            className={`flex-1 py-2 text-sm rounded-md border transition-colors ${
              mode === "external"
                ? "bg-blue-ribbon text-white border-blue-ribbon"
                : "bg-white text-text-secondary border-border hover:border-neutral-400"
            }`}
          >
            External Patent
          </button>
          <button
            onClick={() => setMode("link")}
            className={`flex-1 py-2 text-sm rounded-md border transition-colors ${
              mode === "link"
                ? "bg-blue-ribbon text-white border-blue-ribbon"
                : "bg-white text-text-secondary border-border hover:border-neutral-400"
            }`}
          >
            Link Existing Idea
          </button>
        </div>

        {mode === "external" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Patent Number</label>
                <input
                  type="text"
                  value={patentNo}
                  onChange={(e) => setPatentNo(e.target.value)}
                  placeholder="US12345678B2"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PortfolioIdeaStatus)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon"
                >
                  <option value="pending">Pending</option>
                  <option value="filed">Filed</option>
                  <option value="granted">Granted</option>
                  <option value="abandoned">Abandoned</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-text-secondary mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="System and Method for..."
                className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Filing Date</label>
                <input
                  type="date"
                  value={filingDate}
                  onChange={(e) => setFilingDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Grant Date</label>
                <input
                  type="date"
                  value={grantDate}
                  onChange={(e) => setGrantDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-text-secondary mb-1">CPC Classes (comma-separated)</label>
              <input
                type="text"
                value={cpcInput}
                onChange={(e) => setCpcInput(e.target.value)}
                placeholder="G06F 16/00, H04L 67/00"
                className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon"
              />
            </div>

            <div>
              <label className="block text-xs text-text-secondary mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about this patent..."
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon resize-none"
              />
            </div>
          </div>
        ) : (
          <div>
            {linkableIdeas.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {linkableIdeas.map((idea) => (
                  <button
                    key={idea.id}
                    onClick={() => setSelectedIdeaId(idea.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-md border transition-colors ${
                      selectedIdeaId === idea.id
                        ? "border-blue-ribbon bg-accent-light"
                        : "border-border hover:border-neutral-400"
                    }`}
                  >
                    <p className="text-sm font-medium text-ink truncate">{idea.title || "Untitled"}</p>
                    <p className="text-[10px] text-text-secondary mt-0.5">
                      Status: {idea.status} · {idea.techStack.slice(0, 3).join(", ")}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-text-secondary">
                No ideas available to link. Ideas must be in developing, scored, or filed status.
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm text-text-secondary hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || (mode === "external" ? !patentNo.trim() && !title.trim() : !selectedIdeaId)}
            className="px-4 py-2 text-sm bg-blue-ribbon text-white rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}
