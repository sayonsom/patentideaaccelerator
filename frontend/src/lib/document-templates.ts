import type { Idea, ClaimDraft, DocumentType } from "@/lib/types";

// ─── Tiptap JSON node builders ─────────────────────────────────────

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
}

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

let _paragraphCounter = 0;

function numberedParagraph(text: string): TiptapNode {
  _paragraphCounter += 1;
  if (!text.trim()) {
    return {
      type: "paragraph",
      attrs: { paragraphNumber: _paragraphCounter },
    };
  }
  return {
    type: "paragraph",
    attrs: { paragraphNumber: _paragraphCounter },
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

// ─── Claims builder (shared across templates) ──────────────────────

function buildClaimsNodes(claimDraft: ClaimDraft | null | undefined): TiptapNode[] {
  const nodes: TiptapNode[] = [];

  if (!claimDraft) {
    nodes.push(claimBlock(1, "", "independent"));
    return nodes;
  }

  const draft = claimDraft;
  let claimNum = 0;

  if (draft.methodClaim) {
    claimNum += 1;
    nodes.push(claimBlock(claimNum, draft.methodClaim, "independent"));
    if (draft.methodDependentClaims) {
      for (const dep of draft.methodDependentClaims) {
        claimNum += 1;
        nodes.push(claimBlock(claimNum, dep.text, "dependent", claimNum - 1));
      }
    }
  }

  if (draft.systemClaim) {
    const systemBase = claimNum + 1;
    claimNum += 1;
    nodes.push(claimBlock(claimNum, draft.systemClaim, "independent"));
    if (draft.systemDependentClaims) {
      for (const dep of draft.systemDependentClaims) {
        claimNum += 1;
        nodes.push(claimBlock(claimNum, dep.text, "dependent", systemBase));
      }
    }
  }

  if (draft.crmClaim) {
    const crmBase = claimNum + 1;
    claimNum += 1;
    nodes.push(claimBlock(claimNum, draft.crmClaim, "independent"));
    if (draft.crmDependentClaims) {
      for (const dep of draft.crmDependentClaims) {
        claimNum += 1;
        nodes.push(claimBlock(claimNum, dep.text, "dependent", crmBase));
      }
    }
  }

  if (claimNum === 0) {
    nodes.push(claimBlock(1, "", "independent"));
  }

  return nodes;
}

// ─── Template Section Definition ────────────────────────────────────

export interface TemplateSection {
  heading: string;
  type: "heading-paragraph" | "claims" | "abstract";
  ideaField?: keyof Idea;
  secondaryField?: keyof Idea;
  placeholder: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  documentType: DocumentType;
  icon: string;
  sections: TemplateSection[];
}

// ─── Template Definitions ───────────────────────────────────────────

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "uspto-utility",
    name: "USPTO Utility",
    description: "Standard US patent application with all required sections",
    documentType: "utility",
    icon: "US",
    sections: [
      { heading: "TITLE OF THE INVENTION", type: "heading-paragraph", ideaField: "title", placeholder: "Enter the title of your invention" },
      { heading: "FIELD OF THE INVENTION", type: "heading-paragraph", placeholder: "Describe the technical field" },
      { heading: "BACKGROUND OF THE INVENTION", type: "heading-paragraph", ideaField: "problemStatement", secondaryField: "existingApproach", placeholder: "Describe the problem and prior approaches" },
      { heading: "SUMMARY OF THE INVENTION", type: "heading-paragraph", ideaField: "proposedSolution", placeholder: "Summarize your invention" },
      { heading: "BRIEF DESCRIPTION OF THE DRAWINGS", type: "heading-paragraph", placeholder: "Describe the figures" },
      { heading: "DETAILED DESCRIPTION OF THE PREFERRED EMBODIMENTS", type: "heading-paragraph", ideaField: "technicalApproach", placeholder: "Describe the implementation in detail" },
      { heading: "CLAIMS", type: "claims", placeholder: "" },
      { heading: "ABSTRACT", type: "abstract", placeholder: "Write a concise abstract (150 words max)" },
    ],
  },
  {
    id: "provisional",
    name: "Provisional",
    description: "Quick filing to establish priority date with informal claims",
    documentType: "provisional",
    icon: "PA",
    sections: [
      { heading: "TITLE OF THE INVENTION", type: "heading-paragraph", ideaField: "title", placeholder: "Enter the title of your invention" },
      { heading: "BACKGROUND", type: "heading-paragraph", ideaField: "problemStatement", secondaryField: "existingApproach", placeholder: "Describe the problem" },
      { heading: "DESCRIPTION OF THE INVENTION", type: "heading-paragraph", ideaField: "proposedSolution", placeholder: "Describe your invention" },
      { heading: "DETAILED DESCRIPTION", type: "heading-paragraph", ideaField: "technicalApproach", placeholder: "Technical details of the implementation" },
      { heading: "DRAWINGS", type: "heading-paragraph", placeholder: "Include any figures or diagrams" },
      { heading: "CLAIMS (INFORMAL)", type: "claims", placeholder: "" },
    ],
  },
  {
    id: "pct-international",
    name: "PCT Filing",
    description: "WIPO international application for multi-country protection",
    documentType: "pct",
    icon: "PCT",
    sections: [
      { heading: "TITLE OF THE INVENTION", type: "heading-paragraph", ideaField: "title", placeholder: "Enter the title of your invention" },
      { heading: "TECHNICAL FIELD", type: "heading-paragraph", placeholder: "Describe the technical field of the invention" },
      { heading: "BACKGROUND ART", type: "heading-paragraph", ideaField: "problemStatement", secondaryField: "existingApproach", placeholder: "Describe the state of the art" },
      { heading: "DISCLOSURE OF THE INVENTION", type: "heading-paragraph", ideaField: "proposedSolution", placeholder: "Disclose the invention" },
      { heading: "BEST MODE FOR CARRYING OUT THE INVENTION", type: "heading-paragraph", ideaField: "technicalApproach", placeholder: "Describe the best mode of implementation" },
      { heading: "BRIEF DESCRIPTION OF THE DRAWINGS", type: "heading-paragraph", placeholder: "Describe the figures" },
      { heading: "CLAIMS", type: "claims", placeholder: "" },
      { heading: "ABSTRACT", type: "abstract", placeholder: "Write a concise abstract" },
    ],
  },
  {
    id: "epo-european",
    name: "EPO Filing",
    description: "European Patent Office format with problem-solution approach",
    documentType: "epo",
    icon: "EU",
    sections: [
      { heading: "TITLE OF THE INVENTION", type: "heading-paragraph", ideaField: "title", placeholder: "Enter the title of your invention" },
      { heading: "TECHNICAL FIELD", type: "heading-paragraph", placeholder: "Indicate the technical field" },
      { heading: "BACKGROUND ART", type: "heading-paragraph", ideaField: "existingApproach", placeholder: "Describe the closest prior art" },
      { heading: "TECHNICAL PROBLEM", type: "heading-paragraph", ideaField: "problemStatement", placeholder: "Define the objective technical problem" },
      { heading: "SOLUTION TO THE PROBLEM", type: "heading-paragraph", ideaField: "proposedSolution", placeholder: "Describe how the invention solves the problem" },
      { heading: "DESCRIPTION OF EMBODIMENTS", type: "heading-paragraph", ideaField: "technicalApproach", placeholder: "Describe at least one embodiment in detail" },
      { heading: "CLAIMS", type: "claims", placeholder: "" },
      { heading: "ABSTRACT", type: "abstract", placeholder: "Write a concise abstract" },
    ],
  },
  {
    id: "blank",
    name: "Blank Document",
    description: "Start from scratch with no pre-filled content",
    documentType: "custom",
    icon: "BL",
    sections: [],
  },
];

