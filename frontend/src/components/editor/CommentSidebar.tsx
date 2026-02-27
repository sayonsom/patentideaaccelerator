"use client";

import { useEffect, useMemo } from "react";
import { usePatentDocumentStore } from "@/lib/stores/patent-document-store";
import { CommentThread } from "./CommentThread";

// ─── Filter Type ────────────────────────────────────────────────────

type CommentFilterValue = "all" | "unresolved" | "ai";

interface FilterPill {
  value: CommentFilterValue;
  label: string;
}

const FILTER_PILLS: FilterPill[] = [
  { value: "all", label: "All" },
  { value: "unresolved", label: "Unresolved" },
  { value: "ai", label: "AI Suggestions" },
];

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

function CommentIcon() {
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
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────────────

export function CommentSidebar() {
  const comments = usePatentDocumentStore((s) => s.comments);
  const activeCommentId = usePatentDocumentStore((s) => s.activeCommentId);
  const commentFilter = usePatentDocumentStore((s) => s.commentFilter);
  const setCommentFilter = usePatentDocumentStore((s) => s.setCommentFilter);
  const setActiveComment = usePatentDocumentStore((s) => s.setActiveComment);
  const toggleCommentSidebar = usePatentDocumentStore((s) => s.toggleCommentSidebar);
  const loadComments = usePatentDocumentStore((s) => s.loadComments);
  const document = usePatentDocumentStore((s) => s.document);

  // Load comments when the sidebar opens
  useEffect(() => {
    if (document) {
      loadComments();
    }
  }, [document, loadComments]);

  // Filter comments
  const filteredComments = useMemo(() => {
    // Only show top-level comments (replies are nested inside their parents)
    const topLevel = comments.filter((c) => !c.parentId);

    switch (commentFilter) {
      case "unresolved":
        return topLevel.filter((c) => !c.resolved);
      case "ai":
        return topLevel.filter((c) => c.source === "ai_suggestion");
      default:
        return topLevel;
    }
  }, [comments, commentFilter]);

  // Count badges
  const totalCount = comments.filter((c) => !c.parentId).length;
  const unresolvedCount = comments.filter((c) => !c.parentId && !c.resolved).length;

  return (
    <div className="w-80 border-l border-border bg-neutral-off-white flex flex-col shrink-0 h-full">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="px-3 py-3 border-b border-border bg-white shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-ink">Comments</h3>
            {totalCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-ribbon/10 text-blue-ribbon text-[10px] font-semibold">
                {totalCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={toggleCommentSidebar}
            className="p-1 rounded text-text-muted hover:bg-neutral-off-white hover:text-ink transition-colors"
            title="Close comments"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Filter Pills ─────────────────────────────────────────── */}
        <div className="flex items-center gap-1">
          {FILTER_PILLS.map((pill) => {
            const isActive = commentFilter === pill.value;
            const count =
              pill.value === "unresolved"
                ? unresolvedCount
                : pill.value === "ai"
                  ? comments.filter((c) => !c.parentId && c.source === "ai_suggestion").length
                  : totalCount;
            return (
              <button
                key={pill.value}
                type="button"
                onClick={() => setCommentFilter(pill.value)}
                className={`
                  text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors duration-100
                  ${
                    isActive
                      ? "bg-blue-ribbon text-white"
                      : "bg-neutral-off-white text-text-muted hover:bg-border hover:text-ink"
                  }
                `}
              >
                {pill.label}
                {count > 0 && (
                  <span className={`ml-1 ${isActive ? "text-white/70" : "text-text-muted/60"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Comment List ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {filteredComments.length > 0 ? (
          filteredComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              isActive={activeCommentId === comment.id}
              onActivate={() =>
                setActiveComment(
                  activeCommentId === comment.id ? null : comment.id
                )
              }
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <CommentIcon />
            <p className="text-sm text-text-muted mt-3 text-center">
              {commentFilter === "all"
                ? "No comments yet"
                : commentFilter === "unresolved"
                  ? "No unresolved comments"
                  : "No AI suggestions"}
            </p>
            {commentFilter === "all" && (
              <p className="text-xs text-text-muted/70 mt-1.5 text-center leading-relaxed">
                Select text in the editor and click the comment button to add a comment.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Footer Hint ───────────────────────────────────────────── */}
      {filteredComments.length > 0 && unresolvedCount > 0 && (
        <div className="px-3 py-2 border-t border-border bg-white shrink-0">
          <p className="text-[10px] text-text-muted text-center">
            {unresolvedCount} unresolved comment{unresolvedCount !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
