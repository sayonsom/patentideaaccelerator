"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { ChatContext, ChatHistory } from "@/lib/types";
import { useChat } from "@/hooks/useChat";
import { useChatStore } from "@/lib/store";
import { getSuggestedPrompts } from "@/lib/chat-prompts";
import { ChatMessageBubble } from "./ChatMessage";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { ChatHistoryList } from "./ChatHistoryList";

interface ChatPanelProps {
  context: ChatContext;
}

export function ChatPanel({ context }: ChatPanelProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const {
    panelOpen,
    closePanel,
    histories,
    activeHistoryId,
    setActiveHistory,
    loadHistories,
    removeHistory,
  } = useChatStore();

  const [showHistory, setShowHistory] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Find active history to load initial messages
  const activeHistory = histories.find((h) => h.id === activeHistoryId);

  const {
    messages,
    streamingText,
    loading,
    error,
    sendMessage,
    clearMessages,
    setMessages,
    abortStream,
  } = useChat({
    context,
    historyId: activeHistoryId,
    initialMessages: activeHistory?.messages ?? [],
  });

  // Load histories on mount
  useEffect(() => {
    if (userId && panelOpen) {
      loadHistories(userId, context.type, context.id ?? undefined);
    }
  }, [userId, panelOpen, context.type, context.id, loadHistories]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Focus input when panel opens
  useEffect(() => {
    if (panelOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [panelOpen]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || loading) return;
    const msg = inputValue;
    setInputValue("");
    await sendMessage(msg);
  }, [inputValue, loading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectHistory = (history: ChatHistory) => {
    setActiveHistory(history.id);
    setMessages(history.messages);
    setShowHistory(false);
  };

  const handleNewChat = () => {
    setActiveHistory(null);
    clearMessages();
    setShowHistory(false);
  };

  const handleDeleteHistory = async (id: string) => {
    await removeHistory(id);
    if (activeHistoryId === id) {
      clearMessages();
    }
  };

  const suggestedPrompts = getSuggestedPrompts(context.type);

  if (!panelOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-[420px] bg-white border-l border-border shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="p-1 text-text-secondary hover:text-ink transition-colors rounded"
          title="Chat history"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-normal text-ink truncate">
            AI Assistant
          </h3>
          <p className="text-[10px] text-text-secondary truncate">
            {context.label}
          </p>
        </div>

        {loading && (
          <button
            onClick={abortStream}
            className="px-2 py-1 text-[10px] rounded border border-danger text-danger hover:bg-red-50 transition-colors"
          >
            Stop
          </button>
        )}

        <button
          onClick={closePanel}
          className="p-1 text-text-secondary hover:text-ink transition-colors rounded"
          title="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* History sidebar overlay */}
      {showHistory && (
        <div className="absolute left-0 top-12 bottom-0 w-56 bg-white border-r border-border z-10 shadow-lg">
          <ChatHistoryList
            histories={histories}
            activeId={activeHistoryId}
            onSelect={handleSelectHistory}
            onDelete={handleDeleteHistory}
            onNewChat={handleNewChat}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && !streamingText ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-12 h-12 rounded-full bg-accent-light text-blue-ribbon flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-normal text-ink">Ask me anything</p>
              <p className="text-xs text-text-secondary mt-1">
                I have context about {context.label.toLowerCase()}.
              </p>
            </div>
            <SuggestedPrompts
              prompts={suggestedPrompts}
              onSelect={(prompt) => {
                setInputValue(prompt);
                inputRef.current?.focus();
              }}
              disabled={loading}
            />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
              />
            ))}
            {streamingText && (
              <ChatMessageBubble
                role="assistant"
                content={streamingText}
                isStreaming
              />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-danger">
          {error}
        </div>
      )}

      {/* Suggested prompts bar (when there are messages) */}
      {messages.length > 0 && !loading && (
        <div className="px-4 pb-2">
          <SuggestedPrompts
            prompts={suggestedPrompts.slice(0, 3)}
            onSelect={(prompt) => {
              setInputValue(prompt);
              inputRef.current?.focus();
            }}
            disabled={loading}
          />
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-border shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this idea..."
            rows={1}
            className="flex-1 resize-none px-3 py-2 border border-border rounded-lg text-sm text-ink placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-blue-ribbon focus:border-blue-ribbon max-h-32"
            style={{
              height: "auto",
              minHeight: "38px",
              maxHeight: "128px",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 128) + "px";
            }}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || loading}
            className="shrink-0 w-9 h-9 rounded-lg bg-blue-ribbon text-white flex items-center justify-center hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Floating Chat Button ───────────────────────────────────────

interface ChatToggleButtonProps {
  context: ChatContext;
}

export function ChatToggleButton({ context }: ChatToggleButtonProps) {
  const { panelOpen, openPanel } = useChatStore();

  if (panelOpen) return null;

  return (
    <button
      onClick={openPanel}
      className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-blue-ribbon text-white shadow-lg hover:bg-blue-800 transition-all hover:scale-105 flex items-center justify-center z-40"
      title={`Chat about ${context.label}`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    </button>
  );
}
