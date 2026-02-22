"use client";

import type { ChatHistory } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

interface ChatHistoryListProps {
  histories: ChatHistory[];
  activeId: string | null;
  onSelect: (history: ChatHistory) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
}

export function ChatHistoryList({
  histories,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
}: ChatHistoryListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-normal text-blue-ribbon hover:bg-accent-light rounded transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {histories.length === 0 ? (
          <p className="px-3 py-4 text-xs text-text-secondary text-center">
            No conversations yet
          </p>
        ) : (
          histories.map((h) => (
            <div
              key={h.id}
              className={`group flex items-center gap-1 mx-1 px-2 py-1.5 rounded cursor-pointer text-xs transition-colors ${
                activeId === h.id
                  ? "bg-accent-light text-blue-ribbon"
                  : "text-text-secondary hover:bg-neutral-off-white hover:text-ink"
              }`}
              onClick={() => onSelect(h)}
            >
              <div className="flex-1 min-w-0">
                <p className="truncate font-normal">
                  {h.title || "Untitled chat"}
                </p>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  {h.messages.length} messages {"\u00B7"} {timeAgo(h.updatedAt)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(h.id);
                }}
                className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 text-text-secondary hover:text-danger transition-all"
                title="Delete conversation"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
