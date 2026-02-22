"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { MagicColumn } from "@/lib/types";
import { MAGIC_COLUMN_PRESETS } from "@/lib/types";
import {
  createMagicColumnAction,
  deleteMagicColumnAction,
} from "@/lib/actions/magic-columns";

interface MagicColumnConfigProps {
  columns: MagicColumn[];
  onColumnsChange: (columns: MagicColumn[]) => void;
  onClose: () => void;
}

export function MagicColumnConfig({ columns, onColumnsChange, onClose }: MagicColumnConfigProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [customName, setCustomName] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [adding, setAdding] = useState(false);

  const existingNames = new Set(columns.map((c) => c.name));

  const handleAddPreset = async (preset: { name: string; prompt: string }) => {
    if (!userId || existingNames.has(preset.name)) return;
    setAdding(true);
    try {
      const col = await createMagicColumnAction(userId, {
        name: preset.name,
        prompt: preset.prompt,
        isPreset: true,
      });
      onColumnsChange([...columns, col]);
    } finally {
      setAdding(false);
    }
  };

  const handleAddCustom = async () => {
    if (!userId || !customName.trim() || !customPrompt.trim()) return;
    setAdding(true);
    try {
      const col = await createMagicColumnAction(userId, {
        name: customName.trim(),
        prompt: customPrompt.trim(),
        isPreset: false,
      });
      onColumnsChange([...columns, col]);
      setCustomName("");
      setCustomPrompt("");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    await deleteMagicColumnAction(id);
    onColumnsChange(columns.filter((c) => c.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <h2 className="text-lg font-medium text-ink mb-4">Configure Magic Columns</h2>

        {/* Active columns */}
        {columns.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Active Columns</p>
            <div className="space-y-2">
              {columns.map((col) => (
                <div key={col.id} className="flex items-center justify-between px-3 py-2 bg-neutral-off-white rounded-md">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink font-medium">{col.name}</p>
                    <p className="text-[10px] text-text-secondary truncate">{col.prompt.slice(0, 80)}...</p>
                  </div>
                  <button
                    onClick={() => handleRemove(col.id)}
                    className="ml-2 p-1 text-neutral-400 hover:text-danger transition-colors"
                    title="Remove column"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Presets */}
        <div className="mb-5">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Preset Columns</p>
          <div className="space-y-2">
            {MAGIC_COLUMN_PRESETS.map((preset) => {
              const exists = existingNames.has(preset.name);
              return (
                <div key={preset.name} className="flex items-center justify-between px-3 py-2 border border-border rounded-md">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink">{preset.name}</p>
                    <p className="text-[10px] text-text-secondary truncate">{preset.prompt.slice(0, 80)}...</p>
                  </div>
                  <button
                    onClick={() => handleAddPreset(preset)}
                    disabled={exists || adding}
                    className="ml-2 px-2 py-1 text-[10px] bg-blue-ribbon text-white rounded hover:bg-blue-800 transition-colors disabled:opacity-30"
                  >
                    {exists ? "Added" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom column */}
        <div className="mb-5">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Custom Column</p>
          <div className="space-y-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Column name"
              className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon"
            />
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="AI prompt for evaluating each idea..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon resize-none"
            />
            <button
              onClick={handleAddCustom}
              disabled={!customName.trim() || !customPrompt.trim() || adding}
              className="px-3 py-1.5 text-xs bg-blue-ribbon text-white rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50"
            >
              Add Custom Column
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-blue-ribbon text-white rounded-md hover:bg-blue-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
