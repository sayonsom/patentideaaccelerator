import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIStreamingResponse, resolveAIConfig, resolvePromptPreferences } from "@/lib/ai-client";
import { buildSystemPrompt } from "@/lib/prompt-preferences";
import { buildChatSystemPrompt } from "@/lib/chat-prompts";
import { appendMessageAction, createChatHistoryAction } from "@/lib/actions/chat";
import type { ChatContext, ChatMessage, ChatContextType } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let config;
  try {
    config = resolveAIConfig(req);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "API key not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const {
    message,
    context,
    historyId,
    previousMessages,
  }: {
    message: string;
    context: ChatContext;
    historyId?: string;
    previousMessages?: ChatMessage[];
  } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // Build system prompt from chat context + user preferences
  const preferences = await resolvePromptPreferences(session.user.id);
  const chatSystemPrompt = buildChatSystemPrompt(context);
  const systemPrompt = buildSystemPrompt(chatSystemPrompt, preferences);

  // Build message history for the AI
  const aiMessages = [
    ...(previousMessages ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  // Persist user message
  let currentHistoryId = historyId;
  const userMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: message,
    timestamp: new Date().toISOString(),
  };

  try {
    if (!currentHistoryId) {
      // Create a new chat history
      const history = await createChatHistoryAction(
        session.user.id,
        context.type as ChatContextType,
        context.id,
        ""
      );
      currentHistoryId = history.id;
    }
    await appendMessageAction(currentHistoryId, userMsg);
  } catch {
    // Non-fatal — chat still works even if persistence fails
  }

  try {
    const stream = await generateAIStreamingResponse(config, systemPrompt, aiMessages, 4096);

    // Wrap the stream to collect the full response and persist it
    const encoder = new TextEncoder();
    let fullText = "";

    const wrappedStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // Send the historyId as the first event so the client can track it
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ historyId: currentHistoryId })}\n\n`)
        );

        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Parse the chunk to collect full text
            const text = new TextDecoder().decode(value);
            const lines = text.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ") && line !== "data: [DONE]") {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  if (parsed.text) fullText += parsed.text;
                } catch {
                  // skip unparseable chunks
                }
              }
            }

            controller.enqueue(value);
          }

          // Persist assistant message
          if (currentHistoryId && fullText) {
            const assistantMsg: ChatMessage = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: fullText,
              timestamp: new Date().toISOString(),
            };
            try {
              await appendMessageAction(currentHistoryId, assistantMsg);
            } catch {
              // Non-fatal
            }
          }

          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Stream error" })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(wrappedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Chat-History-Id": currentHistoryId || "",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
