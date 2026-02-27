import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';

export interface PatentImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, unknown>;
}

export interface SetPatentImageOptions {
  src: string;
  alt?: string;
  title?: string;
  figureNum?: number | null;
  caption?: string;
  imageId?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    patentImage: {
      /**
       * Insert a patent figure with optional numbering and caption.
       * @param options Image source, figure number, caption, and image ID.
       */
      setPatentImage: (options: SetPatentImageOptions) => ReturnType;
    };
  }
}

/**
 * Extends the Tiptap Image extension for patent documents.
 *
 * Adds `figureNum`, `caption`, and `imageId` attributes.
 * Renders as:
 *   <figure class="patent-figure">
 *     <img src="..." alt="..." />
 *     <figcaption>FIG. X -- caption</figcaption>
 *   </figure>
 */
export const PatentImage = Image.extend<PatentImageOptions>({
  name: 'patentImage',

  group: 'block',

  inline: false,

  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      figureNum: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute('data-figure-num');
          return value ? parseInt(value, 10) : null;
        },
        renderHTML: (attributes) => {
          if (attributes.figureNum == null) {
            return {};
          }
          return {
            'data-figure-num': attributes.figureNum,
          };
        },
      },
      caption: {
        default: '',
        parseHTML: (element) => {
          const figcaption = element.querySelector('figcaption');
          return figcaption?.textContent ?? '';
        },
        renderHTML: () => {
          // Caption is rendered in the figure wrapper, not as an attribute
          return {};
        },
      },
      imageId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-image-id'),
        renderHTML: (attributes) => {
          if (!attributes.imageId) {
            return {};
          }
          return {
            'data-image-id': attributes.imageId,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure.patent-figure',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const img = element.querySelector('img');
          if (!img) return false;
          return {};
        },
      },
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { figureNum, caption } = node.attrs;

    const imgAttrs = mergeAttributes(
      this.options.HTMLAttributes,
      {
        src: HTMLAttributes.src,
        alt: HTMLAttributes.alt,
        title: HTMLAttributes.title,
        'data-figure-num': HTMLAttributes['data-figure-num'],
        'data-image-id': HTMLAttributes['data-image-id'],
      },
    );

    // Build the figcaption text
    let figcaptionText = '';
    if (figureNum != null) {
      figcaptionText = `FIG. ${figureNum}`;
      if (caption) {
        figcaptionText += ` \u2014 ${caption}`;
      }
    } else if (caption) {
      figcaptionText = caption;
    }

    if (figureNum != null || caption) {
      return [
        'figure',
        { class: 'patent-figure' },
        ['img', imgAttrs],
        ['figcaption', {}, figcaptionText],
      ];
    }

    return ['img', imgAttrs];
  },

  addCommands() {
    return {
      setPatentImage:
        (options: SetPatentImageOptions) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              alt: options.alt ?? null,
              title: options.title ?? null,
              figureNum: options.figureNum ?? null,
              caption: options.caption ?? '',
              imageId: options.imageId ?? null,
            },
          });
        },
    };
  },
});
