"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { useSettingsStore } from "@/lib/store";

interface InlinePromptBarProps {
  editor: Editor;
  documentId: string;
  onClose: () => void;
}

/**
 * Inline AI prompt bar for the patent document editor.
 * Renders below the toolbar. User types a prompt, AI streams text
 * into the editor at the cursor position via SSE.
 */
export function InlinePromptBar({ editor, documentId, onClose }: InlinePromptBarProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const provider = useSettingsStore((s) => s.provider);
  const getActiveKey = useSettingsStore((s) => s.getActiveKey);

  // Auto-focus input on mount
  useEffect(() => {
    // Small delay to ensure the input is rendered
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  // Escape key to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (loading) {
          abortRef.current?.abort();
        }
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [loading, onClose]);

  const gatherEditorContext = useCallback((): {
    selectedText: string;
    surroundingContext: string;
    currentSection: string;
    cursorPos: number;
  } => {
    const { from, to, empty } = editor.state.selection;
    const selectedText = empty ? "" : editor.state.doc.textBetween(from, to, " ");

    // Get surrounding text (up to 500 chars before and after cursor)
    const docText = editor.state.doc.textContent;
    const cursorOffset = from;
    const before = docText.slice(Math.max(0, cursorOffset - 500), cursorOffset);
    const after = docText.slice(cursorOffset, cursorOffset + 500);
    const surroundingContext = `...${before}[CURSOR]${after}...`;

    // Find the closest heading above the cursor for section context
    let currentSection = "Unknown section";
    editor.state.doc.nodesBetween(0, from, (node) => {
      if (node.type.name === "heading" && node.textContent) {
        currentSection = node.textContent;
      }
    });

    return { selectedText, surroundingContext, currentSection, cursorPos: from };
  }, [editor]);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || loading) return;

    setError(null);
    setLoading(true);

    const { selectedText, surroundingContext, currentSection, cursorPos } =
      gatherEditorContext();

    const hasSelection = !!selectedText;
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
          message: prompt.trim(),
          context: {
            type: "document_inline" as const,
            id: documentId,
            label: "Inline AI",
            data: {
              selectedText,
              surroundingContext,
              currentSection,
            },
          },
          previousMessages: [],
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Request failed (${response.status})`
        );
      }

      if (!response.body) throw new Error("No response body");

      // If there is selected text, delete it first (replace mode)
      const { from, to } = editor.state.selection;
      if (hasSelection) {
        editor.chain().focus().deleteRange({ from, to }).run();
      }

      // Stream response into the editor
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let insertOffset = hasSelection ? from : cursorPos;

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

            if (parsed.text) {
              editor
                .chain()
                .insertContentAt(insertOffset, parsed.text)
                .run();
              insertOffset += parsed.text.length;
            }

            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (parseErr) {
            if (
              parseErr instanceof Error &&
              parseErr.message !== "Unexpected end of JSON input"
            ) {
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

      // Done — close the prompt bar
      setPrompt("");
      onClose();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled — keep whatever was inserted
      } else {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [
    prompt,
    loading,
    editor,
    documentId,
    provider,
    getActiveKey,
    gatherEditorContext,
    onClose,
  ]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-ribbon/20 bg-blue-50">
      {/* AI sparkle icon */}
      <svg
        className="w-4 h-4 text-blue-ribbon shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
        />
      </svg>

      <input
        ref={inputRef}
        type="text"
        placeholder="Ask AI to write or edit... (Enter to generate, Esc to close)"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-text-muted disabled:opacity-60"
      />

      {error && (
        <span className="text-xs text-danger shrink-0">{error}</span>
      )}

      {loading ? (
        <button
          type="button"
          onClick={() => abortRef.current?.abort()}
          className="text-xs text-danger font-medium shrink-0 hover:underline"
        >
          Stop
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!prompt.trim()}
          className="text-xs text-blue-ribbon font-medium shrink-0 hover:underline disabled:opacity-40 disabled:no-underline"
        >
          Generate
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        className="text-xs text-text-muted shrink-0 hover:text-ink transition-colors"
      >
        Esc
      </button>
    </div>
  );
}
