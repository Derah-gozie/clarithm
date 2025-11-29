import { LLMProvider } from './types'
import { ClaudeProvider } from './providers/claude'
import { DeepSeekProvider } from './providers/deepseek'
import { GroqProvider } from './providers/groq'

export type ProviderType = 'claude' | 'deepseek' | 'groq'

export class ProviderFactory {
  /**
   * Create an LLM provider based on environment configuration
   * Defaults to Groq (cheapest, fastest) if no provider specified
   */
  static createProvider(providerType?: ProviderType): LLMProvider {
    const type = providerType || (process.env.AI_PROVIDER as ProviderType) || 'groq'

    console.log(`🤖 Creating AI provider: ${type}`)

    switch (type) {
      case 'claude':
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error('ANTHROPIC_API_KEY environment variable is required for Claude provider')
        }
        return new ClaudeProvider({
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.CLAUDE_MODEL
        })

      case 'deepseek':
        if (!process.env.DEEPSEEK_API_KEY) {
          throw new Error('DEEPSEEK_API_KEY environment variable is required for DeepSeek provider')
        }
        return new DeepSeekProvider({
          apiKey: process.env.DEEPSEEK_API_KEY,
          model: process.env.DEEPSEEK_MODEL
        })

      case 'groq':
        if (!process.env.GROQ_API_KEY) {
          throw new Error('GROQ_API_KEY environment variable is required for Groq provider')
        }
        return new GroqProvider({
          apiKey: process.env.GROQ_API_KEY,
          model: process.env.GROQ_MODEL
        })

      default:
        throw new Error(`Unknown provider type: ${type}. Must be 'claude', 'deepseek', or 'groq'`)
    }
  }

  /**
   * Get all available providers (useful for showing options to users)
   */
  static getAvailableProviders(): ProviderType[] {
    const providers: ProviderType[] = []

    if (process.env.ANTHROPIC_API_KEY) providers.push('claude')
    if (process.env.DEEPSEEK_API_KEY) providers.push('deepseek')
    if (process.env.GROQ_API_KEY) providers.push('groq')

    return providers
  }

  /**
   * Get recommended provider based on data size
   */
  static getRecommendedProvider(dataSize: number): ProviderType {
    // For small datasets (<10KB), use fastest/cheapest
    if (dataSize < 10000) return 'groq'

    // For medium datasets (<100KB), use balanced
    if (dataSize < 100000) return 'deepseek'

    // For large datasets, use Claude (best context window)
    return 'claude'
  }
}
