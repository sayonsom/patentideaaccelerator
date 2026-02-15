"use client";

import { useEffect, useState, useCallback } from "react";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

const variantStyles: Record<ToastVariant, string> = {
  success: "bg-green-900/90 border-green-700 text-green-100",
  error: "bg-red-900/90 border-red-700 text-red-100",
  info: "bg-blue-900/90 border-blue-700 text-blue-100",
  warning: "bg-yellow-900/90 border-yellow-700 text-yellow-100",
};

const variantIcons: Record<ToastVariant, string> = {
  success: "\u2713",
  error: "\u2717",
  info: "\u2139",
  warning: "\u26A0",
};

let addToastGlobal: ((message: string, variant?: ToastVariant) => void) | null = null;

/** Call from anywhere to show a toast */
export function toast(message: string, variant: ToastVariant = "info") {
  addToastGlobal?.(message, variant);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = Math.random().toString(36).slice(2, 8);
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    addToastGlobal = addToast;
    return () => {
      addToastGlobal = null;
    };
  }, [addToast]);

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastMessage key={t.id} toast={t} onDismiss={removeToast} />
        ))}
      </div>
    </>
  );
}

function ToastMessage({
  toast: t,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(t.id), 4000);
    return () => clearTimeout(timer);
  }, [t.id, onDismiss]);

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg text-sm animate-slide-up ${variantStyles[t.variant]}`}
      role="alert"
    >
      <span className="text-base">{variantIcons[t.variant]}</span>
      <span className="flex-1">{t.message}</span>
      <button
        onClick={() => onDismiss(t.id)}
        className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        \u2715
      </button>
    </div>
  );
}
