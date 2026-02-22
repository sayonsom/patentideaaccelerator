"use client";

import { useEffect, useState, useCallback } from "react";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

const variantStyles: Record<ToastVariant, string> = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
};

const variantIcons: Record<ToastVariant, string> = {
  success: "\u2713",
  error: "\u2717",
  info: "\u2139",
  warning: "\u26A0",
};

let addToastGlobal: ((message: string, variant?: ToastVariant) => void) | null = null;

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
      className={`pointer-events-auto flex items-center gap-2 rounded-md border px-4 py-3 shadow-lg text-sm animate-slide-up ${variantStyles[t.variant]}`}
      role="alert"
    >
      <span className="text-base">{variantIcons[t.variant]}</span>
      <span className="flex-1">{t.message}</span>
      <button
        onClick={() => onDismiss(t.id)}
        className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        &#x2715;
      </button>
    </div>
  );
}
