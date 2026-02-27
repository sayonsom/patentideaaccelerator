import { Node, mergeAttributes } from '@tiptap/core';

export type ClaimType = 'independent' | 'dependent';

export interface PatentClaimBlockOptions {
  HTMLAttributes: Record<string, unknown>;
}

export interface InsertClaimOptions {
  claimNumber: number;
  claimType?: ClaimType;
  dependsOn?: number | null;
  content?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    patentClaim: {
      /**
       * Insert a new patent claim block at the current position.
       * @param options Claim number, type, dependency, and optional initial content.
       */
      insertClaim: (options: InsertClaimOptions) => ReturnType;
      /**
       * Toggle the claim type between independent and dependent for the current claim block.
       */
      toggleClaimType: () => ReturnType;
    };
  }
}

/**
 * A block node for patent claims.
 *
 * Stores claim metadata: number, type (independent/dependent), and dependency.
 *
 * Renders as:
 *   <div class="patent-claim" data-claim-number="1" data-claim-type="independent">
 *     ...editable content...
 *   </div>
 *
 * For dependent claims, the CSS or rendering layer should handle indentation
 * and prefixing with "The method of claim X, wherein..." style language.
 */
export const PatentClaimBlock = Node.create<PatentClaimBlockOptions>({
  name: 'patentClaim',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  content: 'inline*',

  defining: true,

  addAttributes() {
    return {
      claimNumber: {
        default: 1,
        parseHTML: (element) => {
          const value = element.getAttribute('data-claim-number');
          return value ? parseInt(value, 10) : 1;
        },
        renderHTML: (attributes) => {
          return {
            'data-claim-number': attributes.claimNumber,
          };
        },
      },
      claimType: {
        default: 'independent' as ClaimType,
        parseHTML: (element) => {
          const value = element.getAttribute('data-claim-type');
          if (value === 'dependent' || value === 'independent') {
            return value;
          }
          return 'independent';
        },
        renderHTML: (attributes) => {
          return {
            'data-claim-type': attributes.claimType,
          };
        },
      },
      dependsOn: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute('data-depends-on');
          return value ? parseInt(value, 10) : null;
        },
        renderHTML: (attributes) => {
          if (attributes.dependsOn == null) {
            return {};
          }
          return {
            'data-depends-on': attributes.dependsOn,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.patent-claim',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const classes = ['patent-claim'];
    if (node.attrs.claimType === 'dependent') {
      classes.push('patent-claim--dependent');
    }

    return [
      'div',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        { class: classes.join(' ') },
      ),
      0,
    ];
  },

  addCommands() {
    return {
      insertClaim:
        (options: InsertClaimOptions) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              claimNumber: options.claimNumber,
              claimType: options.claimType ?? 'independent',
              dependsOn: options.dependsOn ?? null,
            },
            content: options.content
              ? [{ type: 'text', text: options.content }]
              : undefined,
          });
        },

      toggleClaimType:
        () =>
        ({ state, commands }) => {
          const { selection } = state;
          const node = state.doc.nodeAt(selection.from);

          if (!node || node.type.name !== this.name) {
            // Try to find the parent patent claim node
            const $pos = state.doc.resolve(selection.from);
            for (let depth = $pos.depth; depth > 0; depth--) {
              const ancestor = $pos.node(depth);
              if (ancestor.type.name === this.name) {
                const newType: ClaimType =
                  ancestor.attrs.claimType === 'independent'
                    ? 'dependent'
                    : 'independent';

                return commands.updateAttributes(this.name, {
                  claimType: newType,
                  dependsOn: newType === 'independent' ? null : ancestor.attrs.dependsOn,
                });
              }
            }
            return false;
          }

          const newType: ClaimType =
            node.attrs.claimType === 'independent' ? 'dependent' : 'independent';

          return commands.updateAttributes(this.name, {
            claimType: newType,
            dependsOn: newType === 'independent' ? null : node.attrs.dependsOn,
          });
        },
    };
  },
});
