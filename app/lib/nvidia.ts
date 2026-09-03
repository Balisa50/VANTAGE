// NVIDIA NIM client (OpenAI-compatible). Vantage moved off the paid Anthropic
// API onto NVIDIA's free endpoint. Leads with NVIDIA_MODEL and falls back down
// a chain of free models (retrying transient errors) so a flaky response or a
// model deprecation degrades gracefully instead of failing the request.
// Set NVIDIA_API_KEY in the environment; NVIDIA_MODEL is optional.

const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";

// Generation is slow, so this is generous, but unbounded is not an option: the
// article cron walks a chain of models and a single stalled provider would hold
// the function open until the platform killed it, taking every later region
// with it. The stream ceiling is tighter because it covers only the initial
// connection; once bytes are flowing the body is free to take as long as it
// needs.
const CHAT_TIMEOUT_MS = 60_000;
const STREAM_CONNECT_TIMEOUT_MS = 20_000;

// The default was mistralai/mistral-medium-3.5-128b, which reached end of life
// on 2026-08-07 and now answers 410 to every request. That is one of the two
// reasons the feed went empty: the primary model in the chain had been dead for
// weeks. A 410 is not transient, so the chain did drop to the next model, but
// with no key set (the other reason) nothing downstream could succeed either.
//
// The replacements are the ids the HireIQ backend selected by probing this same
// endpoint on 2026-08-17, rather than by reading the model catalogue. Listing is
// not availability here: ids appear in GET /v1/models that hang or answer 404.
export const NVIDIA_MODEL =
  process.env.NVIDIA_MODEL || "nvidia/nemotron-3-super-120b-a12b";

// Model chain, tried in order. Primary is env-overridable; the rest are free
// NVIDIA fallbacks. A model deprecation becomes a 1-line env fix, not an outage.
// Two families rather than two sizes of one, so a family-wide retirement does
// not take the whole chain with it.
const NVIDIA_MODELS: string[] = [
  NVIDIA_MODEL,
  "nvidia/llama-3.3-nemotron-super-49b-v1.5",
  "deepseek-ai/deepseek-v4-flash",
].filter((m, i, a) => m && a.indexOf(m) === i);

export type ChatMessage = { role: string; content: string };

interface CallOpts {
  system?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  /**
   * Per-request timeout. Defaults to CHAT_TIMEOUT_MS.
   */
  timeoutMs?: number;
  /**
   * Total budget across the whole model chain, measured from entry.
   *
   * The per-request timeout bounds one call; it does not bound six. Three
   * models times two attempts at 60s each is six minutes in the worst case,
   * which is longer than any serverless platform will wait. A caller that has
   * its own deadline passes it here and gets an error it can render instead of
   * a gateway timeout it cannot.
   */
  deadlineMs?: number;
}

function apiKey(): string {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) throw new Error("NVIDIA_API_KEY is not set");
  return key;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A failure worth retrying the same model for (transient, not a bad request). */
function isTransient(status: number): boolean {
  return status === 429 || status >= 500;
}

function body(model: string, opts: CallOpts, stream: boolean): string {
  const messages = opts.system
    ? [{ role: "system", content: opts.system }, ...opts.messages]
    : opts.messages;
  return JSON.stringify({
    model,
    messages,
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.7,
    stream,
  });
}

/**
 * One-shot completion with model fallback + per-model retry. Walks NVIDIA_MODELS,
 * retrying a transient failure on the same model once before dropping to the
 * next. Only throws once every model is exhausted.
 */
export async function nvidiaChat(opts: CallOpts): Promise<string> {
  // Fail fast on a missing key. apiKey() is called inside the fetch try-block,
  // so without this the throw is caught as a network error, mislabelled, and
  // retried against every model in the chain: six pointless attempts ending in
  // a message that blames the network for a configuration problem.
  apiKey();

  const startedAt = Date.now();
  const perCall = opts.timeoutMs ?? CHAT_TIMEOUT_MS;
  const budgetLeft = () =>
    opts.deadlineMs === undefined
      ? perCall
      : Math.min(perCall, opts.deadlineMs - (Date.now() - startedAt));

  let lastErr = "";
  for (const model of NVIDIA_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      // Stop before starting a call the deadline cannot accommodate, rather
      // than starting one the platform will kill mid-flight.
      const remaining = budgetLeft();
      if (remaining <= 0) {
        throw new Error(
          `NVIDIA API deadline of ${opts.deadlineMs}ms exhausted. Last error: ${lastErr || "none"}`
        );
      }
      let res: Response;
      try {
        res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey()}`,
          },
          body: body(model, opts, false),
          signal: AbortSignal.timeout(remaining),
        });
      } catch (e) {
        const timedOut = e instanceof Error && e.name === "TimeoutError";
        lastErr = timedOut
          ? `timeout after ${remaining}ms (${model})`
          : `network: ${e instanceof Error ? e.message : String(e)}`;
        if (attempt === 0) { await sleep(400); continue; }
        break;
      }
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content ?? "";
        if (text) return text;
        lastErr = `empty response from ${model}`;
        break; // empty → next model
      }
      lastErr = `NVIDIA API ${res.status} (${model}): ${(await res.text().catch(() => "")).slice(0, 200)}`;
      if (isTransient(res.status) && attempt === 0) { await sleep(500); continue; }
      break; // non-transient or retried → next model
    }
  }
  throw new Error(`NVIDIA API error after all models: ${lastErr}`);
}

/**
 * Streaming completion. Yields text chunks as they arrive (OpenAI SSE). Falls
 * back down the model chain only on the INITIAL connection (before any bytes) —
 * once a stream is flowing we can't switch models mid-response.
 */
export async function* nvidiaStream(opts: CallOpts): AsyncGenerator<string> {
  apiKey(); // fail fast on a missing key, as in nvidiaChat above

  let res: Response | null = null;
  let lastErr = "";
  for (const model of NVIDIA_MODELS) {
    let attempt = 0;
    for (; attempt < 2; attempt++) {
      let r: Response;
      try {
        r = await fetch(`${NVIDIA_BASE}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey()}`,
          },
          body: body(model, opts, true),
          signal: AbortSignal.timeout(STREAM_CONNECT_TIMEOUT_MS),
        });
      } catch (e) {
        lastErr = `network: ${e instanceof Error ? e.message : String(e)}`;
        if (attempt === 0) { await sleep(400); continue; }
        break;
      }
      if (r.ok && r.body) { res = r; break; }
      lastErr = `NVIDIA API ${r.status}`;
      if (isTransient(r.status) && attempt === 0) { await sleep(500); continue; }
      break;
    }
    if (res) break;
  }
  if (!res || !res.body) throw new Error(`NVIDIA API error (stream): ${lastErr}`);

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
