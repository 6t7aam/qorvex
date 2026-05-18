import { AnthropicProvider } from "@/lib/ai/providers/anthropic-provider";
import type { AIProvider } from "@/lib/ai/types";

let providerSingleton: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (providerSingleton) {
    return providerSingleton;
  }

  const provider = (process.env.AI_PROVIDER ?? "anthropic").toLowerCase();

  switch (provider) {
    case "anthropic":
      providerSingleton = new AnthropicProvider();
      return providerSingleton;
    case "gemini":
    case "openai":
    case "deepseek":
      throw new Error(
        `AI provider "${provider}" is not implemented yet. The provider abstraction is ready, but only Anthropic is currently wired.`,
      );
    default:
      throw new Error(`Unsupported AI provider "${provider}".`);
  }
}

export type { AIProvider, AITextGenerationOptions, AITextGenerationResult, AIUsage } from "@/lib/ai/types";
