import { Mark, mergeAttributes } from '@tiptap/core';

export interface CommentMarkOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      /**
       * Apply a comment highlight to the selected text.
       * @param commentId A unique identifier for the comment thread.
       */
      setComment: (commentId: string) => ReturnType;
      /**
       * Remove the comment highlight from the selected text.
       */
      unsetComment: () => ReturnType;
    };
  }
}

/**
 * A Mark extension for highlighting commented text in a patent document.
 *
 * Renders as: <span class="comment-highlight" data-comment-id="X">...</span>
 *
 * Supports multiple overlapping comments on the same text range via `inclusive: true`.
 */
export const CommentMark = Mark.create<CommentMarkOptions>({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  inclusive: true,

  excludes: '',

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-id'),
        renderHTML: (attributes) => {
          if (!attributes.commentId) {
            return {};
          }
          return {
            'data-comment-id': attributes.commentId,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        this.options.HTMLAttributes,
        { class: 'comment-highlight' },
        HTMLAttributes,
      ),
      0,
    ];
  },

  addCommands() {
    return {
      setComment:
        (commentId: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { commentId });
        },

      unsetComment:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
