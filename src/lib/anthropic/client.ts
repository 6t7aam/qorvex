// Legacy helper module. Despite the "anthropic" path, this client talks to any
// OpenAI-compatible `/chat/completions` endpoint configured through
// `ANTHROPIC_BASE_URL` (Gemini OmniRoute, OpenAI, OpenRouter, etc.). The
// `@anthropic-ai/sdk` dependency is no longer used here.

export const MODEL: string =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIChatCompletion {
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

interface OpenAIStreamChunk {
  choices?: Array<{
    delta?: { content?: string | null };
    finish_reason?: string | null;
  }>;
}

function resolveBaseUrl(): string {
  const raw = (process.env.ANTHROPIC_BASE_URL ?? "").trim();
  if (!raw) return "https://api.anthropic.com/v1";
  return raw.replace(/\/$/, "");
}

function requireApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is not set. Please configure it to generate apps.",
    );
  }
  return apiKey;
}

async function callChatCompletions(
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<Response> {
  const apiKey = requireApiKey();
  const response = await fetch(`${resolveBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `AI provider request failed (${response.status} ${response.statusText}). ${text.slice(0, 500)}`.trim(),
    );
  }

  return response;
}

function buildMessages(prompt: string, systemPrompt: string): ChatMessage[] {
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];
}

export async function generateApp(
  prompt: string,
  systemPrompt: string,
): Promise<string> {
  const response = await callChatCompletions({
    model: MODEL,
    messages: buildMessages(prompt, systemPrompt),
    temperature: 0.3,
    max_tokens: 32000,
  });

  const payload = (await response.json().catch(() => null)) as
    | OpenAIChatCompletion
    | null;
  return payload?.choices?.[0]?.message?.content ?? "";
}

export async function generateText(options: {
  prompt: string;
  systemPrompt: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const response = await callChatCompletions({
    model: MODEL,
    messages: buildMessages(options.prompt, options.systemPrompt),
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 8000,
  });

  const payload = (await response.json().catch(() => null)) as
    | OpenAIChatCompletion
    | null;
  return payload?.choices?.[0]?.message?.content ?? "";
}

/**
 * Streams an OpenAI-compatible `/chat/completions` response and yields the
 * incremental `choices[0].delta.content` text chunks. The caller can consume
 * with `for await (const chunk of generateAppStream(...))`.
 */
export async function* generateAppStream(
  prompt: string,
  systemPrompt: string,
  options?: {
    signal?: AbortSignal;
    maxTokens?: number;
    temperature?: number;
  },
): AsyncIterable<string> {
  const response = await callChatCompletions(
    {
      model: MODEL,
      messages: buildMessages(prompt, systemPrompt),
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 32000,
      stream: true,
    },
    options?.signal,
  );

  if (!response.body) {
    throw new Error("AI provider returned no streaming body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffered = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffered += decoder.decode(value, { stream: true });

      let separatorIndex = buffered.indexOf("\n\n");
      while (separatorIndex !== -1) {
        const eventBlock = buffered.slice(0, separatorIndex).trim();
        buffered = buffered.slice(separatorIndex + 2);
        separatorIndex = buffered.indexOf("\n\n");

        for (const line of eventBlock.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data) as OpenAIStreamChunk;
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // Skip malformed SSE chunk.
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
