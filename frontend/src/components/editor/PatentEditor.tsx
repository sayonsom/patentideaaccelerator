"use client";

import { useState, useCallback } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import CodeBlock from "@tiptap/extension-code-block";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import CharacterCount from "@tiptap/extension-character-count";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

import {
  PatentParagraph,
  CommentMark,
  PatentImage,
  PatentFigureRef,
  PatentClaimBlock,
} from "@/components/editor/extensions";
import { usePatentDocumentStore } from "@/lib/stores/patent-document-store";
import { useDocumentAutoSave } from "@/hooks/useDocumentAutoSave";
import { useDoubleShift } from "@/hooks/useDoubleShift";

import { EditorToolbar } from "./EditorToolbar";
import { EditorContent } from "./EditorContent";
import { CommentSidebar } from "./CommentSidebar";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import { ImageInsertModal } from "./ImageInsertModal";
import { InlinePromptBar } from "./InlinePromptBar";

// ─── Props ──────────────────────────────────────────────────────────

interface PatentEditorProps {
  documentId: string;
  initialContent: Record<string, unknown>;
}

// ─── Main Editor ────────────────────────────────────────────────────

export function PatentEditor({ documentId, initialContent }: PatentEditorProps) {
  // Store selectors
  const updateContent = usePatentDocumentStore((s) => s.updateContent);
  const saveDocument = usePatentDocumentStore((s) => s.saveDocument);
  const isDirty = usePatentDocumentStore((s) => s.isDirty);
  const commentSidebarOpen = usePatentDocumentStore((s) => s.commentSidebarOpen);
  const versionPanelOpen = usePatentDocumentStore((s) => s.versionPanelOpen);
  const toggleCommentSidebar = usePatentDocumentStore((s) => s.toggleCommentSidebar);
  const toggleVersionPanel = usePatentDocumentStore((s) => s.toggleVersionPanel);

  // Auto-save
  const { isSaving, lastSavedAt } = useDocumentAutoSave();

  // Local UI state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [showInlinePrompt, setShowInlinePrompt] = useState(false);

  // ── Tiptap editor instance ──────────────────────────────────────

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Undo/redo (tiptap v3 renamed `history` to `undoRedo`)
        undoRedo: {
          depth: 100,
        },
        // Disable the default paragraph since PatentParagraph takes over
        paragraph: false,
        // Disable built-in codeBlock/horizontalRule so the explicit extensions control them
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing your patent document...",
      }),
      PatentParagraph,
      CommentMark,
      PatentImage,
      PatentFigureRef,
      PatentClaimBlock,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Superscript,
      Subscript,
      CodeBlock,
      HorizontalRule,
      CharacterCount,
    ],
    content: initialContent,
    onUpdate: ({ editor: e }) => {
      updateContent(e.getJSON() as Record<string, unknown>);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[60vh]",
      },
    },
  });

  // ── Double-shift to open inline prompt ────────────────────────
  useDoubleShift(
    () => {
      if (editor?.isFocused) {
        setShowInlinePrompt(true);
      }
    },
    !showInlinePrompt // disable detection while prompt is already open
  );

  // ── Callbacks ───────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    saveDocument("Manual save", "manual");
  }, [saveDocument]);

  const handleInsertImage = useCallback(() => {
    setImageModalOpen(true);
  }, []);

  const handleImageInserted = useCallback(
    (image: { src: string; figureNum: number; caption: string; imageId: string }) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .setPatentImage({
          src: image.src,
          figureNum: image.figureNum,
          caption: image.caption,
          imageId: image.imageId,
        })
        .run();
    },
    [editor]
  );

  const handleAddComment = useCallback(() => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) return;

    const commentId = `comment-${Date.now()}`;
    editor.chain().focus().setComment(commentId).run();

    // Open the comment sidebar so the user can type the comment content
    const store = usePatentDocumentStore.getState();
    if (!store.commentSidebarOpen) {
      store.toggleCommentSidebar();
    }
    store.setActiveComment(commentId);

    // Grab the selected text for the anchor
    const anchorText = editor.state.doc.textBetween(from, to, " ");
    store.addComment({
      content: "",
      anchorFrom: from,
      anchorTo: to,
      anchorText,
    });
  }, [editor]);

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden bg-white">
      <EditorToolbar
        editor={editor}
        onInsertImage={handleInsertImage}
        onAddComment={handleAddComment}
        onSave={handleSave}
        onToggleHistory={toggleVersionPanel}
        onToggleComments={toggleCommentSidebar}
        isSaving={isSaving}
        isDirty={isDirty}
        lastSavedAt={lastSavedAt}
      />

      {/* Inline AI prompt bar (triggered by double-shift) */}
      {showInlinePrompt && editor && (
        <InlinePromptBar
          editor={editor}
          documentId={documentId}
          onClose={() => setShowInlinePrompt(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <EditorContent editor={editor} />
        {commentSidebarOpen && <CommentSidebar />}
      </div>

      {versionPanelOpen && <VersionHistoryPanel />}

      <ImageInsertModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        documentId={documentId}
        onImageInserted={handleImageInserted}
      />
    </div>
  );
}
