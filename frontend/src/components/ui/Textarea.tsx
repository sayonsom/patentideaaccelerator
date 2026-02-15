"use client";

import { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-3 py-2 text-sm text-text-primary
            bg-surface-card border border-border rounded-lg
            placeholder:text-text-faint
            focus:border-accent-gold focus:ring-1 focus:ring-accent-gold focus:outline-none
            transition-colors resize-y min-h-[80px]
            ${error ? "border-accent-red" : ""}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-xs text-accent-red">{error}</span>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
