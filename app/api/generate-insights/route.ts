import { createClient } from '@/lib/supabase/server'
import { ProviderFactory } from '@/lib/ai/provider-factory'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let datasetId: string | undefined

  try {
    const body = await request.json()
    datasetId = body.datasetId
    const providerType = body.providerType

    if (!datasetId) {
      return NextResponse.json(
        { error: 'Dataset ID is required' },
        { status: 400 }
      )
    }

    console.log(`🚀 Starting insights generation for dataset: ${datasetId}`)

    const supabase = await createClient()

    // Get user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('🔐 Auth check result:', {
      hasUser: !!user,
      userEmail: user?.email,
      error: authError?.message
    })

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message || 'No user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.email)

    // Get dataset from database
    const { data: dataset, error: dbError } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', datasetId)
      .eq('user_id', user.id)
      .single()

    if (dbError || !dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      )
    }

    // Check if already processing or completed
    if (dataset.insights_status === 'processing') {
      return NextResponse.json(
        { error: 'Insights generation already in progress' },
        { status: 409 }
      )
    }

    // Update status to processing
    await supabase
      .from('datasets')
      .update({ insights_status: 'processing' })
      .eq('id', datasetId)

    console.log(`📥 Downloading file from storage: ${dataset.storage_path}`)

    // Download CSV from storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from('datasets')
      .download(dataset.storage_path)

    if (storageError || !fileData) {
      await supabase
        .from('datasets')
        .update({
          insights_status: 'failed',
          insights_error: 'Failed to download file from storage'
        })
        .eq('id', datasetId)

      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      )
    }

    // Convert blob to text
    const csvData = await fileData.text()

    console.log(`📊 CSV file loaded, size: ${csvData.length} bytes`)

    // Limit CSV data if too large (keep first 100 rows for analysis)
    const lines = csvData.split('\n')
    const limitedCsvData = lines.length > 100
      ? lines.slice(0, 100).join('\n') + `\n\n[Note: Showing first 100 rows of ${lines.length} total rows]`
      : csvData

    console.log(`🤖 Generating insights with AI provider...`)

    // Create AI provider and generate insights
    const provider = ProviderFactory.createProvider(providerType)
    const result = await provider.analyze(
      limitedCsvData,
      dataset.prompt || 'Provide a comprehensive analysis of this dataset',
      dataset.file_name
    )

    console.log(`✅ Insights generated successfully!`, {
      model: result.model,
      tokensUsed: result.tokensUsed,
      cost: result.cost
    })

    // Update dataset with insights
    const { error: updateError } = await supabase
      .from('datasets')
      .update({
        insights_status: 'completed',
        insights_markdown: result.insights,
        insights_generated_at: new Date().toISOString(),
        insights_model: result.model,
        insights_tokens_used: result.tokensUsed,
        insights_cost: result.cost,
        insights_error: null
      })
      .eq('id', datasetId)

    if (updateError) {
      console.error('Failed to update insights:', updateError)
      return NextResponse.json(
        { error: 'Failed to save insights' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      datasetId,
      model: result.model,
      tokensUsed: result.tokensUsed,
      cost: result.cost
    })

  } catch (error: any) {
    console.error('Error generating insights:', error)

    // Try to update dataset status to failed
    try {
      if (datasetId) {
        const supabase = await createClient()
        await supabase
          .from('datasets')
          .update({
            insights_status: 'failed',
            insights_error: error.message || 'Unknown error occurred'
          })
          .eq('id', datasetId)
      }
    } catch (e) {
      // Ignore errors in error handler
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    )
  }
}
