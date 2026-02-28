"use client";

import { useState, useRef, useEffect } from "react";
import type { PatentDocument } from "@/lib/types";

// ─── Props ──────────────────────────────────────────────────────────

interface DocumentCardProps {
  document: PatentDocument;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

// ─── Document type badge colors ─────────────────────────────────────

const DOC_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  utility: { bg: "bg-blue-ribbon/10", text: "text-blue-ribbon" },
  provisional: { bg: "bg-amber-100", text: "text-amber-700" },
  pct: { bg: "bg-emerald-100", text: "text-emerald-700" },
  epo: { bg: "bg-indigo-100", text: "text-indigo-700" },
  custom: { bg: "bg-neutral-100", text: "text-neutral-600" },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  utility: "USPTO",
  provisional: "Provisional",
  pct: "PCT",
  epo: "EPO",
  custom: "Custom",
};

// ─── Time ago helper ────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Component ──────────────────────────────────────────────────────

export function DocumentCard({
  document,
  isSelected,
  onSelect,
  onDuplicate,
  onRename,
  onDelete,
}: DocumentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(document.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const typeColors = DOC_TYPE_COLORS[document.documentType] ?? DOC_TYPE_COLORS.custom;
  const typeLabel = DOC_TYPE_LABELS[document.documentType] ?? "Doc";

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Focus input on rename
  useEffect(() => {
    if (isRenaming) inputRef.current?.focus();
  }, [isRenaming]);

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== document.title) {
      onRename(trimmed);
    }
    setIsRenaming(false);
  };

  const wordCountStr =
    document.wordCount >= 1000
      ? `${(document.wordCount / 1000).toFixed(1)}k`
      : `${document.wordCount}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-lg border p-3 transition-colors ${
        isSelected
          ? "border-blue-ribbon bg-blue-ribbon/5"
          : "border-border bg-white hover:border-neutral-300"
      }`}
    >
      {/* Header: type badge + overflow */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${typeColors.bg} ${typeColors.text}`}
        >
          {typeLabel}
        </span>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-ink hover:bg-neutral-100 transition-colors"
          >
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-30 w-40 bg-white rounded-lg border border-border shadow-lg py-1">
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 text-sm text-neutral-dark hover:bg-neutral-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  setIsRenaming(true);
                  setRenameValue(document.title);
                }}
              >
                Rename
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 text-sm text-neutral-dark hover:bg-neutral-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDuplicate();
                }}
              >
                Duplicate
              </button>
              <div className="border-t border-border my-1" />
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 text-sm text-danger hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      {isRenaming ? (
        <input
          ref={inputRef}
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameSubmit();
            if (e.key === "Escape") setIsRenaming(false);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full text-sm font-medium text-ink bg-transparent border-b border-blue-ribbon outline-none mb-1"
        />
      ) : (
        <p className="text-sm font-medium text-ink line-clamp-2 mb-1">
          {document.title || "Untitled"}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-2 text-[10px] text-text-muted">
        <span className="capitalize">{document.status}</span>
        <span className="text-border">|</span>
        <span>{wordCountStr} words</span>
        <span className="text-border">|</span>
        <span>{timeAgo(document.updatedAt)}</span>
      </div>
    </button>
  );
}
