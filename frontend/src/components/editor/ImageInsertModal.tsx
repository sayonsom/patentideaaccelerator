"use client";

import { useState, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";

// ─── Types ──────────────────────────────────────────────────────────

interface ImageInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  onImageInserted: (image: {
    src: string;
    figureNum: number;
    caption: string;
    imageId: string;
  }) => void;
}

interface UploadResult {
  id: string;
  url: string;
  filename: string;
  figureNum: number;
  caption: string;
}

interface DiagramResult {
  id: string;
  url: string;
  figureNum: number;
  caption: string;
  filename: string;
}

// ─── Constants ──────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const DIAGRAM_TYPE_OPTIONS = [
  { value: "flowchart", label: "Flowchart" },
  { value: "architecture", label: "System Architecture" },
  { value: "sequence", label: "Sequence Diagram" },
  { value: "block", label: "Block Diagram" },
  { value: "methodology", label: "State Machine" },
];

const TAB_DEFS = [
  { id: "upload", label: "Upload" },
  { id: "generate", label: "Generate Diagram" },
  { id: "sketch", label: "Convert Sketch" },
];

// ─── Component ──────────────────────────────────────────────────────

export function ImageInsertModal({
  isOpen,
  onClose,
  documentId,
  onImageInserted,
}: ImageInsertModalProps) {
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <Modal open={isOpen} onClose={onClose} title="Insert Image" maxWidth="lg">
      <Tabs
        tabs={TAB_DEFS}
        activeTab={activeTab}
        onChange={setActiveTab}
      >
        <TabPanel id="upload" activeTab={activeTab}>
          <UploadTab
            documentId={documentId}
            onImageInserted={onImageInserted}
            onClose={onClose}
          />
        </TabPanel>
        <TabPanel id="generate" activeTab={activeTab}>
          <GenerateDiagramTab
            documentId={documentId}
            onImageInserted={onImageInserted}
            onClose={onClose}
          />
        </TabPanel>
        <TabPanel id="sketch" activeTab={activeTab}>
          <ConvertSketchTab
            documentId={documentId}
            onImageInserted={onImageInserted}
            onClose={onClose}
          />
        </TabPanel>
      </Tabs>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Tab 1: Upload
// ═══════════════════════════════════════════════════════════════════

interface TabProps {
  documentId: string;
  onImageInserted: ImageInsertModalProps["onImageInserted"];
  onClose: () => void;
}

function UploadTab({ documentId, onImageInserted, onClose }: TabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError("Unsupported file type. Please upload a PNG, JPEG, or WebP image.");
      return;
    }

    if (f.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 10 MB.");
      return;
    }

    setFile(f);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentId", documentId);
    if (caption) formData.append("caption", caption);

    try {
      const res = await fetch("/api/documents/images", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(data.error || `Upload failed (${res.status})`);
      }

      const data: UploadResult = await res.json();
      onImageInserted({
        src: data.url,
        figureNum: data.figureNum,
        caption: data.caption,
        imageId: data.id,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`
          relative flex flex-col items-center justify-center
          border-2 border-dashed rounded-lg p-8
          transition-colors cursor-pointer
          ${dragActive ? "border-blue-ribbon bg-blue-ribbon/5" : "border-border hover:border-border-hover"}
          ${file ? "bg-neutral-off-white" : ""}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !file && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {preview ? (
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 max-w-full rounded border border-border object-contain"
            />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted truncate max-w-[200px]">
                {file?.name}
              </span>
              <span className="text-text-muted">
                ({((file?.size ?? 0) / 1024).toFixed(0)} KB)
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="text-danger text-xs hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-muted">
            <svg
              width="32"
              height="32"
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
            <p className="text-sm font-medium">
              Drag and drop an image, or click to browse
            </p>
            <p className="text-xs">PNG, JPEG, or WebP (max 10 MB)</p>
          </div>
        )}
      </div>

      {/* Caption */}
      <Input
        label="Caption"
        placeholder="e.g., FIG. 1 is a block diagram of the system architecture..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      {/* Error */}
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose} size="sm">
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          loading={uploading}
          size="sm"
        >
          Upload
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Tab 2: Generate Diagram
// ═══════════════════════════════════════════════════════════════════

function GenerateDiagramTab({ documentId, onImageInserted, onClose }: TabProps) {
  const [sourceContext, setSourceContext] = useState("");
  const [communicativeIntent, setCommunicativeIntent] = useState("");
  const [diagramType, setDiagramType] = useState("flowchart");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagramResult | null>(null);

  const handleGenerate = async () => {
    if (!sourceContext.trim() || !communicativeIntent.trim()) return;

    setGenerating(true);
    setError(null);
    setResult(null);

    // Attempt to read Gemini key from localStorage
    let geminiKey: string | undefined;
    try {
      geminiKey = localStorage.getItem("gemini-api-key") || undefined;
    } catch {
      // localStorage not available
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (geminiKey) {
        headers["x-gemini-key"] = geminiKey;
      }

      const res = await fetch("/api/documents/diagrams", {
        method: "POST",
        headers,
        body: JSON.stringify({
          documentId,
          sourceContext,
          communicativeIntent,
          diagramType,
          style: "patent_bw",
          mode: "generate",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(data.error || `Generation failed (${res.status})`);
      }

      const data: DiagramResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Diagram generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleInsert = () => {
    if (!result) return;
    onImageInserted({
      src: result.url,
      figureNum: result.figureNum,
      caption: result.caption,
      imageId: result.id,
    });
    onClose();
  };

  return (
    <div className="space-y-4">
      <Textarea
        label="Description"
        placeholder="Describe the technical system, architecture, or process you want to diagram..."
        value={sourceContext}
        onChange={(e) => setSourceContext(e.target.value)}
        rows={4}
      />

      <Input
        label="Caption / Intent"
        placeholder="e.g., Show the data flow between the ingestion pipeline and ML inference service"
        value={communicativeIntent}
        onChange={(e) => setCommunicativeIntent(e.target.value)}
      />

      <Select
        label="Diagram Type"
        options={DIAGRAM_TYPE_OPTIONS}
        value={diagramType}
        onChange={(val) => setDiagramType(val)}
      />

      {/* Error */}
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}

      {/* Generating spinner */}
      {generating && (
        <div className="flex items-center gap-3 py-6 justify-center">
          <Spinner size="md" />
          <span className="text-sm text-text-muted">
            Generating diagram... This may take up to 30 seconds.
          </span>
        </div>
      )}

      {/* Preview result */}
      {result && !generating && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
            Preview
          </p>
          <div className="border border-border rounded-lg p-3 bg-neutral-off-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.url}
              alt={result.caption || "Generated diagram"}
              className="max-h-64 max-w-full mx-auto object-contain rounded"
            />
          </div>
          <p className="text-xs text-text-muted text-center">
            FIG. {result.figureNum} -- {result.caption}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose} size="sm">
          Cancel
        </Button>
        {result && !generating ? (
          <Button onClick={handleInsert} size="sm">
            Insert
          </Button>
        ) : (
          <Button
            onClick={handleGenerate}
            disabled={!sourceContext.trim() || !communicativeIntent.trim() || generating}
            loading={generating}
            size="sm"
          >
            Generate
          </Button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Tab 3: Convert Sketch
// ═══════════════════════════════════════════════════════════════════

function ConvertSketchTab({ documentId, onImageInserted, onClose }: TabProps) {
  const [sketchFile, setSketchFile] = useState<File | null>(null);
  const [sketchPreview, setSketchPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagramResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSketchFile = useCallback((f: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError("Unsupported file type. Please upload a PNG, JPEG, or WebP image.");
      return;
    }

    if (f.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 10 MB.");
      return;
    }

    setSketchFile(f);

    const reader = new FileReader();
    reader.onload = (e) => {
      setSketchPreview(e.target?.result as string);
    };
    reader.readAsDataURL(f);
  }, []);

  const handleConvert = async () => {
    if (!sketchFile || !description.trim()) return;

    setConverting(true);
    setError(null);
    setResult(null);

    // Read sketch as base64
    const arrayBuffer = await sketchFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Attempt to read Gemini key from localStorage
    let geminiKey: string | undefined;
    try {
      geminiKey = localStorage.getItem("gemini-api-key") || undefined;
    } catch {
      // localStorage not available
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (geminiKey) {
        headers["x-gemini-key"] = geminiKey;
      }

      const res = await fetch("/api/documents/diagrams", {
        method: "POST",
        headers,
        body: JSON.stringify({
          documentId,
          sourceContext: description,
          communicativeIntent: description,
          mode: "convert_sketch",
          sketchImageBase64: base64,
          description,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Conversion failed" }));
        throw new Error(data.error || `Conversion failed (${res.status})`);
      }

      const data: DiagramResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sketch conversion failed");
    } finally {
      setConverting(false);
    }
  };

  const handleInsert = () => {
    if (!result) return;
    onImageInserted({
      src: result.url,
      figureNum: result.figureNum,
      caption: result.caption,
      imageId: result.id,
    });
    onClose();
  };

  return (
    <div className="space-y-4">
      {/* Sketch file input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
          Sketch Image
        </label>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            {sketchFile ? "Change File" : "Choose File"}
          </Button>
          {sketchFile && (
            <span className="text-sm text-text-muted truncate max-w-[250px]">
              {sketchFile.name}
            </span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleSketchFile(f);
            }}
          />
        </div>
      </div>

      {/* Sketch preview */}
      {sketchPreview && (
        <div className="border border-border rounded-lg p-3 bg-neutral-off-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sketchPreview}
            alt="Sketch preview"
            className="max-h-40 max-w-full mx-auto object-contain rounded"
          />
        </div>
      )}

      <Textarea
        label="Description"
        placeholder="Describe what this sketch shows so the AI can produce a clean patent-style diagram..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      {/* Error */}
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}

      {/* Converting spinner */}
      {converting && (
        <div className="flex items-center gap-3 py-6 justify-center">
          <Spinner size="md" />
          <span className="text-sm text-text-muted">
            Converting sketch... This may take up to 30 seconds.
          </span>
        </div>
      )}

      {/* Converted result preview */}
      {result && !converting && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
            Converted Result
          </p>
          <div className="border border-border rounded-lg p-3 bg-neutral-off-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.url}
              alt={result.caption || "Converted diagram"}
              className="max-h-64 max-w-full mx-auto object-contain rounded"
            />
          </div>
          <p className="text-xs text-text-muted text-center">
            FIG. {result.figureNum} -- {result.caption}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose} size="sm">
          Cancel
        </Button>
        {result && !converting ? (
          <Button onClick={handleInsert} size="sm">
            Insert
          </Button>
        ) : (
          <Button
            onClick={handleConvert}
            disabled={!sketchFile || !description.trim() || converting}
            loading={converting}
            size="sm"
          >
            Convert
          </Button>
        )}
      </div>
    </div>
  );
}
