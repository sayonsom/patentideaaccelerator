"use client";

import { useState, useCallback, useRef } from "react";
import type { ChatContext, ChatMessage } from "@/lib/types";
import { useSettingsStore } from "@/lib/store";

interface UseChatOptions {
  context: ChatContext;
  historyId?: string | null;
  initialMessages?: ChatMessage[];
}

interface UseChatReturn {
  messages: ChatMessage[];
  streamingText: string;
  loading: boolean;
  error: string | null;
  currentHistoryId: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setMessages: (messages: ChatMessage[]) => void;
  abortStream: () => void;
}

export function useChat({ context, historyId, initialMessages }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [streamingText, setStreamingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(historyId ?? null);

  const abortRef = useRef<AbortController | null>(null);
  const provider = useSettingsStore((s) => s.provider);
  const getActiveKey = useSettingsStore((s) => s.getActiveKey);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || loading) return;

      setError(null);
      setLoading(true);
      setStreamingText("");

      // Add user message immediately
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const apiKey = getActiveKey();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (apiKey) {
          headers["x-api-key"] = apiKey;
          headers["x-ai-provider"] = provider;
        }

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: content.trim(),
            context,
            historyId: currentHistoryId,
            previousMessages: messages, // send existing messages for context
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Chat request failed (${response.status})`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        // Read SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let receivedHistoryId = currentHistoryId;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();

            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.historyId && !receivedHistoryId) {
                receivedHistoryId = parsed.historyId;
                setCurrentHistoryId(parsed.historyId);
              }

              if (parsed.text) {
                fullText += parsed.text;
                setStreamingText(fullText);
              }

              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (parseErr) {
              // Skip unparseable lines (like partial JSON)
              if (parseErr instanceof Error && parseErr.message !== "Unexpected end of JSON input") {
                // Re-throw actual errors from the parsed data
                if (data.includes('"error"')) {
                  try {
                    const errParsed = JSON.parse(data);
                    if (errParsed.error) throw new Error(errParsed.error);
                  } catch {
                    // skip
                  }
                }
              }
            }
          }
        }

        // Add assistant message to state
        if (fullText) {
          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: fullText,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }

        setStreamingText("");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // User cancelled — keep partial text as message if any
          const partial = streamingText;
          if (partial) {
            const partialMsg: ChatMessage = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: partial + "\n\n*(response interrupted)*",
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, partialMsg]);
          }
        } else {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
        setStreamingText("");
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [context, currentHistoryId, loading, messages, provider, getActiveKey, streamingText]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingText("");
    setError(null);
    setCurrentHistoryId(null);
  }, []);

  const abortStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    messages,
    streamingText,
    loading,
    error,
    currentHistoryId,
    sendMessage,
    clearMessages,
    setMessages,
    abortStream,
  };
}
