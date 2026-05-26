// ─── Anthropic provider ───────────────────────────────────────────────────────
// Calls the Anthropic Messages API. Only imported server-side (API route).
// Throws on network failure; the API route catches and falls back to
// DeterministicProvider.

import Anthropic from "@anthropic-ai/sdk"
import type { LLMProvider, LLMPrompt, LLMResult } from "./types"

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic"
  readonly model: string
  private client: Anthropic

  constructor(apiKey: string, model: string) {
    this.model = model
    this.client = new Anthropic({ apiKey })
  }

  async generate(prompt: LLMPrompt): Promise<LLMResult> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: prompt.max_tokens ?? 1024,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    })

    const block = message.content[0]
    if (block.type !== "text") {
      throw new Error(`Anthropic returned unexpected content type: ${block.type}`)
    }

    return {
      text: block.text,
      model: this.model,
      provider: this.name,
    }
  }
}
