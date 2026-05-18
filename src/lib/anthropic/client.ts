import Anthropic from "@anthropic-ai/sdk";

export const MODEL: string =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

function createAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is not set. Please configure it to generate apps.",
    );
  }

  return new Anthropic({
    apiKey,
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
  });
}

export async function generateAppStream(prompt: string, systemPrompt: string) {
  const anthropic = createAnthropicClient();

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  return stream;
}

export async function generateApp(
  prompt: string,
  systemPrompt: string,
): Promise<string> {
  const anthropic = createAnthropicClient();

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 32000,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");

  return text;
}

export async function generateText(options: {
  prompt: string;
  systemPrompt: string;
  maxTokens?: number;
  temperature?: number;
}) {
  const anthropic = createAnthropicClient();

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: options.maxTokens ?? 8000,
    temperature: options.temperature ?? 0.2,
    system: options.systemPrompt,
    messages: [{ role: "user", content: options.prompt }],
  });

  return response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");
}
