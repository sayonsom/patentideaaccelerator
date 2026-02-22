"use client";

import { useState, useRef } from "react";
import { Badge } from "./Badge";

interface TagInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({
  label,
  tags,
  onChange,
  suggestions = [],
  placeholder = "Type and press Enter...",
  maxTags,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(input.toLowerCase()) &&
      !tags.includes(s)
  );

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    if (maxTags && tags.length >= maxTags) return;
    onChange([...tags, trimmed]);
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-border rounded-md min-h-[42px]">
          {tags.map((tag) => (
            <Badge
              key={tag}
              color="#2251FF"
              removable
              onRemove={() => removeTag(tag)}
            >
              {tag}
            </Badge>
          ))}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (filtered.length > 0 && input) {
                  addTag(filtered[0]);
                } else if (input) {
                  addTag(input);
                }
              }
              if (e.key === "Backspace" && !input && tags.length > 0) {
                removeTag(tags[tags.length - 1]);
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={tags.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] bg-transparent text-sm text-ink placeholder:text-neutral-light outline-none border-none focus:ring-0"
          />
        </div>
        {showSuggestions && filtered.length > 0 && input && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {filtered.slice(0, 8).map((s) => (
              <button
                key={s}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(s)}
                className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-neutral-off-white hover:text-ink transition-colors"
                type="button"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
