// ─── LLM provider abstraction ─────────────────────────────────────────────────
// All providers implement LLMProvider. The deterministic provider never calls
// a remote API; real providers do. Callers never import a concrete provider
// directly — they go through provider.ts.

export interface LLMPrompt {
  system: string
  user: string
  max_tokens?: number
}

export interface LLMResult {
  text: string
  model: string
  provider: string
}

export interface LLMProvider {
  readonly name: string
  readonly model: string
  generate(prompt: LLMPrompt): Promise<LLMResult>
}

// Supported provider identifiers (matches LLM_PROVIDER env var values)
export type ProviderName = "deterministic" | "anthropic" | "openai" | "openrouter" | "ollama"
