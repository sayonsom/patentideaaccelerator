"use client";

import { useMemo } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ChatPanel, ChatToggleButton } from "@/components/chat/ChatPanel";
import type { ChatContext } from "@/lib/types";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const chatContext: ChatContext = useMemo(
    () => ({
      type: "general",
      id: null,
      label: "VoltEdge Assistant",
      data: {},
    }),
    []
  );

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-off-white">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <ChatToggleButton context={chatContext} />
      <ChatPanel context={chatContext} />
    </div>
  );
}
