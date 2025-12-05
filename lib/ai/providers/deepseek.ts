import { LLMProvider, AnalysisResult, ProviderConfig } from '../types'

export class DeepSeekProvider implements LLMProvider {
  private apiKey: string
  private model: string

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'deepseek-chat'
  }

  getName(): string {
    return 'deepseek'
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
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          max_tokens: 4096,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`DeepSeek API error: ${response.status} - ${error}`)
      }

      const data = await response.json()

      // Extract insights from response
      const insights = data.choices[0].message.content

      // Calculate cost (DeepSeek V3 pricing)
      const inputTokens = data.usage.prompt_tokens
      const outputTokens = data.usage.completion_tokens
      const cost = (inputTokens * 0.27 / 1_000_000) + (outputTokens * 1.10 / 1_000_000)

      return {
        insights,
        tokensUsed: inputTokens + outputTokens,
        cost,
        model: this.model
      }
    } catch (error) {
      console.error('DeepSeek provider error:', error)
      throw error
    }
  }
}
