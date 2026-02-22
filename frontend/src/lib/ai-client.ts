import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, PromptPreferences } from "./types";
import { prisma } from "./prisma";

interface AIClientConfig {
  provider: AIProvider;
  apiKey: string;
}

interface AIResponse {
  text: string;
}

export async function generateAIResponse(
  config: AIClientConfig,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096
): Promise<AIResponse> {
  switch (config.provider) {
    case "anthropic": {
      const client = new Anthropic({ apiKey: config.apiKey });
      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const text = message.content[0].type === "text" ? message.content[0].text : "";
      return { text };
    }
    case "openai": {
      const client = new OpenAI({ apiKey: config.apiKey });
      const completion = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      const text = completion.choices[0]?.message?.content ?? "";
      return { text };
    }
    case "google": {
      const genAI = new GoogleGenerativeAI(config.apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent({
        systemInstruction: systemPrompt,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      });
      const text = result.response.text();
      return { text };
    }
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

export function resolveAIConfig(req: Request): AIClientConfig {
  const provider = (req.headers.get("x-ai-provider") as AIProvider) ?? "anthropic";
  let apiKey: string | undefined;

  switch (provider) {
    case "anthropic":
      apiKey = req.headers.get("x-api-key") || process.env.ANTHROPIC_API_KEY || undefined;
      break;
    case "openai":
      apiKey = req.headers.get("x-api-key") || process.env.OPENAI_API_KEY || undefined;
      break;
    case "google":
      apiKey = req.headers.get("x-api-key") || process.env.GOOGLE_AI_API_KEY || undefined;
      break;
  }

  if (!apiKey) {
    throw new Error(`API key not configured for provider: ${provider}`);
  }

  return { provider, apiKey };
}

// ─── Prompt Preferences Resolver (server-side, cached) ───────────

const prefsCache = new Map<string, { data: PromptPreferences | null; expiresAt: number }>();
const PREFS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function resolvePromptPreferences(
  userId: string
): Promise<PromptPreferences | null> {
  const cached = prefsCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { promptPreferences: true },
  });

  const prefs = (user?.promptPreferences as PromptPreferences | null) ?? null;
  prefsCache.set(userId, { data: prefs, expiresAt: Date.now() + PREFS_CACHE_TTL_MS });
  return prefs;
}

export function invalidatePreferencesCache(userId: string): void {
  prefsCache.delete(userId);
}

// ─── Streaming AI Response (for Chat) ────────────────────────────

export interface StreamingMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Generate a streaming AI response. Returns a ReadableStream of SSE-encoded chunks.
 * Each chunk is a `data: <text>\n\n` event. The stream ends with `data: [DONE]\n\n`.
 */
export async function generateAIStreamingResponse(
  config: AIClientConfig,
  systemPrompt: string,
  messages: StreamingMessage[],
  maxTokens: number = 4096
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  switch (config.provider) {
    case "anthropic": {
      const client = new Anthropic({ apiKey: config.apiKey });
      const stream = client.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      return new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
              ) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
                );
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (err) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Stream error" })}\n\n`)
            );
            controller.close();
          }
        },
      });
    }

    case "openai": {
      const client = new OpenAI({ apiKey: config.apiKey });
      const stream = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: maxTokens,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        ],
      });

      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content;
              if (text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (err) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Stream error" })}\n\n`)
            );
            controller.close();
          }
        },
      });
    }

    case "google": {
      const genAI = new GoogleGenerativeAI(config.apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Build message history for Gemini
      const contents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const result = await model.generateContentStream({
        systemInstruction: systemPrompt,
        contents,
      });

      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (err) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Stream error" })}\n\n`)
            );
            controller.close();
          }
        },
      });
    }

    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

export function parseJSONFromResponse(text: string): unknown {
  // Try to extract JSON from markdown code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1].trim());
  }
  // Fall back to finding raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse JSON from AI response");
  return JSON.parse(jsonMatch[0]);
}
