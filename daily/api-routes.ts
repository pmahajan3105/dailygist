// src/app/api/sources/fetch/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchContent } from '@/lib/fetchers'
import { createLLM } from '@/lib/ai/llm'

export async function POST(request: NextRequest) {
  try {
    const { sourceId } = await request.json()
    const supabase = createServerSupabaseClient()

    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get source
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .select('*')
      .eq('id', sourceId)
      .eq('user_id', user.id)
      .single()

    if (sourceError || !source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    // Fetch content
    const items = await fetchContent(source)

    // Get user's API key
    const { data: apiKey } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'openai')
      .single()

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key configured' }, { status: 400 })
    }

    // Decrypt API key (in production, use proper decryption)
    const decryptedKey = apiKey.encrypted_key // TODO: Decrypt properly

    // Process each item
    const llm = createLLM({ provider: 'openai', apiKey: decryptedKey })
    const processedItems = []

    for (const item of items) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('content_items')
        .select('id')
        .eq('content_url', item.content_url)
        .eq('user_id', user.id)
        .single()

      if (existing) continue

      // Generate summary
      const textToSummarize = item.extracted_text || item.raw_content || ''
      const summary = await llm.summarize(textToSummarize)
      const keyPoints = await llm.extractKeyPoints(textToSummarize)

      // Calculate importance score (simple version)
      const importanceScore = calculateImportance(item, source)

      // Save to database
      const { data: savedItem, error: saveError } = await supabase
        .from('content_items')
        .insert({
          ...item,
          ai_summary: summary,
          key_points: keyPoints,
          importance_score: importanceScore,
        })
        .select()
        .single()

      if (!saveError) {
        processedItems.push(savedItem)
      }
    }

    // Update last fetched
    await supabase
      .from('sources')
      .update({ last_fetched_at: new Date().toISOString() })
      .eq('id', sourceId)

    return NextResponse.json({ 
      success: true, 
      itemsProcessed: processedItems.length 
    })
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content' }, 
      { status: 500 }
    )
  }
}

function calculateImportance(item: any, source: any): number {
  let score = 0.5 // Base score

  // Recency boost
  if (item.published_at) {
    const hoursAgo = (Date.now() - new Date(item.published_at).getTime()) / (1000 * 60 * 60)
    if (hoursAgo < 24) score += 0.2
    else if (hoursAgo < 48) score += 0.1
  }

  // Source type weights
  const typeWeights: Record<string, number> = {
    newsletter: 0.1,
    youtube: 0.15,
    podcast: 0.1,
    reddit: 0.05,
  }
  score += typeWeights[source.source_type] || 0

  // Reddit specific
  if (item.metadata?.score) {
    if (item.metadata.score > 1000) score += 0.15
    else if (item.metadata.score > 100) score += 0.1
  }

  // YouTube specific
  if (item.metadata?.view_count) {
    if (item.metadata.view_count > 100000) score += 0.15
    else if (item.metadata.view_count > 10000) score += 0.1
  }

  return Math.min(score, 1) // Cap at 1
}

// src/app/api/digest/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createLLM } from '@/lib/ai/llm'
import { formatDigest } from '@/lib/digest/formatter'

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json()
    const supabase = createServerSupabaseClient()

    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if digest already exists
    const { data: existingDigest } = await supabase
      .from('daily_digests')
      .select('id')
      .eq('user_id', user.id)
      .eq('digest_date', date)
      .single()

    if (existingDigest) {
      return NextResponse.json({ error: 'Digest already exists' }, { status: 400 })
    }

    // Get content items for the date
    const startDate = new Date(date)
    const endDate = new Date(date)
    endDate.setDate(endDate.getDate() + 1)

    const { data: contentItems } = await supabase
      .from('content_items')
      .select('*, sources!inner(name, source_type)')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())
      .order('importance_score', { ascending: false })

    if (!contentItems || contentItems.length === 0) {
      return NextResponse.json({ error: 'No content for this date' }, { status: 404 })
    }

    // Get user's API key
    const { data: apiKey } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'openai')
      .single()

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key configured' }, { status: 400 })
    }

    // Generate digest sections
    const sections = {
      must_know: contentItems.slice(0, 5).map(item => ({
        title: item.title,
        summary: item.ai_summary,
        source: item.sources.name,
        url: item.content_url,
        importance: item.importance_score,
      })),
      themes: await identifyThemes(contentItems),
      video_highlights: contentItems
        .filter(item => item.sources.source_type === 'youtube')
        .slice(0, 3)
        .map(formatItem),
      podcast_roundup: contentItems
        .filter(item => item.sources.source_type === 'podcast')
        .slice(0, 3)
        .map(formatItem),
      quick_reads: contentItems
        .filter(item => ['newsletter', 'rss', 'substack'].includes(item.sources.source_type))
        .slice(0, 10)
        .map(item => ({
          title: item.title,
          summary: item.ai_summary?.split('.')[0] + '.',
          source: item.sources.name,
          url: item.content_url,
        })),
    }

    // Generate formatted digest
    const llm = createLLM({ provider: 'openai', apiKey: apiKey.encrypted_key })
    const fullText = await formatDigest(sections, llm)

    // Calculate stats
    const stats = {
      sources_checked: new Set(contentItems.map(item => item.source_id)).size,
      items_processed: contentItems.length,
      items_included: Object.values(sections).flat().length,
      estimated_read_time: Math.ceil(fullText.split(' ').length / 200), // 200 wpm
      estimated_time_saved: contentItems.length * 5, // 5 min per item
    }

    // Save digest
    const { data: digest, error } = await supabase
      .from('daily_digests')
      .insert({
        user_id: user.id,
        digest_date: date,
        full_text: fullText,
        sections,
        stats,
        generation_cost: {
          total_tokens: 1000, // TODO: Track actual usage
          prompt_tokens: 800,
          completion_tokens: 200,
          estimated_cost_usd: 0.03,
          provider: 'openai',
        },
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, digest })
  } catch (error) {
    console.error('Digest generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate digest' }, 
      { status: 500 }
    )
  }
}

