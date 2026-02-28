"use client";

import { useMemo } from "react";

// ─── Props ──────────────────────────────────────────────────────────

interface VersionDiffViewProps {
  currentContent: Record<string, unknown>;
  previousContent: Record<string, unknown>;
}

// ─── Tiptap JSON Text Extraction ────────────────────────────────────

/**
 * Recursively extracts plain text from a Tiptap JSON document structure.
 * Walks through `content` arrays and collects `text` fields from text nodes.
 * Headings and block-level elements produce their own lines.
 */
function extractTextFromTiptapJSON(node: unknown): string {
  if (!node || typeof node !== "object") return "";

  const n = node as Record<string, unknown>;

  // Text node — return the text directly
  if (n.type === "text" && typeof n.text === "string") {
    return n.text;
  }

  // Recursively process content children
  if (Array.isArray(n.content)) {
    const childTexts: string[] = [];
    for (const child of n.content) {
      const childText = extractTextFromTiptapJSON(child);
      if (childText) {
        childTexts.push(childText);
      }
    }

    // Block-level node types that should produce separate lines
    const blockTypes = new Set([
      "paragraph",
      "heading",
      "codeBlock",
      "bulletList",
      "orderedList",
      "listItem",
      "blockquote",
      "horizontalRule",
      "table",
      "tableRow",
      "tableCell",
      "tableHeader",
      "patentClaimBlock",
    ]);

    if (typeof n.type === "string" && blockTypes.has(n.type)) {
      return childTexts.join("") + "\n";
    }

    // For doc-level or inline containers, join children
    return childTexts.join("");
  }

  return "";
}

// ─── Line Diff Algorithm ────────────────────────────────────────────

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  text: string;
  lineNumOld: number | null;
  lineNumNew: number | null;
}

/**
 * Simple line-by-line diff using the longest common subsequence (LCS) approach.
 * Produces a list of added, removed, and unchanged lines.
 */
function computeLineDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS length table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0) as number[]
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.push({
        type: "unchanged",
        text: oldLines[i - 1],
        lineNumOld: i,
        lineNumNew: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({
        type: "added",
        text: newLines[j - 1],
        lineNumOld: null,
        lineNumNew: j,
      });
      j--;
    } else {
      result.push({
        type: "removed",
        text: oldLines[i - 1],
        lineNumOld: i,
        lineNumNew: null,
      });
      i--;
    }
  }

  return result.reverse();
}

// ─── Component ──────────────────────────────────────────────────────

export function VersionDiffView({
  currentContent,
  previousContent,
}: VersionDiffViewProps) {
  const diffLines = useMemo(() => {
    const oldText = extractTextFromTiptapJSON(previousContent);
    const newText = extractTextFromTiptapJSON(currentContent);

    const oldLines = oldText.split("\n").filter((line) => line.length > 0);
    const newLines = newText.split("\n").filter((line) => line.length > 0);

    return computeLineDiff(oldLines, newLines);
  }, [currentContent, previousContent]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const line of diffLines) {
      if (line.type === "added") added++;
      if (line.type === "removed") removed++;
    }
    return { added, removed };
  }, [diffLines]);

  if (diffLines.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 px-6">
        <p className="text-sm text-text-muted">Both versions are empty.</p>
      </div>
    );
  }

  const hasChanges = stats.added > 0 || stats.removed > 0;

  return (
    <div className="text-xs font-mono">
      {/* ── Stats Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border bg-white">
        {hasChanges ? (
          <>
            {stats.added > 0 && (
              <span className="text-emerald-700">
                +{stats.added} line{stats.added !== 1 ? "s" : ""}
              </span>
            )}
            {stats.removed > 0 && (
              <span className="text-red-700">
                -{stats.removed} line{stats.removed !== 1 ? "s" : ""}
              </span>
            )}
          </>
        ) : (
          <span className="text-text-muted">No changes detected</span>
        )}
      </div>

      {/* ── Diff Lines ────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {diffLines.map((line, idx) => (
              <tr
                key={idx}
                className={
                  line.type === "added"
                    ? "bg-emerald-50"
                    : line.type === "removed"
                      ? "bg-red-50"
                      : ""
                }
              >
                {/* Old line number */}
                <td className="w-8 px-1.5 py-0.5 text-right text-[10px] text-text-muted/50 select-none border-r border-border/40 align-top">
                  {line.lineNumOld ?? ""}
                </td>
                {/* New line number */}
                <td className="w-8 px-1.5 py-0.5 text-right text-[10px] text-text-muted/50 select-none border-r border-border/40 align-top">
                  {line.lineNumNew ?? ""}
                </td>
                {/* Indicator */}
                <td
                  className={`w-5 px-1 py-0.5 text-center select-none align-top font-semibold ${
                    line.type === "added"
                      ? "text-emerald-700"
                      : line.type === "removed"
                        ? "text-red-700"
                        : "text-transparent"
                  }`}
                >
                  {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                </td>
                {/* Content */}
                <td
                  className={`px-2 py-0.5 whitespace-pre-wrap break-words align-top ${
                    line.type === "added"
                      ? "text-emerald-900"
                      : line.type === "removed"
                        ? "text-red-900 line-through"
                        : "text-ink"
                  }`}
                >
                  {line.text || "\u00A0"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
