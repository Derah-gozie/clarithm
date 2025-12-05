import { LLMProvider, AnalysisResult, ProviderConfig } from '../types'

export class GroqProvider implements LLMProvider {
  private apiKey: string
  private model: string

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'llama-3.3-70b-versatile'
  }

  getName(): string {
    return 'groq'
  }

  async analyze(csvData: string, userPrompt: string, fileName: string, templateType: string = 'text-summary'): Promise<AnalysisResult> {
    // Different prompts based on template type
    let systemPrompt = ''
    let userMessage = ''

    if (templateType === 'bar-chart') {
      systemPrompt = `You are a data analysis expert. Analyze the CSV data and generate a bar chart visualization.

IMPORTANT: You MUST respond with ONLY valid JSON in this exact format (no markdown, no code blocks, no extra text):

{
  "chartType": "bar",
  "title": "Clear, descriptive chart title",
  "xAxisLabel": "X-axis label",
  "yAxisLabel": "Y-axis label",
  "data": [
    {"name": "Category1", "value": 100},
    {"name": "Category2", "value": 200}
  ],
  "insights": "Brief text insights about the data (2-3 sentences)"
}

Rules:
- data array should have 3-15 items maximum
- If data has more rows, aggregate or show top values
- values must be numbers
- insights should be concise markdown text`

      userMessage = `File: ${fileName}

User's Request: ${userPrompt || 'Create a bar chart showing the key metrics from this data'}

CSV Data:
\`\`\`csv
${csvData}
\`\`\`

Analyze this data and return ONLY the JSON object for the bar chart. No other text.`
    } else {
      // Default text summary
      systemPrompt = `You are a data analysis expert. Analyze the provided CSV data and generate comprehensive insights in markdown format.

Your analysis should prioritize the user's specific request, then include:
1. **Summary** - High-level overview focused on user's question
2. **Key Findings** - 3-5 most important discoveries related to the request
3. **Trends & Patterns** - Notable trends, correlations, or patterns
4. **Statistical Insights** - Relevant statistics (averages, totals, distributions)
5. **Recommendations** - Actionable recommendations based on findings

Format your response in clean, well-structured markdown. Use headers, bullet points, and bold text for emphasis.
Be specific and reference actual data values when possible.`

      userMessage = `File: ${fileName}

User's Request: ${userPrompt || 'Provide a comprehensive analysis of this dataset'}

CSV Data:
\`\`\`csv
${csvData}
\`\`\`

Please analyze this data and provide insights focused on the user's request.`
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
        throw new Error(`Groq API error: ${response.status} - ${error}`)
      }

      const data = await response.json()

      // Extract insights from response
      const insights = data.choices[0].message.content

      // Calculate cost (Groq pricing for LLaMA 3.1 70B)
      const inputTokens = data.usage.prompt_tokens
      const outputTokens = data.usage.completion_tokens
      const cost = (inputTokens * 0.59 / 1_000_000) + (outputTokens * 0.79 / 1_000_000)

      return {
        insights,
        tokensUsed: inputTokens + outputTokens,
        cost,
        model: this.model
      }
    } catch (error) {
      console.error('Groq provider error:', error)
      throw error
    }
  }
}
