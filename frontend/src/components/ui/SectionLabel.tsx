interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className = "" }: SectionLabelProps) {
  return (
    <h4
      className={`text-xs font-semibold uppercase tracking-wider text-text-muted ${className}`}
    >
      {children}
    </h4>
  );
}
