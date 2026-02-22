"use client";

import { useState } from "react";
import { Button, Spinner } from "@/components/ui";

interface ExportButtonsProps {
  ideaId: string;
  ideaTitle: string;
}

export function ExportButtons({ ideaId, ideaTitle }: ExportButtonsProps) {
  const [exporting, setExporting] = useState<"docx" | "pptx" | null>(null);

  async function handleExport(format: "docx" | "pptx") {
    setExporting(format);
    try {
      const res = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(ideaTitle || "patent-disclosure").replace(/[^a-zA-Z0-9-_ ]/g, "")}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleExport("docx")}
        disabled={exporting !== null}
      >
        {exporting === "docx" ? (
          <Spinner size="sm" className="mr-1.5" />
        ) : (
          <svg
            className="w-4 h-4 mr-1.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        )}
        Word
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleExport("pptx")}
        disabled={exporting !== null}
      >
        {exporting === "pptx" ? (
          <Spinner size="sm" className="mr-1.5" />
        ) : (
          <svg
            className="w-4 h-4 mr-1.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
            />
          </svg>
        )}
        PowerPoint
      </Button>
    </div>
  );
}
