"use client";

import { useState } from "react";
import type { TaxonomyCategory } from "@/lib/types";

interface TaxonomyEditorProps {
  categories: TaxonomyCategory[];
  onChange: (categories: TaxonomyCategory[]) => void;
}

export function TaxonomyEditor({ categories, onChange }: TaxonomyEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleUpdate = (id: string, updates: Partial<TaxonomyCategory>) => {
    onChange(categories.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleRemove = (id: string) => {
    onChange(categories.filter((c) => c.id !== id));
  };

  const handleAdd = () => {
    const newCat: TaxonomyCategory = {
      id: `custom-${Date.now()}`,
      label: "New Category",
      description: "",
      keywords: [],
      cpcClasses: [],
    };
    onChange([...categories, newCat]);
    setEditingId(newCat.id);
  };

  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="border border-border rounded-lg p-3 hover:border-neutral-400 transition-colors"
        >
          {editingId === cat.id ? (
            <div className="space-y-2">
              <input
                type="text"
                value={cat.label}
                onChange={(e) => handleUpdate(cat.id, { label: e.target.value })}
                className="w-full px-2 py-1 border border-border rounded text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon"
                placeholder="Category name"
              />
              <textarea
                value={cat.description}
                onChange={(e) => handleUpdate(cat.id, { description: e.target.value })}
                className="w-full px-2 py-1 border border-border rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon resize-none"
                rows={2}
                placeholder="Description..."
              />
              <div>
                <label className="text-[10px] text-text-secondary">Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={cat.keywords.join(", ")}
                  onChange={(e) =>
                    handleUpdate(cat.id, {
                      keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-2 py-1 border border-border rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-secondary">CPC Classes (comma-separated)</label>
                <input
                  type="text"
                  value={cat.cpcClasses.join(", ")}
                  onChange={(e) =>
                    handleUpdate(cat.id, {
                      cpcClasses: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-2 py-1 border border-border rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon"
                />
              </div>
              <button
                onClick={() => setEditingId(null)}
                className="text-xs text-blue-ribbon hover:underline"
              >
                Done editing
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-ink">{cat.label}</h4>
                <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{cat.description}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {cat.keywords.slice(0, 4).map((kw) => (
                    <span key={kw} className="px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-700 rounded">
                      {kw}
                    </span>
                  ))}
                  {cat.cpcClasses.map((cpc) => (
                    <span key={cpc} className="px-1.5 py-0.5 text-[10px] font-mono bg-neutral-100 text-neutral-600 rounded">
                      {cpc}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setEditingId(cat.id)}
                  className="p-1 text-text-secondary hover:text-ink transition-colors"
                  title="Edit"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleRemove(cat.id)}
                  className="p-1 text-text-secondary hover:text-danger transition-colors"
                  title="Remove"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={handleAdd}
        className="w-full py-2 border border-dashed border-border rounded-lg text-xs text-text-secondary hover:text-ink hover:border-neutral-400 transition-colors"
      >
        + Add Category
      </button>
    </div>
  );
}
