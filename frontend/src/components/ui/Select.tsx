"use client";

import { forwardRef } from "react";

interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  options: SelectOption[];
  error?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, onChange, placeholder, className = "", value, ...props }, ref) => {
    const groups = options.reduce((acc, opt) => {
      const group = opt.group || "__default__";
      if (!acc[group]) acc[group] = [];
      acc[group].push(opt);
      return acc;
    }, {} as Record<string, SelectOption[]>);

    const hasGroups = Object.keys(groups).some((g) => g !== "__default__");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            {label}
          </label>
        )}
        <select
          ref={ref}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={`
            w-full px-3 py-2 text-sm text-ink
            bg-white border border-border rounded-md
            focus:border-blue-ribbon focus:ring-1 focus:ring-blue-ribbon focus:outline-none
            transition-colors appearance-none
            bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23A2AAAD%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')]
            bg-no-repeat bg-[center_right_0.75rem] pr-8
            ${error ? "border-danger" : ""}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {hasGroups
            ? Object.entries(groups).map(([group, opts]) =>
                group === "__default__" ? (
                  opts.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))
                ) : (
                  <optgroup key={group} label={group}>
                    {opts.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                )
              )
            : options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
        </select>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);

Select.displayName = "Select";
