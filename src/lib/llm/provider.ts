// ─── Provider selector ────────────────────────────────────────────────────────
// Reads LLM_PROVIDER and the relevant API key from environment variables.
// Returns DeterministicProvider when:
//   - LLM_PROVIDER is missing or "deterministic"
//   - The required API key for the configured provider is missing
// This file is only ever executed server-side (API routes).

import type { LLMProvider } from "./types"

export function getProvider(): LLMProvider {
  const { DeterministicProvider } = require("./deterministic")

  const providerName = process.env.LLM_PROVIDER ?? "deterministic"

  switch (providerName) {
    case "anthropic": {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        console.warn("Cognix: LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set. Falling back to deterministic.")
        return new DeterministicProvider()
      }
      const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5"
      const { AnthropicProvider } = require("./anthropic")
      return new AnthropicProvider(apiKey, model) as LLMProvider
    }

    case "deterministic":
    default: {
      if (providerName !== "deterministic") {
        console.warn(`Cognix: LLM_PROVIDER="${providerName}" is not yet implemented. Falling back to deterministic.`)
      }
      return new DeterministicProvider()
    }
  }
}
