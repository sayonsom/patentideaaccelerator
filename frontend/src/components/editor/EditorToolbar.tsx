"use client";

import type { Editor } from "@tiptap/react";

// ─── Props ──────────────────────────────────────────────────────────

interface EditorToolbarProps {
  editor: Editor | null;
  onInsertImage: () => void;
  onAddComment: () => void;
  onSave: () => void;
  onToggleHistory: () => void;
  onToggleComments: () => void;
  isSaving: boolean;
  isDirty: boolean;
  lastSavedAt: string | null;
}

// ─── Toolbar Button ─────────────────────────────────────────────────

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        inline-flex items-center justify-center w-7 h-7 rounded text-xs
        transition-colors duration-100
        ${active ? "bg-blue-ribbon/10 text-blue-ribbon" : "text-neutral-dark hover:bg-neutral-off-white"}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1 shrink-0" />;
}

// ─── Formatting helpers ─────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// ─── Component ──────────────────────────────────────────────────────

export function EditorToolbar({
  editor,
  onInsertImage,
  onAddComment,
  onSave,
  onToggleHistory,
  onToggleComments,
  isSaving,
  isDirty,
  lastSavedAt,
}: EditorToolbarProps) {
  const d = !editor;

  return (
    <div className="flex items-center gap-1 bg-neutral-off-white border-b border-border px-3 py-1.5 overflow-x-auto shrink-0">
      {/* ── Text Format ────────────────────────────────────────── */}

      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleBold().run()}
        active={editor?.isActive("bold") ?? false}
        disabled={d}
        title="Bold"
      >
        <span className="font-bold">B</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        active={editor?.isActive("italic") ?? false}
        disabled={d}
        title="Italic"
      >
        <span className="italic">I</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
        active={editor?.isActive("underline") ?? false}
        disabled={d}
        title="Underline"
      >
        <span className="underline">U</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleSuperscript().run()}
        active={editor?.isActive("superscript") ?? false}
        disabled={d}
        title="Superscript"
      >
        <span>
          X<sup className="text-[9px]">2</sup>
        </span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleSubscript().run()}
        active={editor?.isActive("subscript") ?? false}
        disabled={d}
        title="Subscript"
      >
        <span>
          X<sub className="text-[9px]">2</sub>
        </span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        active={editor?.isActive("codeBlock") ?? false}
        disabled={d}
        title="Code Block"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </ToolbarButton>

      <Divider />

      {/* ── Block Format ───────────────────────────────────────── */}

      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor?.isActive("heading", { level: 1 }) ?? false}
        disabled={d}
        title="Heading 1"
      >
        <span className="font-semibold text-[11px]">H1</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor?.isActive("heading", { level: 2 }) ?? false}
        disabled={d}
        title="Heading 2"
      >
        <span className="font-semibold text-[11px]">H2</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor?.isActive("heading", { level: 3 }) ?? false}
        disabled={d}
        title="Heading 3"
      >
        <span className="font-semibold text-[11px]">H3</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        active={editor?.isActive("bulletList") ?? false}
        disabled={d}
        title="Bullet List"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="3" cy="6" r="1" fill="currentColor" />
          <circle cx="3" cy="12" r="1" fill="currentColor" />
          <circle cx="3" cy="18" r="1" fill="currentColor" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        active={editor?.isActive("orderedList") ?? false}
        disabled={d}
        title="Ordered List"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="6" x2="21" y2="6" />
          <line x1="10" y1="12" x2="21" y2="12" />
          <line x1="10" y1="18" x2="21" y2="18" />
          <text x="1" y="8" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text>
          <text x="1" y="14" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text>
          <text x="1" y="20" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text>
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        disabled={d}
        title="Horizontal Rule"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      </ToolbarButton>

      <Divider />

      {/* ── Table ──────────────────────────────────────────────── */}

      <ToolbarButton
        onClick={() =>
          editor
            ?.chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        disabled={d}
        title="Insert Table (3x3)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      </ToolbarButton>

      <Divider />

      {/* ── Patent-Specific ────────────────────────────────────── */}

      <ToolbarButton
        onClick={() => {
          if (!editor) return;
          const { from } = editor.state.selection;
          const resolvedPos = editor.state.doc.resolve(from);
          const node = resolvedPos.parent;

          if (
            node.type.name === "patentParagraph" &&
            node.attrs.paragraphNumber != null
          ) {
            // Remove numbering
            editor.chain().focus().unsetPatentParagraph().run();
          } else {
            // Get next paragraph number from the store
            // For now, count existing numbered paragraphs + 1
            let maxNum = 0;
            editor.state.doc.descendants((n) => {
              if (
                n.type.name === "patentParagraph" &&
                typeof n.attrs.paragraphNumber === "number"
              ) {
                maxNum = Math.max(maxNum, n.attrs.paragraphNumber);
              }
            });
            editor
              .chain()
              .focus()
              .setPatentParagraph(maxNum + 1)
              .run();
          }
        }}
        active={
          editor
            ? (() => {
                const { from } = editor.state.selection;
                const node = editor.state.doc.resolve(from).parent;
                return (
                  node.type.name === "patentParagraph" &&
                  node.attrs.paragraphNumber != null
                );
              })()
            : false
        }
        disabled={d}
        title="Toggle Patent Paragraph Numbering"
      >
        <span className="font-mono text-[10px] leading-none whitespace-nowrap">
          &para; No.
        </span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => {
          if (!editor) return;
          const figNumStr = window.prompt("Enter figure number:", "1");
          if (figNumStr === null) return;
          const figNum = parseInt(figNumStr, 10);
          if (isNaN(figNum) || figNum < 1) return;
          editor.chain().focus().insertFigureRef(figNum).run();
        }}
        disabled={d}
        title="Insert Figure Reference"
      >
        <span className="text-[10px] leading-none whitespace-nowrap font-medium">
          FIG. ref
        </span>
      </ToolbarButton>

      <Divider />

      {/* ── Insert ─────────────────────────────────────────────── */}

      <ToolbarButton
        onClick={onInsertImage}
        disabled={d}
        title="Insert Image"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={onAddComment}
        disabled={d || !editor?.state.selection || editor.state.selection.empty}
        title="Add Comment"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </ToolbarButton>

      {/* ── Spacer ─────────────────────────────────────────────── */}

      <div className="flex-1 min-w-4" />

      {/* ── Right-aligned controls ─────────────────────────────── */}

      {lastSavedAt && !isDirty && !isSaving && (
        <span className="text-[10px] text-text-muted mr-2 whitespace-nowrap">
          Saved {formatTimestamp(lastSavedAt)}
        </span>
      )}

      {isDirty && !isSaving && (
        <span className="text-[10px] text-yellow-warning mr-2 whitespace-nowrap">
          Unsaved changes
        </span>
      )}

      {isSaving && (
        <span className="text-[10px] text-text-muted mr-2 whitespace-nowrap">
          Saving...
        </span>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={d || isSaving || !isDirty}
        className={`
          inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded
          transition-colors duration-100
          ${
            isDirty && !isSaving
              ? "bg-blue-ribbon text-white hover:bg-accent-hover"
              : "bg-neutral-off-white text-text-muted cursor-not-allowed"
          }
        `}
        title="Save Document"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
        Save
      </button>

      <ToolbarButton onClick={onToggleHistory} disabled={d} title="Version History">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </ToolbarButton>

      <ToolbarButton onClick={onToggleComments} disabled={d} title="Toggle Comments">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        </svg>
      </ToolbarButton>
    </div>
  );
}
