import { NextRequest } from "next/server";
import { getAnthropicClient, buildChatSystemPrompt } from "../../lib/anthropic";

// Simple in-memory rate limiter: max 20 requests per IP per minute
const rateMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) return true;
  return false;
}

// Clean stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(ip);
  }
}, 300_000);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return new Response("Rate limit exceeded. Try again in a minute.", { status: 429 });
  }

  try {
    const { messages, articleBody } = await req.json();

    if (!messages || !articleBody) {
      return new Response("Missing messages or articleBody", { status: 400 });
    }

    if (messages.length > 16) {
      return new Response("Too many messages", { status: 400 });
    }

    const stream = await getAnthropicClient().messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: buildChatSystemPrompt(articleBody),
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
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
