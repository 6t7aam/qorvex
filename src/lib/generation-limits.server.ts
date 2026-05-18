import "server-only";

// Deprecated compatibility layer.
// Daily AI credit tracking is now handled through `daily_ai_usage` records
// instead of incrementing a per-generation counter on the user profile.
export async function incrementGenerationCount(): Promise<void> {
  return Promise.resolve();
}
