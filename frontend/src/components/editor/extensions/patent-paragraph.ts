import { Node, mergeAttributes } from '@tiptap/core';

export interface PatentParagraphOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraph: {
      /**
       * Convert the current paragraph to a numbered patent paragraph.
       * @param paragraphNumber The paragraph number to assign.
       */
      setPatentParagraph: (paragraphNumber: number) => ReturnType;
      /**
       * Remove patent paragraph numbering, reverting to a regular paragraph.
       */
      unsetPatentParagraph: () => ReturnType;
    };
  }
}

/**
 * A custom paragraph node for patent documents that supports numbered paragraphs.
 *
 * When `paragraphNumber` is set, renders as:
 *   <p class="patent-paragraph" data-paragraph-number="1">...</p>
 *
 * CSS should handle rendering the number in the left margin as [0001].
 */
export const PatentParagraph = Node.create<PatentParagraphOptions>({
  name: 'paragraph',

  priority: 1000,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  content: 'inline*',

  addAttributes() {
    return {
      paragraphNumber: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute('data-paragraph-number');
          return value ? parseInt(value, 10) : null;
        },
        renderHTML: (attributes) => {
          if (attributes.paragraphNumber == null) {
            return {};
          }
          return {
            'data-paragraph-number': attributes.paragraphNumber,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'p[data-paragraph-number]',
        priority: 51,
      },
      {
        tag: 'p',
        priority: 50,
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const hasNumber = node.attrs.paragraphNumber != null;

    return [
      'p',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        hasNumber ? { class: 'patent-paragraph' } : {},
      ),
      0,
    ];
  },

  addCommands() {
    return {
      setPatentParagraph:
        (paragraphNumber: number) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, {
            paragraphNumber,
          });
        },

      unsetPatentParagraph:
        () =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, {
            paragraphNumber: null,
          });
        },
    };
  },
});
