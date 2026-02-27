"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { DocumentImage } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

// ─── Props ──────────────────────────────────────────────────────────

interface FigureGalleryProps {
  images: DocumentImage[];
  onRemove: (id: string) => void;
  onUpdateCaption: (id: string, caption: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sourceLabel(sourceType: string): string {
  switch (sourceType) {
    case "generated":
      return "AI Generated";
    case "sketch_converted":
      return "Sketch Converted";
    default:
      return "Uploaded";
  }
}

function sourceBadgeColor(sourceType: string): string {
  switch (sourceType) {
    case "generated":
      return "#2F7F9D";
    case "sketch_converted":
      return "#C69214";
    default:
      return "#5B7FA6";
  }
}

// ─── Editable Caption ───────────────────────────────────────────────

interface EditableCaptionProps {
  caption: string;
  onSave: (caption: string) => void;
}

function EditableCaption({ caption, onSave }: EditableCaptionProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(caption);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(caption);
  }, [caption]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed !== caption) {
      onSave(trimmed);
    }
  }, [value, caption, onSave]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setValue(caption);
            setEditing(false);
          }
        }}
        className="w-full text-xs px-1.5 py-0.5 bg-white border border-blue-ribbon rounded text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="text-xs text-text-muted text-left w-full truncate hover:text-ink transition-colors cursor-text"
      title="Click to edit caption"
    >
      {caption || "Click to add caption..."}
    </button>
  );
}

// ─── Figure Card ────────────────────────────────────────────────────

interface FigureCardProps {
  image: DocumentImage;
  onRemove: (id: string) => void;
  onUpdateCaption: (id: string, caption: string) => void;
}

function FigureCard({ image, onRemove, onUpdateCaption }: FigureCardProps) {
  const [hovered, setHovered] = useState(false);

  const imageUrl = image.url || "";

  return (
    <div
      className="group relative border border-border rounded-lg overflow-hidden bg-white transition-shadow hover:shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-neutral-off-white flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={image.caption || `Figure ${image.figureNum ?? ""}`}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-neutral-light">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-[10px]">No preview</span>
          </div>
        )}

        {/* Delete button overlay */}
        {hovered && (
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-danger text-white flex items-center justify-center text-xs shadow-md hover:bg-red-700 transition-colors"
            title="Remove figure"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Figure number badge */}
        {image.figureNum != null && (
          <div className="absolute top-1.5 left-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-black-pearl text-white shadow-sm">
              FIG. {image.figureNum}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-2.5 py-2 space-y-1.5">
        {/* Caption (editable) */}
        <EditableCaption
          caption={image.caption}
          onSave={(newCaption) => onUpdateCaption(image.id, newCaption)}
        />

        {/* Metadata row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            color={sourceBadgeColor(image.sourceType)}
            size="sm"
          >
            {sourceLabel(image.sourceType)}
          </Badge>
          <span className="text-[10px] text-text-muted">
            {formatBytes(image.sizeBytes)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export function FigureGallery({
  images,
  onRemove,
  onUpdateCaption,
}: FigureGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-muted">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-3 opacity-40"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p className="text-sm font-medium">No figures yet.</p>
        <p className="text-xs mt-1">
          Insert images from the toolbar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">
          Figures ({images.length})
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((image) => (
          <FigureCard
            key={image.id}
            image={image}
            onRemove={onRemove}
            onUpdateCaption={onUpdateCaption}
          />
        ))}
      </div>
    </div>
  );
}
