"use client";

import { useEffect } from "react";
import { usePatentDocumentStore } from "@/lib/stores/patent-document-store";
import { Spinner } from "@/components/ui";
import { PatentEditor } from "./PatentEditor";
import type { Idea, ClaimDraft } from "@/lib/types";

// ─── Props ──────────────────────────────────────────────────────────

interface DocumentTabProps {
  idea: Idea;
}

// ─── Tiptap JSON builders ───────────────────────────────────────────

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
}

/** Create a raw text node compatible with Tiptap JSON schema. */
function makeText(text: string): { type: "text"; text: string } {
  return { type: "text", text };
}

function heading(level: number, text: string): TiptapNode {
  return {
    type: "heading",
    attrs: { level },
    content: [makeText(text) as unknown as TiptapNode],
  };
}

let paragraphCounter = 0;

function numberedParagraph(text: string): TiptapNode {
  paragraphCounter += 1;
  if (!text.trim()) {
    return {
      type: "patentParagraph",
      attrs: { paragraphNumber: paragraphCounter },
    };
  }
  return {
    type: "patentParagraph",
    attrs: { paragraphNumber: paragraphCounter },
    content: [makeText(text) as unknown as TiptapNode],
  };
}

function claimBlock(
  claimNumber: number,
  text: string,
  claimType: "independent" | "dependent" = "independent",
  dependsOn: number | null = null
): TiptapNode {
  return {
    type: "patentClaim",
    attrs: { claimNumber, claimType, dependsOn },
    content: text.trim()
      ? [makeText(text) as unknown as TiptapNode]
      : undefined,
  };
}

// ─── Build initial content from an Idea ─────────────────────────────

function buildInitialContent(idea: Idea): Record<string, unknown> {
  paragraphCounter = 0;
  const nodes: TiptapNode[] = [];

  // TITLE OF THE INVENTION
  nodes.push(heading(1, "TITLE OF THE INVENTION"));
  nodes.push(numberedParagraph(idea.title || ""));

  // FIELD OF THE INVENTION
  nodes.push(heading(1, "FIELD OF THE INVENTION"));
  nodes.push(numberedParagraph(""));

  // BACKGROUND OF THE INVENTION
  nodes.push(heading(1, "BACKGROUND OF THE INVENTION"));
  if (idea.problemStatement) {
    nodes.push(numberedParagraph(idea.problemStatement));
  }
  if (idea.existingApproach) {
    nodes.push(numberedParagraph(idea.existingApproach));
  }
  if (!idea.problemStatement && !idea.existingApproach) {
    nodes.push(numberedParagraph(""));
  }

  // SUMMARY OF THE INVENTION
  nodes.push(heading(1, "SUMMARY OF THE INVENTION"));
  if (idea.proposedSolution) {
    nodes.push(numberedParagraph(idea.proposedSolution));
  } else {
    nodes.push(numberedParagraph(""));
  }

  // BRIEF DESCRIPTION OF THE DRAWINGS
  nodes.push(heading(1, "BRIEF DESCRIPTION OF THE DRAWINGS"));
  nodes.push(numberedParagraph(""));

  // DETAILED DESCRIPTION OF THE PREFERRED EMBODIMENTS
  nodes.push(heading(1, "DETAILED DESCRIPTION OF THE PREFERRED EMBODIMENTS"));
  if (idea.technicalApproach) {
    nodes.push(numberedParagraph(idea.technicalApproach));
  } else {
    nodes.push(numberedParagraph(""));
  }

  // CLAIMS
  nodes.push(heading(1, "CLAIMS"));
  if (idea.claimDraft) {
    const draft: ClaimDraft = idea.claimDraft;
    let claimNum = 0;

    // Method claims
    if (draft.methodClaim) {
      claimNum += 1;
      nodes.push(claimBlock(claimNum, draft.methodClaim, "independent"));
      if (draft.methodDependentClaims) {
        for (const dep of draft.methodDependentClaims) {
          claimNum += 1;
          nodes.push(
            claimBlock(claimNum, dep.text, "dependent", claimNum - 1)
          );
        }
      }
    }

    // System claims
    if (draft.systemClaim) {
      const systemBase = claimNum + 1;
      claimNum += 1;
      nodes.push(claimBlock(claimNum, draft.systemClaim, "independent"));
      if (draft.systemDependentClaims) {
        for (const dep of draft.systemDependentClaims) {
          claimNum += 1;
          nodes.push(
            claimBlock(claimNum, dep.text, "dependent", systemBase)
          );
        }
      }
    }

    // CRM claims
    if (draft.crmClaim) {
      const crmBase = claimNum + 1;
      claimNum += 1;
      nodes.push(claimBlock(claimNum, draft.crmClaim, "independent"));
      if (draft.crmDependentClaims) {
        for (const dep of draft.crmDependentClaims) {
          claimNum += 1;
          nodes.push(
            claimBlock(claimNum, dep.text, "dependent", crmBase)
          );
        }
      }
    }

    if (claimNum === 0) {
      nodes.push(claimBlock(1, "", "independent"));
    }
  } else {
    nodes.push(claimBlock(1, "", "independent"));
  }

  // ABSTRACT
  nodes.push(heading(1, "ABSTRACT"));
  if (idea.claimDraft?.abstractText) {
    nodes.push(numberedParagraph(idea.claimDraft.abstractText));
  } else {
    nodes.push(numberedParagraph(""));
  }

  return {
    type: "doc",
    content: nodes,
  };
}

// ─── Component ──────────────────────────────────────────────────────

export function DocumentTab({ idea }: DocumentTabProps) {
  const document = usePatentDocumentStore((s) => s.document);
  const isLoading = usePatentDocumentStore((s) => s.isLoading);
  const error = usePatentDocumentStore((s) => s.error);
  const loadDocument = usePatentDocumentStore((s) => s.loadDocument);
  const initializeDocument = usePatentDocumentStore((s) => s.initializeDocument);
  const reset = usePatentDocumentStore((s) => s.reset);

  // Load document on mount, reset on unmount
  useEffect(() => {
    loadDocument(idea.id);
    return () => {
      reset();
    };
  }, [idea.id, loadDocument, reset]);

  // ── Loading ─────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-sm text-danger">{error}</p>
        <button
          type="button"
          onClick={() => loadDocument(idea.id)}
          className="text-sm text-blue-ribbon hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Document exists: render editor ──────────────────────────────

  if (document) {
    return (
      <div className="h-[calc(100vh-14rem)]">
        <PatentEditor
          documentId={document.id}
          initialContent={document.content}
        />
      </div>
    );
  }

  // ── No document: show initialization card ───────────────────────

  return (
    <div className="flex items-center justify-center py-24">
      <div className="bg-white border border-border rounded-lg p-8 max-w-lg w-full text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-blue-ribbon/10 flex items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-ribbon"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </div>

        <h3 className="text-lg font-medium text-ink mb-2">
          Patent Document Editor
        </h3>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          Create a patent document for this idea. The document will be
          pre-populated with standard patent sections using your idea&apos;s
          content, including title, background, summary, detailed description,
          claims, and abstract.
        </p>

        <button
          type="button"
          onClick={() => {
            const content = buildInitialContent(idea);
            initializeDocument(idea.id, content, idea.title);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-blue-ribbon text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
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
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          Initialize Patent Document
        </button>
      </div>
    </div>
  );
}
