"use client";

import { forwardRef, useRef, useEffect, useCallback } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  autoExpand?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", autoExpand = true, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      },
      [ref]
    );

    useEffect(() => {
      if (!autoExpand || !internalRef.current) return;
      const el = internalRef.current;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, [props.value, autoExpand]);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          ref={setRefs}
          className={`
            w-full px-3 py-2 text-sm text-ink
            bg-white border border-border rounded-md
            placeholder:text-neutral-light
            focus:border-blue-ribbon focus:ring-1 focus:ring-blue-ribbon focus:outline-none
            transition-colors resize-none min-h-[80px]
            ${error ? "border-danger" : ""}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-xs text-danger">{error}</span>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
