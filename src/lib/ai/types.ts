export interface AIUsage {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  creditsUsed: number;
}

export interface AITextGenerationOptions {
  systemPrompt: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AITextGenerationResult {
  text: string;
  usage: AIUsage;
}

export interface AICostEstimateInput {
  prompt: string;
  maxTokens: number;
}

export interface AIProvider {
  readonly providerId: string;
  readonly model: string;
  generateText(options: AITextGenerationOptions): Promise<AITextGenerationResult>;
  estimateUsage(input: AICostEstimateInput): AIUsage;
}
