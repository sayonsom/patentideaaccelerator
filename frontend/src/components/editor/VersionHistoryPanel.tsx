"use client";

import { useEffect, useState, useCallback } from "react";
import type { DocumentVersion, VersionTrigger } from "@/lib/types";
import { usePatentDocumentStore } from "@/lib/stores/patent-document-store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VersionDiffView } from "./VersionDiffView";

// ─── Trigger Config ─────────────────────────────────────────────────

interface TriggerConfig {
  label: string;
  color: string;
}

const TRIGGER_MAP: Record<VersionTrigger, TriggerConfig> = {
  manual: { label: "Manual", color: "#2251FF" },
  auto: { label: "Auto-save", color: "#6B7280" },
  stage_change: { label: "Stage change", color: "#2E6F4E" },
  ai_generation: { label: "AI", color: "#163E93" },
};

// ─── Helpers ────────────────────────────────────────────────────────

function formatVersionTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// ─── Icons ──────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function RestoreIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
    </svg>
  );
}

function HistoryEmptyIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-neutral-light"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ─── Version Item ───────────────────────────────────────────────────

interface VersionItemProps {
  version: DocumentVersion;
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: () => void;
  onRestore: () => void;
  isRestoring: boolean;
}

function VersionItem({
  version,
  isSelected,
  isCurrent,
  onSelect,
  onRestore,
  isRestoring,
}: VersionItemProps) {
  const trigger = TRIGGER_MAP[version.trigger];
  const isAutoSave = version.trigger === "auto";

  return (
    <div
      onClick={onSelect}
      className={`
        flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors duration-100 group/item
        ${isSelected ? "bg-blue-ribbon/5 border-l-2 border-l-blue-ribbon" : "hover:bg-neutral-off-white border-l-2 border-l-transparent"}
        ${isAutoSave ? "opacity-70" : ""}
      `}
    >
      {/* ── Version info ──────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs font-semibold ${isAutoSave ? "text-text-muted" : "text-ink"}`}>
            v{version.versionNum}
          </span>
          <Badge color={trigger.color} variant="outline" size="sm">
            {trigger.label}
          </Badge>
          {isCurrent && (
            <Badge color="#2E6F4E" variant="solid" size="sm">
              Current
            </Badge>
          )}
        </div>
        <p className={`text-[11px] mt-0.5 truncate ${isAutoSave ? "text-text-muted/70" : "text-text-muted"}`}>
          {version.label}
        </p>
        <p className="text-[10px] text-text-muted/60 mt-0.5 flex items-center gap-1">
          <ClockIcon className="w-3 h-3" />
          {formatVersionTimestamp(version.createdAt)}
        </p>
      </div>

      {/* ── Restore button ────────────────────────────────────────── */}
      {!isCurrent && (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onRestore();
          }}
          disabled={isRestoring}
          loading={isRestoring}
          className="opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"
          title="Restore this version"
        >
          <RestoreIcon />
          <span className="text-[10px]">Restore</span>
        </Button>
      )}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────

export function VersionHistoryPanel() {
  const versions = usePatentDocumentStore((s) => s.versions);
  const previewVersionId = usePatentDocumentStore((s) => s.previewVersionId);
  const setPreviewVersion = usePatentDocumentStore((s) => s.setPreviewVersion);
  const loadVersions = usePatentDocumentStore((s) => s.loadVersions);
  const restoreVersion = usePatentDocumentStore((s) => s.restoreVersion);
  const toggleVersionPanel = usePatentDocumentStore((s) => s.toggleVersionPanel);
  const document = usePatentDocumentStore((s) => s.document);

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  // Load versions on mount
  useEffect(() => {
    if (document) {
      loadVersions();
    }
  }, [document, loadVersions]);

  const handleRestore = useCallback(
    async (versionId: string) => {
      setRestoringId(versionId);
      await restoreVersion(versionId);
      setRestoringId(null);
    },
    [restoreVersion]
  );

  // Sort versions by versionNum descending (most recent first)
  const sortedVersions = [...versions].sort(
    (a, b) => b.versionNum - a.versionNum
  );
  const currentVersion = sortedVersions[0] ?? null;
  const selectedVersion = sortedVersions.find((v) => v.id === previewVersionId);

  // For diff: compare selected version with the one before it
  const selectedIndex = selectedVersion
    ? sortedVersions.findIndex((v) => v.id === selectedVersion.id)
    : -1;
  const previousVersion =
    selectedIndex >= 0 && selectedIndex < sortedVersions.length - 1
      ? sortedVersions[selectedIndex + 1]
      : null;

  return (
    <div className="border-t border-border bg-white flex flex-col shrink-0" style={{ maxHeight: "40vh" }}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-neutral-off-white shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-ink">Version History</h3>
          {versions.length > 0 && (
            <span className="text-[10px] text-text-muted">
              {versions.length} version{versions.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedVersion && previousVersion && (
            <button
              type="button"
              onClick={() => setShowDiff(!showDiff)}
              className={`
                text-[11px] px-2 py-1 rounded font-medium transition-colors
                ${showDiff
                  ? "bg-blue-ribbon text-white"
                  : "bg-white text-text-muted border border-border hover:border-border-hover hover:text-ink"
                }
              `}
            >
              {showDiff ? "Hide Diff" : "Show Diff"}
            </button>
          )}
          <button
            type="button"
            onClick={toggleVersionPanel}
            className="p-1 rounded text-text-muted hover:bg-white hover:text-ink transition-colors"
            title="Close version history"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Version List ────────────────────────────────────────── */}
        <div
          className={`overflow-y-auto border-r border-border shrink-0 ${showDiff ? "w-64" : "flex-1"}`}
        >
          {sortedVersions.length > 0 ? (
            sortedVersions.map((version) => (
              <VersionItem
                key={version.id}
                version={version}
                isSelected={previewVersionId === version.id}
                isCurrent={currentVersion?.id === version.id}
                onSelect={() =>
                  setPreviewVersion(
                    previewVersionId === version.id ? null : version.id
                  )
                }
                onRestore={() => handleRestore(version.id)}
                isRestoring={restoringId === version.id}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-6">
              <HistoryEmptyIcon />
              <p className="text-sm text-text-muted mt-3">No versions yet</p>
              <p className="text-xs text-text-muted/70 mt-1 text-center">
                Versions are created when you save or when auto-save runs.
              </p>
            </div>
          )}
        </div>

        {/* ── Diff View ───────────────────────────────────────────── */}
        {showDiff && selectedVersion && previousVersion && (
          <div className="flex-1 overflow-auto">
            <div className="px-3 py-2 border-b border-border bg-neutral-off-white">
              <p className="text-[11px] text-text-muted">
                Comparing{" "}
                <span className="font-medium text-ink">v{previousVersion.versionNum}</span>
                {" "}to{" "}
                <span className="font-medium text-ink">v{selectedVersion.versionNum}</span>
              </p>
            </div>
            <VersionDiffView
              currentContent={selectedVersion.content}
              previousContent={previousVersion.content}
            />
          </div>
        )}
      </div>
    </div>
  );
}