// ─── Build Tiptap JSON from Template + Idea ─────────────────────────

export function buildContentFromTemplate(
  template: DocumentTemplate,
  idea: Idea
): { content: Record<string, unknown>; paragraphCount: number } {
  _paragraphCounter = 0;

  // Blank document: return minimal doc
  if (template.sections.length === 0) {
    return {
      content: {
        type: "doc",
        content: [
          heading(1, idea.title || "Untitled"),
          numberedParagraph(""),
        ],
      },
      paragraphCount: _paragraphCounter,
    };
  }

  const nodes: TiptapNode[] = [];

  for (const section of template.sections) {
    if (section.type === "claims") {
      nodes.push(heading(1, section.heading));
      nodes.push(...buildClaimsNodes(idea.claimDraft));
      continue;
    }

    if (section.type === "abstract") {
      nodes.push(heading(1, section.heading));
      if (idea.claimDraft?.abstractText) {
        nodes.push(numberedParagraph(idea.claimDraft.abstractText));
      } else {
        nodes.push(numberedParagraph(""));
      }
      continue;
    }

    // heading-paragraph type
    nodes.push(heading(1, section.heading));

    const primaryText = section.ideaField
      ? (idea[section.ideaField] as string | undefined)
      : undefined;
    const secondaryText = section.secondaryField
      ? (idea[section.secondaryField] as string | undefined)
      : undefined;

    if (primaryText) {
      nodes.push(numberedParagraph(primaryText));
    }
    if (secondaryText) {
      nodes.push(numberedParagraph(secondaryText));
    }
    if (!primaryText && !secondaryText) {
      nodes.push(numberedParagraph(""));
    }
  }

  return {
    content: { type: "doc", content: nodes },
    paragraphCount: _paragraphCounter,
  };
}

// ─── Document readiness check ───────────────────────────────────────

function wordCount(text: string | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function getDocumentReadiness(idea: Idea): { label: string; ready: boolean; detail: string }[] {
  const hasTitle = !!idea.title && idea.title.length > 5;
  const hasProblem = !!idea.problemStatement && idea.problemStatement.length > 20;
  const hasSolution = !!idea.proposedSolution && idea.proposedSolution.length > 10;
  const hasTechnical = !!idea.technicalApproach && idea.technicalApproach.length > 10;
  const hasClaims = !!idea.claimDraft;
  const hasAbstract = !!idea.claimDraft?.abstractText;

  const claimCount = hasClaims
    ? [idea.claimDraft?.methodClaim, idea.claimDraft?.systemClaim, idea.claimDraft?.crmClaim].filter(Boolean).length
    : 0;

  return [
    { label: "Title of the Invention", ready: hasTitle, detail: hasTitle ? "from idea title" : "add a title" },
    { label: "Background", ready: hasProblem, detail: hasProblem ? `${wordCount(idea.problemStatement)} words` : "add problem statement" },
    { label: "Summary", ready: hasSolution, detail: hasSolution ? `${wordCount(idea.proposedSolution)} words` : "add proposed solution" },
    { label: "Description of Drawings", ready: false, detail: "add after init" },
    { label: "Detailed Description", ready: hasTechnical, detail: hasTechnical ? `${wordCount(idea.technicalApproach)} words` : "add technical approach" },
    { label: "Claims", ready: hasClaims, detail: hasClaims ? `${claimCount} independent claim${claimCount !== 1 ? "s" : ""}` : "generate claims first" },
    { label: "Abstract", ready: hasAbstract, detail: hasAbstract ? `${wordCount(idea.claimDraft?.abstractText)} words` : "generated with claims" },
  ];
}

export function getTemplateById(id: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find((t) => t.id === id);
}
