"use client";

import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  badge?: string;
  status?: "complete" | "partial" | "empty";
  align?: "right";
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  children: React.ReactNode;
  className?: string;
}

// ─── Shared tab button renderer ─────────────────────────────────

function TabButton({
  tab,
  isActive,
  onClick,
}: {
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      key={tab.id}
      onClick={onClick}
      className={`
        px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors
        border-b-2 -mb-px
        ${
          isActive
            ? "text-blue-ribbon border-blue-ribbon"
            : "text-text-muted border-transparent hover:text-ink hover:border-neutral-light"
        }
      `}
      type="button"
    >
      {tab.label}
      {tab.status && tab.status !== "empty" && (
        <span
          className={`ml-1.5 w-1.5 h-1.5 rounded-full inline-block ${
            tab.status === "complete" ? "bg-blue-ribbon" : "bg-yellow-warning"
          }`}
        />
      )}
      {tab.badge && (
        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-off-white text-text-muted">
          {tab.badge}
        </span>
      )}
    </button>
  );
}

// ─── TabBar (standalone tab bar, no children) ───────────────────

interface TabBarProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function TabBar({ tabs, activeTab, onChange, className = "" }: TabBarProps) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id || "");
  const active = activeTab ?? internalActive;
  const handleChange = onChange ?? setInternalActive;

  const leftTabs = tabs.filter((t) => t.align !== "right");
  const rightTabs = tabs.filter((t) => t.align === "right");

  return (
    <div className={`flex border-b border-border overflow-x-auto ${className}`}>
      {leftTabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={active === tab.id}
          onClick={() => handleChange(tab.id)}
        />
      ))}
      {rightTabs.length > 0 && <div className="flex-1" />}
      {rightTabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={active === tab.id}
          onClick={() => handleChange(tab.id)}
        />
      ))}
    </div>
  );
}

// ─── Tabs (full component with children) ────────────────────────

export function Tabs({ tabs, activeTab, onChange, children, className = "" }: TabsProps) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id || "");
  const active = activeTab ?? internalActive;
  const handleChange = onChange ?? setInternalActive;

  return (
    <div className={className}>
      <TabBar tabs={tabs} activeTab={active} onChange={handleChange} />
      <div className="mt-4">{children}</div>
    </div>
  );
}

// ─── TabPanel ───────────────────────────────────────────────────

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
}

export function TabPanel({ id, activeTab, children }: TabPanelProps) {
  if (id !== activeTab) return null;
  return <div className="animate-fade-in">{children}</div>;
}
