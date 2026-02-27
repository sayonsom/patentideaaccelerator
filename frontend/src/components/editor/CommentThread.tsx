"use client";

import { useState, useCallback } from "react";
import type { DocumentComment } from "@/lib/types";
import { usePatentDocumentStore } from "@/lib/stores/patent-document-store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

// ─── Props ──────────────────────────────────────────────────────────

interface CommentThreadProps {
  comment: DocumentComment;
  isActive: boolean;
  onActivate: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────

function getInitials(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatRelativeTime(iso: string): string {
  try {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function truncateAnchor(text: string | null, maxLen = 60): string {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

// ─── Icons ──────────────────────────────────────────────────────────

function CheckIcon({ className = "" }: { className?: string }) {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TrashIcon({ className = "" }: { className?: string }) {
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function ReplyIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 00-4-4H4" />
    </svg>
  );
}

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  );
}

// ─── Reply Item ─────────────────────────────────────────────────────

function ReplyItem({ reply }: { reply: DocumentComment }) {
  const deleteComment = usePatentDocumentStore((s) => s.deleteComment);

  return (
    <div className="flex gap-2 py-2 group/reply">
      <div className="w-6 h-6 rounded-full bg-neutral-light/60 flex items-center justify-center text-[9px] font-medium text-text-muted shrink-0 mt-0.5">
        {getInitials(reply.user?.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-ink truncate">
            {reply.user?.name ?? "Unknown"}
          </span>
          <span className="text-[10px] text-text-muted shrink-0">
            {formatRelativeTime(reply.createdAt)}
          </span>
          <button
            type="button"
            onClick={() => deleteComment(reply.id)}
            className="ml-auto opacity-0 group-hover/reply:opacity-100 text-text-muted hover:text-danger transition-all p-0.5"
            title="Delete reply"
          >
            <TrashIcon />
          </button>
        </div>
        <p className="text-xs text-ink mt-0.5 leading-relaxed whitespace-pre-wrap break-words">
          {reply.content}
        </p>
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────

export function CommentThread({
  comment,
  isActive,
  onActivate,
}: CommentThreadProps) {
  const resolveComment = usePatentDocumentStore((s) => s.resolveComment);
  const unresolveComment = usePatentDocumentStore((s) => s.unresolveComment);
  const deleteComment = usePatentDocumentStore((s) => s.deleteComment);
  const addComment = usePatentDocumentStore((s) => s.addComment);

  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const handleResolveToggle = useCallback(() => {
    if (comment.resolved) {
      unresolveComment(comment.id);
    } else {
      resolveComment(comment.id);
    }
  }, [comment.id, comment.resolved, resolveComment, unresolveComment]);

  const handleDelete = useCallback(() => {
    deleteComment(comment.id);
  }, [comment.id, deleteComment]);

  const handleSubmitReply = useCallback(async () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;

    setIsSubmittingReply(true);
    await addComment({
      content: trimmed,
      parentId: comment.id,
    });
    setReplyText("");
    setShowReplyInput(false);
    setIsSubmittingReply(false);
  }, [replyText, addComment, comment.id]);

  const handleReplyKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmitReply();
      }
      if (e.key === "Escape") {
        setShowReplyInput(false);
        setReplyText("");
      }
    },
    [handleSubmitReply]
  );

  const isAiSuggestion = comment.source === "ai_suggestion";
  const replies = comment.replies ?? [];

  return (
    <div
      onClick={onActivate}
      className={`
        px-3 py-3 border-b border-border cursor-pointer transition-colors duration-100
        group/thread
        ${isActive ? "bg-blue-ribbon/5 border-l-2 border-l-blue-ribbon" : "hover:bg-neutral-off-white"}
        ${comment.resolved ? "opacity-60" : ""}
      `}
    >
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2">
        <div
          className={`
            w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0
            ${isAiSuggestion ? "bg-stellar-explorer/10 text-stellar-explorer" : "bg-blue-ribbon/10 text-blue-ribbon"}
          `}
        >
          {isAiSuggestion ? (
            <SparkleIcon />
          ) : (
            getInitials(comment.user?.name)
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-ink truncate">
              {isAiSuggestion ? "AI Suggestion" : (comment.user?.name ?? "Unknown")}
            </span>
            <span className="text-[10px] text-text-muted shrink-0">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {isAiSuggestion && (
              <Badge
                color="#163E93"
                variant="outline"
                size="sm"
              >
                AI
              </Badge>
            )}
            {comment.resolved && (
              <Badge
                color="#2E6F4E"
                variant="outline"
                size="sm"
              >
                Resolved
              </Badge>
            )}
          </div>
        </div>

        {/* ── Actions ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover/thread:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleResolveToggle();
            }}
            className={`
              p-1 rounded transition-colors
              ${comment.resolved
                ? "text-emerald-600 hover:bg-emerald-50"
                : "text-text-muted hover:bg-neutral-off-white hover:text-emerald-600"
              }
            `}
            title={comment.resolved ? "Unresolve" : "Resolve"}
          >
            <CheckIcon />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-1 rounded text-text-muted hover:bg-red-50 hover:text-danger transition-colors"
            title="Delete comment"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* ── Anchor Text Preview ───────────────────────────────────── */}
      {comment.anchorText && (
        <div className="mt-2 ml-9 px-2 py-1 rounded bg-blue-ribbon/5 border-l-2 border-blue-ribbon/30">
          <p className="text-[11px] text-blue-ribbon/80 italic leading-snug truncate">
            {truncateAnchor(comment.anchorText)}
          </p>
        </div>
      )}

      {/* ── Comment Body ──────────────────────────────────────────── */}
      <div className="mt-2 ml-9">
        {comment.content ? (
          <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        ) : (
          <p className="text-xs text-text-muted italic">No content yet</p>
        )}
      </div>

      {/* ── Replies ───────────────────────────────────────────────── */}
      {replies.length > 0 && (
        <div className="mt-2 ml-9 pl-2 border-l border-border/60">
          {replies.map((reply) => (
            <ReplyItem key={reply.id} reply={reply} />
          ))}
        </div>
      )}

      {/* ── Reply Input ───────────────────────────────────────────── */}
      <div className="mt-2 ml-9">
        {showReplyInput ? (
          <div className="flex flex-col gap-1.5">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleReplyKeyDown}
              placeholder="Write a reply..."
              rows={2}
              autoFocus
              className="w-full text-xs border border-border rounded px-2 py-1.5 resize-none
                focus:outline-none focus:ring-1 focus:ring-blue-ribbon/30 focus:border-blue-ribbon/40
                placeholder:text-text-muted/60 bg-white"
            />
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="primary"
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || isSubmittingReply}
                loading={isSubmittingReply}
              >
                Reply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowReplyInput(false);
                  setReplyText("");
                }}
              >
                Cancel
              </Button>
              <span className="text-[9px] text-text-muted ml-auto">
                Cmd+Enter to send
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowReplyInput(true);
            }}
            className="flex items-center gap-1 text-[11px] text-text-muted hover:text-blue-ribbon transition-colors py-0.5"
          >
            <ReplyIcon />
            Reply
          </button>
        )}
      </div>
    </div>
  );
}
