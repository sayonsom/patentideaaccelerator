"use client";

import { timeAgo } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  isStreaming?: boolean;
}

export function ChatMessageBubble({ role, content, timestamp, isStreaming }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-accent-light text-blue-ribbon flex items-center justify-center text-xs font-normal shrink-0 mt-1">
          AI
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-blue-ribbon text-white"
            : "bg-neutral-off-white text-ink border border-border"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-headings:text-ink prose-p:text-ink prose-li:text-ink prose-strong:text-ink">
            {/* Simple markdown rendering — bold, bullets, headers */}
            {content.split("\n").map((line, i) => {
              // Headers
              if (line.startsWith("### ")) {
                return (
                  <h4 key={i} className="font-semibold text-sm mt-2 mb-1">
                    {line.slice(4)}
                  </h4>
                );
              }
              if (line.startsWith("## ")) {
                return (
                  <h3 key={i} className="font-semibold text-sm mt-3 mb-1">
                    {line.slice(3)}
                  </h3>
                );
              }
              // Bullet points
              if (line.startsWith("- ") || line.startsWith("* ")) {
                return (
                  <div key={i} className="flex gap-1.5 ml-1">
                    <span className="text-text-secondary shrink-0">{"\u2022"}</span>
                    <span>{renderInlineMarkdown(line.slice(2))}</span>
                  </div>
                );
              }
              // Numbered lists
              const numMatch = line.match(/^(\d+)\.\s/);
              if (numMatch) {
                return (
                  <div key={i} className="flex gap-1.5 ml-1">
                    <span className="text-text-secondary shrink-0">{numMatch[1]}.</span>
                    <span>{renderInlineMarkdown(line.slice(numMatch[0].length))}</span>
                  </div>
                );
              }
              // Empty lines
              if (line.trim() === "") {
                return <div key={i} className="h-2" />;
              }
              // Regular text
              return (
                <p key={i} className="leading-relaxed">
                  {renderInlineMarkdown(line)}
                </p>
              );
            })}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-blue-ribbon animate-pulse ml-0.5 align-text-bottom rounded-sm" />
            )}
          </div>
        )}
        {timestamp && !isStreaming && (
          <p className={`text-[10px] mt-1 ${isUser ? "text-blue-200" : "text-text-secondary"}`}>
            {timeAgo(timestamp)}
          </p>
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center text-xs font-normal shrink-0 mt-1">
          You
        </div>
      )}
    </div>
  );
}

function renderInlineMarkdown(text: string): React.ReactNode {
  // Handle bold (**text**) and inline code (`text`)
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="bg-neutral-off-white px-1 py-0.5 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
