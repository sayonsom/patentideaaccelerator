import { Node, mergeAttributes } from '@tiptap/core';

export interface PatentFigureRefOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    figureRef: {
      /**
       * Insert an inline figure reference (e.g., "FIG. 1") at the current cursor position.
       * @param figureNum The figure number to reference.
       */
      insertFigureRef: (figureNum: number) => ReturnType;
    };
  }
}

/**
 * An inline, non-editable node for cross-referencing patent figures.
 *
 * Renders as: <span class="figure-ref" data-figure-num="X">FIG. X</span>
 *
 * This is an atom node -- it cannot be edited directly, only inserted or deleted.
 */
export const PatentFigureRef = Node.create<PatentFigureRefOptions>({
  name: 'figureRef',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'inline',

  inline: true,

  atom: true,

  selectable: true,

  draggable: false,

  addAttributes() {
    return {
      figureNum: {
        default: 1,
        parseHTML: (element) => {
          const value = element.getAttribute('data-figure-num');
          return value ? parseInt(value, 10) : 1;
        },
        renderHTML: (attributes) => {
          return {
            'data-figure-num': attributes.figureNum,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.figure-ref[data-figure-num]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        this.options.HTMLAttributes,
        { class: 'figure-ref' },
        HTMLAttributes,
      ),
      `FIG. ${node.attrs.figureNum}`,
    ];
  },

  addCommands() {
    return {
      insertFigureRef:
        (figureNum: number) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { figureNum },
          });
        },
    };
  },
});
