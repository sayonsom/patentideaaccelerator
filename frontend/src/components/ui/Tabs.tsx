"use client";

import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  badge?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, children, className = "" }: TabsProps) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id || "");
  const active = activeTab ?? internalActive;
  const handleChange = onChange ?? setInternalActive;

  return (
    <div className={className}>
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            className={`
              px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors
              border-b-2 -mb-px
              ${
                active === tab.id
                  ? "text-blue-ribbon border-blue-ribbon"
                  : "text-text-muted border-transparent hover:text-ink hover:border-neutral-light"
              }
            `}
            type="button"
          >
            {tab.label}
            {tab.badge && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-off-white text-text-muted">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
}

export function TabPanel({ id, activeTab, children }: TabPanelProps) {
  if (id !== activeTab) return null;
  return <div className="animate-fade-in">{children}</div>;
}
