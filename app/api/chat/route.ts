import { NextRequest } from "next/server";
import { getAnthropicClient, buildChatSystemPrompt } from "../../lib/anthropic";

// Rate limit: 5 requests per IP per minute (serverless-safe)
const rateMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

// Global daily budget: max 200 chat calls per day across ALL users
let dailyCount = 0;
let dailyReset = Date.now() + 86_400_000;
const DAILY_MAX = 200;

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Daily global limit
  if (now > dailyReset) { dailyCount = 0; dailyReset = now + 86_400_000; }
  if (dailyCount >= DAILY_MAX) return true;

  // Per-IP limit
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    dailyCount++;
    return false;
  }
  entry.count++;
  if (entry.count > MAX_REQUESTS) return true;
  dailyCount++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return new Response("Slow down. Try again in a minute.", { status: 429 });
  }

  try {
    const { messages, articleBody } = await req.json();

    if (!messages || !articleBody) {
      return new Response("Missing messages or articleBody", { status: 400 });
    }

    // Hard cap on conversation length
    if (messages.length > 8) {
      return new Response("Conversation limit reached", { status: 400 });
    }

    // Cap article body sent to Claude to reduce token cost
    const trimmedBody = articleBody.slice(0, 3000);

    const stream = await getAnthropicClient().messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: buildChatSystemPrompt(trimmedBody),
      messages: messages.slice(-6).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content.slice(0, 500),
      })),
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    return new Response(
      err instanceof Error ? err.message : "Chat failed",
      { status: 500 }
    );
  }
}
