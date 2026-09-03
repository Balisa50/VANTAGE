/**
 * Pull a JSON object out of a model response.
 *
 * The old approach stripped a leading and trailing code fence and parsed what
 * was left. That holds for a model that answers with nothing but JSON, and
 * breaks the moment one thinks out loud first. The primary NVIDIA model is a
 * reasoning model, so on-demand generation was failing with
 * `Unexpected token 'O', "Okay, the "... is not valid JSON` even after the
 * request itself succeeded.
 *
 * Order matters. Reasoning blocks are removed before fences, because the
 * thinking can itself contain a fenced example.
 */

/** Strip <think>, <thinking> and <reasoning> blocks, closed or not. */
function stripReasoning(text: string): string {
  return text
    .replace(/<(think|thinking|reasoning)>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(think|thinking|reasoning)>[\s\S]*$/i, "")
    .trim();
}

function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/, "")
    .trim();
}

/**
 * The first balanced {...} run, ignoring braces inside string literals and
 * respecting backslash escapes. Returns null when there is no complete object,
 * which is the honest answer for a truncated response.
 */
function firstBalancedObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Best-effort JSON object from a model response.
 *
 * Throws with a truncated sample of what actually arrived, so a failure says
 * what the model said rather than only which character offended the parser.
 */
export function extractJsonObject<T = Record<string, unknown>>(raw: string): T {
  const cleaned = stripFences(stripReasoning(raw));

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // fall through to the brace scan
  }

  const candidate = firstBalancedObject(cleaned);
  if (candidate) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // fall through to the error below
    }
  }

  throw new Error(
    `Model did not return parseable JSON. Response began: ${cleaned.slice(0, 400)}`
  );
}
