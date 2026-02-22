"use client";

interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  borderColor?: string;
  className?: string;
  onClick?: () => void;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  children,
  hover = false,
  borderColor,
  className = "",
  onClick,
  padding = "md",
}: CardProps) {
  return (
    <div
      className={`
        bg-white border border-border rounded-lg
        ${paddingClasses[padding]}
        ${hover ? "hover:border-border-hover hover:shadow-sm transition-all duration-150 cursor-pointer" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      style={borderColor ? { borderLeftColor: borderColor, borderLeftWidth: "3px" } : undefined}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
