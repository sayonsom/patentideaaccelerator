import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  generateAIResponse,
  resolveAIConfig,
  parseJSONFromResponse,
  resolvePromptPreferences,
} from "@/lib/ai-client";
import { buildSystemPrompt } from "@/lib/prompt-preferences";

// ─── Mode-Specific System Prompts ──────────────────────────────────

const BASE_PATENT_CONTEXT = `You are a senior patent drafting specialist with deep expertise in software, AI/ML, cloud computing, and distributed systems patents. You write in precise, formal patent prose that is technically rigorous, legally sound, and optimized for USPTO prosecution.

KEY PRINCIPLES:
- Use formal patent language throughout (avoid colloquial expressions)
- Be technically specific — name data structures, protocols, algorithms, and architectures
- Ensure every statement could withstand Alice/101 scrutiny by anchoring in concrete technical improvements
- Maintain consistency with existing document sections
- Use antecedent basis correctly ("a first element" on introduction, "the first element" thereafter)
- Prefer active voice for clarity, but use passive voice where patent convention dictates
- Include reference numerals where figures are referenced (e.g., "the processing module (102)")`;

const EXPAND_SECTION_PROMPT = `${BASE_PATENT_CONTEXT}

YOUR TASK: Expand a patent document section into publication-quality patent prose.

You will receive:
1. The section heading (e.g., "DETAILED DESCRIPTION", "BACKGROUND")
2. The current content of that section (may be empty or a brief outline)
3. Context from the invention disclosure (problem, solution, technical approach)

Generate thorough, detailed patent prose for the section that:
- Follows standard patent section conventions
- For BACKGROUND: describe the technical field, identify limitations of prior approaches, and state the need
- For SUMMARY: provide a high-level description of the invention's aspects
- For DETAILED DESCRIPTION: exhaustively describe the invention with reference to figures, embodiments, and alternatives
- For CLAIMS: generate properly structured independent and dependent claims
- For ABSTRACT: write a concise 150-word summary
- For BRIEF DESCRIPTION OF DRAWINGS: list each figure with a one-sentence description

Respond with valid JSON:
{
  "expandedContent": "<The generated patent prose for this section>",
  "notes": "<Brief note on what was generated and any suggestions for the author>"
}`;

const REFINE_PARAGRAPH_PROMPT = `${BASE_PATENT_CONTEXT}

YOUR TASK: Refine a paragraph of patent text to improve its quality.

You will receive:
1. The original paragraph text
2. The section it belongs to
3. Optional specific instructions from the user

Improve the paragraph by:
- Strengthening patent language precision
- Fixing antecedent basis issues
- Adding technical specificity where vague
- Improving clarity and readability while maintaining formality
- Ensuring Alice/101 compliance (concrete technical improvements, not abstract ideas)
- Maintaining the original meaning and technical content

Respond with valid JSON:
{
  "refinedText": "<The improved paragraph text>",
  "changes": ["<Brief description of change 1>", "<Brief description of change 2>", "..."]
}`;

const SUGGEST_EDITS_PROMPT = `${BASE_PATENT_CONTEXT}

YOUR TASK: Review a patent document and suggest specific edits as inline comments.

You will receive the full document content as plain text. Analyze it for:
1. Patent language issues (vague terms, missing antecedent basis, informal language)
2. Alice/101 vulnerabilities (abstract ideas without technical anchoring)
3. Technical gaps (missing implementation details, undefined components)
4. Structural issues (missing standard sections, ordering problems)
5. Claim drafting issues (scope too broad/narrow, missing dependent claims, 112 risks)

For each issue, generate a comment with:
- The exact text span that needs attention (anchorText)
- A specific, actionable suggestion

Respond with valid JSON:
{
  "suggestions": [
    {
      "anchorText": "<exact text from the document that needs attention>",
      "comment": "<specific suggestion for improvement>",
      "severity": "critical" | "important" | "suggestion",
      "category": "language" | "alice" | "technical" | "structural" | "claims"
    }
  ],
  "overallAssessment": "<2-3 sentence overall quality assessment of the document>"
}`;

const GENERATE_DESCRIPTION_PROMPT = `${BASE_PATENT_CONTEXT}

YOUR TASK: Generate a complete patent document draft from invention disclosure data.

You will receive the invention disclosure with: title, problem statement, existing approaches, proposed solution, technical approach, and optionally claim drafts and framework data.

Generate a complete patent document with all standard sections:
1. TITLE OF THE INVENTION
2. FIELD OF THE INVENTION (1-2 sentences identifying the technical field)
3. BACKGROUND OF THE INVENTION (2-4 paragraphs: technical context, prior art limitations, need)
4. SUMMARY OF THE INVENTION (2-3 paragraphs: high-level description of aspects)
5. BRIEF DESCRIPTION OF THE DRAWINGS (placeholder figure descriptions)
6. DETAILED DESCRIPTION OF PREFERRED EMBODIMENTS (4-8 paragraphs: thorough technical description with reference numerals)
7. CLAIMS (at minimum: 1 independent method claim with 3 dependents)
8. ABSTRACT (1 paragraph, ~150 words)

Respond with valid JSON:
{
  "sections": {
    "title": "<patent title in ALL CAPS>",
    "field": "<field of invention text>",
    "background": "<background section text>",
    "summary": "<summary section text>",
    "drawingsDescription": "<brief description of drawings>",
    "detailedDescription": "<detailed description text>",
    "claims": "<claims text>",
    "abstract": "<abstract text>"
  },
  "notes": "<Brief notes on the generated draft and recommendations>"
}`;

