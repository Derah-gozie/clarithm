import { LLMProvider, AnalysisResult, ProviderConfig } from '../types'

export class ClaudeProvider implements LLMProvider {
  private apiKey: string
  private model: string

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'claude-3-5-sonnet-20241022'
  }

  getName(): string {
    return 'claude'
  }

  async analyze(csvData: string, userPrompt: string, fileName: string, templateType: string = 'text-summary'): Promise<AnalysisResult> {
    const systemPrompt = `You are a data analysis expert. Analyze the provided CSV data and generate comprehensive insights in markdown format.

Your analysis should include:
1. **Summary** - High-level overview of the data
2. **Key Findings** - 3-5 most important discoveries (bullet points)
3. **Trends & Patterns** - Any notable trends, correlations, or patterns
4. **Statistical Insights** - Relevant statistics (averages, totals, distributions)
5. **Recommendations** - Actionable recommendations based on the data

Format your response in clean, well-structured markdown. Use headers, bullet points, and bold text for emphasis.
Be specific and reference actual data values when possible.`

    const userMessage = `File: ${fileName}

User's Request: ${userPrompt}

CSV Data:
\`\`\`csv
${csvData}
\`\`\`

Please analyze this data and provide insights based on my request.`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\n${userMessage}`
            }
          ]
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Claude API error: ${response.status} - ${error}`)
      }

      const data = await response.json()

      // Extract insights from response
      const insights = data.content[0].text

      // Calculate cost
      const inputTokens = data.usage.input_tokens
      const outputTokens = data.usage.output_tokens
      const cost = (inputTokens * 3.0 / 1_000_000) + (outputTokens * 15.0 / 1_000_000)

      return {
        insights,
        tokensUsed: inputTokens + outputTokens,
        cost,
        model: this.model
      }
    } catch (error) {
      console.error('Claude provider error:', error)
      throw error
    }
  }
}
