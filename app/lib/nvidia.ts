// NVIDIA NIM client (OpenAI-compatible). Vantage moved off the paid Anthropic
// API onto NVIDIA's free endpoint; one key, one model, same behaviour.
// Set NVIDIA_API_KEY in the environment; NVIDIA_MODEL is optional.

const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";
export const NVIDIA_MODEL =
  process.env.NVIDIA_MODEL || "mistralai/mistral-medium-3.5-128b";

export type ChatMessage = { role: string; content: string };

interface CallOpts {
  system?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

function apiKey(): string {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) throw new Error("NVIDIA_API_KEY is not set");
  return key;
}

function body(opts: CallOpts, stream: boolean): string {
  const messages = opts.system
    ? [{ role: "system", content: opts.system }, ...opts.messages]
    : opts.messages;
  return JSON.stringify({
    model: NVIDIA_MODEL,
    messages,
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.7,
    stream,
  });
}

/** One-shot completion. Returns the assistant text (empty string on no content). */
export async function nvidiaChat(opts: CallOpts): Promise<string> {
  const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: body(opts, false),
  });
  if (!res.ok) {
    throw new Error(`NVIDIA API error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/** Streaming completion. Yields text chunks as they arrive (OpenAI SSE). */
export async function* nvidiaStream(opts: CallOpts): AsyncGenerator<string> {
  const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: body(opts, true),
  });
  if (!res.ok || !res.body) {
    throw new Error(`NVIDIA API error: ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        const text = json.choices?.[0]?.delta?.content;
        if (text) yield text as string;
      } catch {
        /* ignore keep-alive / partial frames */
      }
    }
  }
}
