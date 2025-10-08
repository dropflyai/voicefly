/**
 * GEO Analysis API Endpoint
 * Analyzes content for Generative Engine Optimization
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyzeContentForGEO, quickGEOScan, type ContentMetadata } from '@/lib/geo-analyzer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, metadata, mode = 'full' } = body

    // Validate input
    if (!content || !metadata) {
      return NextResponse.json(
        { error: 'Content and metadata are required' },
        { status: 400 }
      )
    }

    // Quick scan mode (faster, cheaper)
    if (mode === 'quick') {
      const result = await quickGEOScan(content, metadata)
      return NextResponse.json(result)
    }

    // Full analysis mode
    const result = await analyzeContentForGEO(content, metadata as ContentMetadata)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('GEO analysis API error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'GEO Analysis API',
    endpoints: {
      analyze: 'POST /api/geo/analyze - Analyze content for GEO optimization',
      modes: {
        quick: 'Fast scan with top issues (~$0.001)',
        full: 'Complete analysis with detailed recommendations (~$0.01)'
      }
    }
  })
}
