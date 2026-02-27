"use client";

import { EditorContent as TiptapEditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/react";

interface EditorContentProps {
  editor: Editor | null;
}

/**
 * Styled wrapper around Tiptap's EditorContent.
 *
 * Renders the ProseMirror editing surface inside a page-like container with
 * white background, comfortable padding, and a constrained max-width for
 * readability. The outer container class `patent-editor-content` is used to
 * target ProseMirror styles in globals.css.
 */
export function EditorContent({ editor }: EditorContentProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto py-8 px-12 min-h-full patent-editor-content">
        <TiptapEditorContent editor={editor} />
      </div>
    </div>
  );
}
