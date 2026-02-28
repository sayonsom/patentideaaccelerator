"use client";

import { useState, useRef, useEffect } from "react";

interface OverflowMenuProps {
  ideaId: string;
  ideaTitle: string;
  onDelete: () => void;
  onArchive?: () => void;
}

export function OverflowMenu({ ideaId, ideaTitle, onDelete, onArchive }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md text-neutral-light hover:text-ink hover:bg-neutral-off-white transition-colors"
        aria-label="More actions"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-white border border-border rounded-lg shadow-lg py-1 animate-fade-in">
          <MenuExportItem ideaId={ideaId} ideaTitle={ideaTitle} format="docx" onDone={() => setOpen(false)} />
          <MenuExportItem ideaId={ideaId} ideaTitle={ideaTitle} format="pptx" onDone={() => setOpen(false)} />

          <div className="h-px bg-border my-1" />

          {onArchive && (
            <button
              type="button"
              onClick={() => { onArchive(); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-neutral-dark hover:bg-neutral-off-white transition-colors"
            >
              Archive
            </button>
          )}

          <div className="h-px bg-border my-1" />

          <button
            type="button"
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-red-50 transition-colors"
          >
            Delete Idea
          </button>
        </div>
      )}
    </div>
  );
}

/** Individual export menu item that handles its own loading state */
function MenuExportItem({
  ideaId,
  ideaTitle,
  format,
  onDone,
}: {
  ideaId: string;
  ideaTitle: string;
  format: "docx" | "pptx";
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = ideaTitle.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "_");
      a.download = `${safeName || "patent_idea"}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      onDone();
    } catch {
      // silently handle - user sees no download
    } finally {
      setLoading(false);
    }
  }

  const label = format === "docx" ? "Export as Word" : "Export as PowerPoint";

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="w-full text-left px-3 py-2 text-sm text-neutral-dark hover:bg-neutral-off-white transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      {loading ? (
        <svg className="w-3.5 h-3.5 animate-spin text-neutral-light" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path
            d="M4 12a8 8 0 018-8"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="opacity-75"
          />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      )}
      {label}
    </button>
  );
}
