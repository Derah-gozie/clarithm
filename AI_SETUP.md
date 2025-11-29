# AI Insights Setup Guide

Clarithm uses AI to generate insights from your CSV/Excel data. You can choose from multiple AI providers based on your needs.

## Quick Start (Recommended: Groq)

**Groq is recommended for most users** - it's fast, cheap, and has a generous free tier.

1. **Get a Groq API Key** (Free tier available)
   - Visit: https://console.groq.com/
   - Sign up and create an API key
   - Copy your API key

2. **Add to `.env.local`**
   ```
   AI_PROVIDER=groq
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Done!** You can now generate insights.

## Provider Comparison

| Provider | Cost/Analysis | Quality | Speed | Free Tier |
|----------|--------------|---------|-------|-----------|
| **Groq** (Recommended) | $0.006 | ⭐⭐⭐⭐ | Very Fast | 14,400 req/day |
| **DeepSeek** | $0.006 | ⭐⭐⭐⭐ | Fast | Limited |
| **Claude 3.5** | $0.03 | ⭐⭐⭐⭐⭐ | Fast | None |

## Provider Setup Instructions

### Option 1: Groq (Default - Recommended)

**Benefits:**
- FREE tier: 14,400 requests/day
- Very fast inference (300+ tokens/sec)
- LLaMA 3.1 70B model - excellent quality
- Best value for most users

**Setup:**
```bash
# 1. Get API key from https://console.groq.com/
# 2. Add to .env.local:
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
```

### Option 2: DeepSeek

**Benefits:**
- 20x cheaper than Claude
- Good for code and data analysis
- DeepSeek V3 model

**Setup:**
```bash
# 1. Get API key from https://platform.deepseek.com/
# 2. Add to .env.local:
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-...
```

### Option 3: Claude (Anthropic)

**Benefits:**
- Highest quality insights
- Best for complex analysis
- Large context window (200K tokens)

**Setup:**
```bash
# 1. Get API key from https://console.anthropic.com/
# 2. Add to .env.local:
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
```

## How It Works

1. **Upload CSV/Excel** with optional prompt
2. **Click "Generate Insights"** button
3. **AI analyzes** your data (30-60 seconds)
4. **View insights** - markdown formatted with:
   - Summary
   - Key findings
   - Trends & patterns
   - Statistical insights
   - Recommendations

## Architecture

The multi-model system allows easy switching between providers:

```
Upload → Parse CSV → [Provider Factory] → [Claude/DeepSeek/Groq] → Insights
```

**Provider abstraction layer** (`lib/ai/`):
- `types.ts` - Common interface
- `providers/claude.ts` - Claude implementation
- `providers/deepseek.ts` - DeepSeek implementation
- `providers/groq.ts` - Groq implementation
- `provider-factory.ts` - Creates provider based on env

**Switch providers** by changing `AI_PROVIDER` env variable - no code changes needed!

## Cost Estimates

**Groq (Free Tier):**
- First 14,400 analyses/day: **FREE**
- After that: ~$0.006/analysis

**Typical usage:**
- 10 analyses/day = **FREE** with Groq
- 100 analyses/day = **FREE** with Groq
- 1,000 analyses/day = ~$42/month with Groq (if over free tier)

**For enterprise:** Can easily add more providers or self-hosted models.

## Troubleshooting

**"Provider not configured"**
- Make sure you've added the API key to `.env.local`
- Restart the dev server after adding env variables

**"Insights generation failed"**
- Check API key is valid
- Check you have credits/quota remaining
- View error message in dataset card

**Want to use multiple providers?**
- Add multiple API keys to `.env.local`
- Switch between them by changing `AI_PROVIDER`
- Future: Add UI toggle to let users choose per-analysis
