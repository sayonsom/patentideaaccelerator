"use client";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: "solid" | "outline";
  size?: "sm" | "md";
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function Badge({
  children,
  color,
  variant = "solid",
  size = "sm",
  removable = false,
  onRemove,
  className = "",
}: BadgeProps) {
  const sizeClasses = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap
        ${sizeClasses}
        ${
          variant === "solid"
            ? "text-white"
            : "border"
        }
        ${className}
      `}
      style={{
        backgroundColor: variant === "solid" ? (color || "#A2AAAD") : `${color || "#A2AAAD"}10`,
        borderColor: variant === "outline" ? (color || "#A2AAAD") : undefined,
        color: variant === "outline" ? (color || "#222222") : undefined,
      }}
    >
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 transition-opacity"
          type="button"
        >
          &times;
        </button>
      )}
    </span>
  );
}
