-- Add template field to datasets table
-- This allows users to choose visualization templates for their data

ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS template_type TEXT DEFAULT 'text-summary';

-- Add comment for documentation
COMMENT ON COLUMN datasets.template_type IS 'Visualization template: text-summary, bar-chart, line-chart, pie-chart, etc.';
