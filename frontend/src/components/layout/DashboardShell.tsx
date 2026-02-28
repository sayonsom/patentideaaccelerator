"use client";

import { useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ChatPanel, ChatToggleButton } from "@/components/chat/ChatPanel";
import { useSettingsStore, useUIStore } from "@/lib/store";
import type { ChatContext } from "@/lib/types";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const initSettings = useSettingsStore((s) => s.init);
  const initPromptPrefs = useSettingsStore((s) => s.initPromptPrefs);
  const documentMode = useUIStore((s) => s.documentMode);
  const hideTopBar = useUIStore((s) => s.hideTopBar);

  useEffect(() => {
    initSettings(session?.user?.id);
  }, [initSettings, session?.user?.id]);

  useEffect(() => {
    initPromptPrefs();
  }, [initPromptPrefs]);

  const chatContext: ChatContext = useMemo(
    () => ({
      type: "general",
      id: null,
      label: "IP Ramp Assistant",
      data: {},
    }),
    []
  );

  const showSidebar = !documentMode;
  const showTopBar = !documentMode && !hideTopBar;

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-off-white">
      {showSidebar && <Sidebar />}
      <div className="flex flex-col flex-1 min-w-0">
        {showTopBar && <TopBar />}
        <main className={`flex-1 ${documentMode ? "overflow-hidden p-0" : "overflow-y-auto p-6"}`}>
          {children}
        </main>
      </div>
      <ChatToggleButton context={chatContext} />
      <ChatPanel context={chatContext} />
    </div>
  );
}
