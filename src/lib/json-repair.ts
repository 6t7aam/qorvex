// Shared helpers for parsing model JSON that may arrive wrapped in code fences,
// padded with prose, or truncated when the model hits its output-token limit.

/**
 * Best-effort repair of a truncated JSON value. Closes any unbalanced strings,
 * arrays, and objects so a near-complete payload can still be parsed instead of
 * thrown away. Braces/quotes inside strings are ignored via a small scanner.
 */
export function repairTruncatedJson(input: string): string | null {
  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === "{" || char === "[") {
      stack.push(char);
    } else if (char === "}" || char === "]") {
      stack.pop();
    }
  }

  if (stack.length === 0 && !inString) return null;

  let result = input;
  if (inString) result += '"';
  // Drop a trailing partial separator left after closing the dangling string.
  result = result.replace(/,\s*$/, "");
  for (let i = stack.length - 1; i >= 0; i--) {
    result += stack[i] === "{" ? "}" : "]";
  }
  return result;
}

/**
 * Parse a JSON object from raw model text. Strips code fences, tries the raw
 * text and the largest `{...}` slice, and finally attempts a truncation repair.
 */
export function parseModelJson<T = unknown>(raw: string): T | null {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const candidates = [cleaned];
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    candidates.push(cleaned.slice(start, end + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {}
  }

  if (start !== -1) {
    const repaired = repairTruncatedJson(cleaned.slice(start));
    if (repaired) {
      try {
        return JSON.parse(repaired) as T;
      } catch {}
    }
  }

  return null;
}
