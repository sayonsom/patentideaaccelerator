"use client";

import { useState } from "react";

export function Badge({ children, color = "#64748b", onClick, removable, active }) {
  return (
    <span
      onClick={onClick}
      style={{
        background: active ? color + "25" : color + "10",
        color,
        border: `1px solid ${active ? color : color + "30"}`,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        cursor: onClick ? "pointer" : "default",
        letterSpacing: 0.2,
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
      {removable && <span style={{ marginLeft: 2, opacity: 0.6 }}>×</span>}
    </span>
  );
}

export function Card({ children, style, onClick, hover }) {
  const [h, setH] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: h && hover ? "#1e293b" : "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 12,
        padding: 20,
        transition: "all 0.2s",
        cursor: onClick ? "pointer" : "default",
        transform: h && hover ? "translateY(-1px)" : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", style, disabled }) {
  const V = {
    primary: { background: "#3b82f6", color: "#fff" },
    secondary: { background: "#1e293b", color: "#94a3b8", border: "1px solid #334155" },
    danger: { background: "#7f1d1d", color: "#fca5a5" },
    ghost: { background: "transparent", color: "#94a3b8" },
    accent: { background: "#f59e0b", color: "#0f172a" },
    green: { background: "#065f46", color: "#6ee7b7" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 18px",
        borderRadius: 8,
        border: "none",
        fontSize: 13,
        fontWeight: 600,
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.15s",
        letterSpacing: 0.2,
        ...V[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Input({ value, onChange, placeholder, onKeyDown, style, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      style={{
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 8,
        padding: "10px 14px",
        color: "#e2e8f0",
        fontSize: 14,
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
        ...style,
      }}
    />
  );
}

export function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 8,
        padding: "10px 14px",
        color: "#e2e8f0",
        fontSize: 14,
        resize: "vertical",
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

export function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: "#64748b",
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}
