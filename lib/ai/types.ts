export interface AnalysisResult {
  insights: string // Markdown formatted insights
  tokensUsed: number
  cost: number
  model: string
}

export interface LLMProvider {
  /**
   * Analyze CSV data and generate insights based on user prompt
   * @param csvData - Raw CSV data as string
   * @param userPrompt - User's analysis request
   * @param fileName - Name of the file being analyzed
   * @returns Analysis result with insights and metadata
   */
  analyze(csvData: string, userPrompt: string, fileName: string): Promise<AnalysisResult>

  /**
   * Get the name of this provider
   */
  getName(): string
}

export interface ProviderConfig {
  apiKey: string
  model?: string
}
