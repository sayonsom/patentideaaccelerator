"use server";

import { prisma } from "@/lib/prisma";
import type { ChatHistory, ChatMessage, ChatContextType } from "@/lib/types";

// ─── Mappers ────────────────────────────────────────────────────

function mapPrismaToChatHistory(row: {
  id: string;
  userId: string;
  contextType: string;
  contextId: string | null;
  title: string;
  messages: unknown;
  createdAt: Date;
  updatedAt: Date;
}): ChatHistory {
  return {
    id: row.id,
    userId: row.userId,
    contextType: row.contextType as ChatContextType,
    contextId: row.contextId,
    title: row.title,
    messages: (row.messages ?? []) as ChatMessage[],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ─── CRUD ───────────────────────────────────────────────────────

export async function listChatHistoriesAction(
  userId: string,
  contextType?: ChatContextType,
  contextId?: string
): Promise<ChatHistory[]> {
  const where: Record<string, unknown> = { userId };
  if (contextType) where.contextType = contextType;
  if (contextId) where.contextId = contextId;

  const rows = await prisma.chatHistory.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return rows.map(mapPrismaToChatHistory);
}

export async function getChatHistoryAction(id: string): Promise<ChatHistory | null> {
  const row = await prisma.chatHistory.findUnique({ where: { id } });
  return row ? mapPrismaToChatHistory(row) : null;
}

export async function createChatHistoryAction(
  userId: string,
  contextType: ChatContextType,
  contextId?: string | null,
  title?: string
): Promise<ChatHistory> {
  const row = await prisma.chatHistory.create({
    data: {
      userId,
      contextType,
      contextId: contextId ?? null,
      title: title || "",
      messages: [],
    },
  });
  return mapPrismaToChatHistory(row);
}

export async function appendMessageAction(
  historyId: string,
  message: ChatMessage
): Promise<ChatHistory> {
  // Fetch current messages, append, and update
  const existing = await prisma.chatHistory.findUnique({
    where: { id: historyId },
    select: { messages: true },
  });
  const currentMessages = (existing?.messages ?? []) as unknown as ChatMessage[];
  const updatedMessages = [...currentMessages, message];

  // Auto-title from first user message if title is empty
  let titleUpdate: string | undefined;
  if (message.role === "user" && currentMessages.length === 0) {
    titleUpdate = message.content.slice(0, 80).trim();
    if (message.content.length > 80) titleUpdate += "...";
  }

  const row = await prisma.chatHistory.update({
    where: { id: historyId },
    data: {
      messages: updatedMessages as unknown as import("@prisma/client").Prisma.InputJsonValue,
      ...(titleUpdate ? { title: titleUpdate } : {}),
    },
  });
  return mapPrismaToChatHistory(row);
}

export async function deleteChatHistoryAction(id: string): Promise<boolean> {
  try {
    await prisma.chatHistory.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function renameChatHistoryAction(
  id: string,
  title: string
): Promise<ChatHistory | null> {
  try {
    const row = await prisma.chatHistory.update({
      where: { id },
      data: { title },
    });
    return mapPrismaToChatHistory(row);
  } catch {
    return null;
  }
}