// ─── Route Handler ──────────────────────────────────────────────────

type AssistMode =
  | "expand_section"
  | "refine_paragraph"
  | "suggest_edits"
  | "generate_description";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let config;
  try {
    config = resolveAIConfig(req);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "API key not configured",
      },
      { status: 500 }
    );
  }

  const preferences = await resolvePromptPreferences(session.user.id);

  const body = await req.json();
  const {
    mode,
    // Common context fields
    title,
    problemStatement,
    existingApproach,
    proposedSolution,
    technicalApproach,
    contradictionResolved,
    techStack,
    frameworkUsed,
    frameworkData,
    // Mode-specific fields
    sectionHeading,
    sectionContent,
    paragraphText,
    paragraphSection,
    userInstructions,
    documentText,
  } = body as {
    mode: AssistMode;
    title?: string;
    problemStatement?: string;
    existingApproach?: string;
    proposedSolution?: string;
    technicalApproach?: string;
    contradictionResolved?: string;
    techStack?: string[];
    frameworkUsed?: string;
    frameworkData?: Record<string, unknown>;
    sectionHeading?: string;
    sectionContent?: string;
    paragraphText?: string;
    paragraphSection?: string;
    userInstructions?: string;
    documentText?: string;
  };

  if (!mode) {
    return NextResponse.json(
      { error: "Missing required field: mode" },
      { status: 400 }
    );
  }

  // ── Build invention context block (shared across modes) ──────────

  const contextParts: string[] = [];
  if (title) contextParts.push(`**Title:** ${title}`);
  if (problemStatement)
    contextParts.push(`**Problem Statement:**\n${problemStatement}`);
  if (existingApproach)
    contextParts.push(`**Existing Approach:**\n${existingApproach}`);
  if (proposedSolution)
    contextParts.push(`**Proposed Solution:**\n${proposedSolution}`);
  if (technicalApproach)
    contextParts.push(
      `**Technical Implementation:**\n${technicalApproach}`
    );
  if (contradictionResolved)
    contextParts.push(
      `**Contradiction Resolved:**\n${contradictionResolved}`
    );
  if (techStack && techStack.length > 0)
    contextParts.push(`**Technology Domain:** ${techStack.join(", ")}`);
  if (frameworkUsed && frameworkUsed !== "none")
    contextParts.push(`**Framework Used:** ${frameworkUsed.toUpperCase()}`);
  if (frameworkData && Object.keys(frameworkData).length > 0)
    contextParts.push(
      `**Framework Data:**\n${JSON.stringify(frameworkData, null, 2)}`
    );

  const inventionContext =
    contextParts.length > 0
      ? `\n═══ INVENTION DISCLOSURE ═══\n${contextParts.join("\n\n")}\n═══════════════════════════\n`
      : "";

  // ── Build mode-specific prompt ───────────────────────────────────

  let systemPrompt: string;
  let userPrompt: string;
  let maxTokens: number;

  switch (mode) {
    case "expand_section": {
      if (!sectionHeading) {
        return NextResponse.json(
          { error: "Missing required field: sectionHeading" },
          { status: 400 }
        );
      }
      systemPrompt = EXPAND_SECTION_PROMPT;
      userPrompt = `${inventionContext}
SECTION TO EXPAND: ${sectionHeading}

CURRENT CONTENT:
${sectionContent || "(empty — generate from scratch)"}

${userInstructions ? `ADDITIONAL INSTRUCTIONS: ${userInstructions}` : ""}

Generate thorough patent prose for this section.`;
      maxTokens = 4096;
      break;
    }

    case "refine_paragraph": {
      if (!paragraphText) {
        return NextResponse.json(
          { error: "Missing required field: paragraphText" },
          { status: 400 }
        );
      }
      systemPrompt = REFINE_PARAGRAPH_PROMPT;
      userPrompt = `${inventionContext}
SECTION: ${paragraphSection || "Unknown"}

PARAGRAPH TO REFINE:
${paragraphText}

${userInstructions ? `SPECIFIC INSTRUCTIONS: ${userInstructions}` : ""}

Improve this paragraph for patent publication quality.`;
      maxTokens = 2048;
      break;
    }

    case "suggest_edits": {
      if (!documentText) {
        return NextResponse.json(
          { error: "Missing required field: documentText" },
          { status: 400 }
        );
      }
      systemPrompt = SUGGEST_EDITS_PROMPT;
      userPrompt = `${inventionContext}
═══ DOCUMENT TO REVIEW ═══
${documentText}
═══════════════════════════

Review this patent document and provide specific, actionable edit suggestions.`;
      maxTokens = 4096;
      break;
    }

    case "generate_description": {
      if (!title && !technicalApproach) {
        return NextResponse.json(
          {
            error:
              "At least title or technicalApproach is required for document generation",
          },
          { status: 400 }
        );
      }
      systemPrompt = GENERATE_DESCRIPTION_PROMPT;
      userPrompt = `${inventionContext}
Generate a complete patent document draft for this invention. Include all standard patent sections with thorough, publication-quality prose.`;
      maxTokens = 8192;
      break;
    }

    default:
      return NextResponse.json(
        {
          error: `Invalid mode: ${mode}. Must be one of: expand_section, refine_paragraph, suggest_edits, generate_description`,
        },
        { status: 400 }
      );
  }

  try {
    const finalSystemPrompt = buildSystemPrompt(systemPrompt, preferences);
    const { text } = await generateAIResponse(
      config,
      finalSystemPrompt,
      userPrompt,
      maxTokens
    );

    const parsed = parseJSONFromResponse(text);
    return NextResponse.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
