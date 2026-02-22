interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className = "" }: SectionLabelProps) {
  return (
    <h4
      className={`text-[10px] font-medium uppercase tracking-[2px] text-neutral-light ${className}`}
    >
      {children}
    </h4>
  );
}
