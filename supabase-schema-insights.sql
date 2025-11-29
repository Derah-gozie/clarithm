-- Add insights columns to datasets table
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS insights_status TEXT DEFAULT 'pending' CHECK (insights_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS insights_markdown TEXT,
ADD COLUMN IF NOT EXISTS insights_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS insights_model TEXT,
ADD COLUMN IF NOT EXISTS insights_tokens_used INTEGER,
ADD COLUMN IF NOT EXISTS insights_cost DECIMAL(10, 6),
ADD COLUMN IF NOT EXISTS insights_error TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_datasets_insights_status ON datasets(insights_status);

-- Add comment
COMMENT ON COLUMN datasets.insights_status IS 'Status of AI insights generation: pending, processing, completed, failed';
COMMENT ON COLUMN datasets.insights_markdown IS 'Generated insights in markdown format';
COMMENT ON COLUMN datasets.insights_model IS 'Which AI model was used (e.g., claude-3.5-sonnet, deepseek-chat, groq-llama-3.1-70b)';
COMMENT ON COLUMN datasets.insights_tokens_used IS 'Total tokens consumed for generation';
COMMENT ON COLUMN datasets.insights_cost IS 'Cost in USD for this analysis';