async function identifyThemes(contentItems: any[]): Promise<string[]> {
  // Simple theme extraction - in production, use LLM
  const allText = contentItems
    .map(item => `${item.title} ${item.ai_summary}`)
    .join(' ')
    .toLowerCase()

  const themes = []
  
  // Check for common themes
  if (allText.includes('ai') || allText.includes('artificial intelligence')) {
    themes.push('AI and Machine Learning developments')
  }
  if (allText.includes('climate') || allText.includes('sustainability')) {
    themes.push('Climate and sustainability news')
  }
  if (allText.includes('startup') || allText.includes('funding')) {
    themes.push('Startup ecosystem updates')
  }

  return themes.slice(0, 3)
}

function formatItem(item: any) {
  return {
    title: item.title,
    summary: item.ai_summary,
    source: item.sources.name,
    url: item.content_url,
    importance: item.importance_score,
  }
}

// src/lib/digest/formatter.ts
import { LLM } from '../ai/llm'

export async function formatDigest(sections: any, llm: LLM): Promise<string> {
  const date = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  let digest = `# YOUR DAILY BRIEF - ${date}\n\n`
  digest += `---\n\n`

  // Must Know Section
  if (sections.must_know.length > 0) {
    digest += `## ⚡ TOP STORIES\n\n`
    for (const item of sections.must_know) {
      digest += `### ${item.title}\n`
      digest += `${item.summary}\n`
      digest += `*Source: ${item.source}*\n\n`
    }
  }

  // Themes
  if (sections.themes.length > 0) {
    digest += `## 🔍 BIG PICTURE\n\n`
    for (const theme of sections.themes) {
      digest += `- ${theme}\n`
    }
    digest += `\n`
  }

  // Video Highlights
  if (sections.video_highlights.length > 0) {
    digest += `## 📺 VIDEO HIGHLIGHTS\n\n`
    for (const item of sections.video_highlights) {
      digest += `**${item.title}**\n`
      digest += `${item.summary}\n\n`
    }
  }

  // Podcast Roundup
  if (sections.podcast_roundup.length > 0) {
    digest += `## 🎧 PODCAST ROUNDUP\n\n`
    for (const item of sections.podcast_roundup) {
      digest += `**${item.title}**\n`
      digest += `${item.summary}\n\n`
    }
  }

  // Quick Reads
  if (sections.quick_reads.length > 0) {
    digest += `## 📊 QUICK UPDATES\n\n`
    for (const item of sections.quick_reads) {
      digest += `- **${item.title}** - ${item.summary}\n`
    }
  }

  return digest
}

// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createLLM } from '@/lib/ai/llm'
import { StreamingTextResponse, LangChainStream } from 'ai'

export async function POST(request: NextRequest) {
  try {
    const { messages, sessionId } = await request.json()
    const supabase = createServerSupabaseClient()

    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create session
    let session
    if (sessionId) {
      const { data } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()
      session = data
    }

    if (!session) {
      const { data } = await supabase
        .from('chat_sessions')
        .insert({ user_id: user.id, messages: [] })
        .select()
        .single()
      session = data
    }

    // Get relevant content for RAG
    const lastMessage = messages[messages.length - 1].content
    const { data: relevantContent } = await supabase
      .rpc('search_content', {
        query_text: lastMessage,
        user_id: user.id,
        limit_count: 5
      })

    // Build context
    const context = relevantContent
      ?.map((item: any) => `Title: ${item.title}\nSummary: ${item.ai_summary}\nSource: ${item.source_name}`)
      .join('\n\n')

    // Get API key
    const { data: apiKey } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'openai')
      .single()

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key configured' }, { status: 400 })
    }

    // Create response stream
    const { stream, handlers } = LangChainStream()

    // Generate response
    const systemPrompt = `You are a helpful assistant with access to the user's daily digest content. 
    Use the following context to answer questions:
    
    ${context}
    
    If the user asks about content not in the context, let them know you can only discuss their saved content.`

    // Start streaming response
    const llm = createLLM({ provider: 'openai', apiKey: apiKey.encrypted_key })
    
    // For now, return a simple response
    // In production, implement proper streaming
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.encrypted_key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    })

    // Update session
    await supabase
      .from('chat_sessions')
      .update({
        messages: [...(session.messages || []), ...messages],
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id)

    return new StreamingTextResponse(response.body!)
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat' }, 
      { status: 500 }
    )
  }
}