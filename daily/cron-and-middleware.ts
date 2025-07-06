// src/app/api/cron/digest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchContent } from '@/lib/fetchers'
import { createLLM } from '@/lib/ai/llm'
import { formatDigest } from '@/lib/digest/formatter'

// This runs on Vercel Cron
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  try {
    // Get current hour
    const currentHour = new Date().getHours()
    const currentDate = new Date().toISOString().split('T')[0]

    // Find users scheduled for this hour
    const { data: users } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('digest_time', `${currentHour.toString().padStart(2, '0')}:00:00`)

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users scheduled for this hour' })
    }

    const results = []

    for (const user of users) {
      try {
        // Check if digest already exists
        const { data: existingDigest } = await supabase
          .from('daily_digests')
          .select('id')
          .eq('user_id', user.id)
          .eq('digest_date', currentDate)
          .single()

        if (existingDigest) {
          results.push({ userId: user.id, status: 'skipped', reason: 'already exists' })
          continue
        }

        // Fetch all active sources
        const { data: sources } = await supabase
          .from('sources')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (!sources || sources.length === 0) {
          results.push({ userId: user.id, status: 'skipped', reason: 'no active sources' })
          continue
        }

        // Fetch content from all sources
        const allContent = []
        for (const source of sources) {
          try {
            const items = await fetchContent(source)
            
            // Get user's API key for summarization
            const { data: apiKey } = await supabase
              .from('user_api_keys')
              .select('*')
              .eq('user_id', user.id)
              .eq('provider', user.preferences?.preferred_llm || 'openai')
              .single()

            if (apiKey) {
              const llm = createLLM({ 
                provider: apiKey.provider, 
                apiKey: apiKey.encrypted_key // TODO: Decrypt
              })

              // Process and save items
              for (const item of items) {
                const summary = await llm.summarize(item.extracted_text || item.raw_content || '')
                const keyPoints = await llm.extractKeyPoints(item.extracted_text || item.raw_content || '')

                const { data: savedItem } = await supabase
                  .from('content_items')
                  .insert({
                    ...item,
                    ai_summary: summary,
                    key_points: keyPoints,
                    importance_score: 0.5, // Simple default
                  })
                  .select()
                  .single()

                if (savedItem) {
                  allContent.push(savedItem)
                }
              }
            }

            // Update last fetched
            await supabase
              .from('sources')
              .update({ last_fetched_at: new Date().toISOString() })
              .eq('id', source.id)
          } catch (error) {
            console.error(`Failed to fetch source ${source.id}:`, error)
          }
        }

        if (allContent.length === 0) {
          results.push({ userId: user.id, status: 'skipped', reason: 'no new content' })
          continue
        }

        // Generate digest
        const sections = {
          must_know: allContent.slice(0, 5).map(formatContentItem),
          themes: [], // Simplified
          video_highlights: allContent
            .filter(item => item.source_type === 'youtube')
            .slice(0, 3)
            .map(formatContentItem),
          podcast_roundup: allContent
            .filter(item => item.source_type === 'podcast')
            .slice(0, 3)
            .map(formatContentItem),
          quick_reads: allContent
            .filter(item => ['newsletter', 'rss'].includes(item.source_type))
            .slice(0, 10)
            .map(formatContentItem),
        }

        // Get LLM for digest generation
        const { data: apiKey } = await supabase
          .from('user_api_keys')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider', user.preferences?.preferred_llm || 'openai')
          .single()

        if (!apiKey) {
          results.push({ userId: user.id, status: 'failed', reason: 'no API key' })
          continue
        }

        const llm = createLLM({ 
          provider: apiKey.provider, 
          apiKey: apiKey.encrypted_key 
        })
        const fullText = await formatDigest(sections, llm)

        // Save digest
        const { error: digestError } = await supabase
          .from('daily_digests')
          .insert({
            user_id: user.id,
            digest_date: currentDate,
            full_text: fullText,
            sections,
            stats: {
              sources_checked: sources.length,
              items_processed: allContent.length,
              items_included: Object.values(sections).flat().length,
              estimated_read_time: Math.ceil(fullText.split(' ').length / 200),
              estimated_time_saved: allContent.length * 5,
            },
            generation_cost: {
              total_tokens: 1000, // TODO: Track actual
              provider: apiKey.provider,
              estimated_cost_usd: 0.03,
            },
          })

        if (digestError) {
          results.push({ userId: user.id, status: 'failed', error: digestError.message })
        } else {
          results.push({ userId: user.id, status: 'success' })

          // Send email if configured
          if (user.digest_format === 'email' || user.digest_format === 'both') {
            // TODO: Implement email sending
          }
        }
      } catch (error) {
        results.push({ 
          userId: user.id, 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return NextResponse.json({ 
      message: 'Digest generation complete',
      results 
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Cron job failed' }, 
      { status: 500 }
    )
  }
}

function formatContentItem(item: any) {
  return {
    title: item.title,
    summary: item.ai_summary,
    source: item.source_name || 'Unknown',
    url: item.content_url,
    importance: item.importance_score,
  }
}

// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/digest",
      "schedule": "0 * * * *"
    }
  ]
}

// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// src/lib/supabase/db-functions.sql
-- Function to save encrypted API keys
CREATE OR REPLACE FUNCTION save_api_key(
  p_provider text,
  p_api_key text
) RETURNS void AS $$
DECLARE
  v_encrypted_key text;
BEGIN
  -- Encrypt the API key
  v_encrypted_key := encode(
    pgp_sym_encrypt(p_api_key, current_setting('app.encryption_key')),
    'base64'
  );
  
  -- Insert or update
  INSERT INTO user_api_keys (user_id, provider, encrypted_key)
  VALUES (auth.uid(), p_provider::llm_provider, v_encrypted_key)
  ON CONFLICT (user_id, provider) 
  DO UPDATE SET 
    encrypted_key = v_encrypted_key,
    is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for semantic search (if using embeddings)
CREATE OR REPLACE FUNCTION search_content(
  query_text text,
  user_id uuid,
  limit_count int DEFAULT 5
) RETURNS TABLE (
  id uuid,
  title text,
  ai_summary text,
  source_name text,
  content_url text,
  relevance float
) AS $$
BEGIN
  -- Simple text search for now
  -- In production, use vector similarity with embeddings
  RETURN QUERY
  SELECT 
    ci.id,
    ci.title,
    ci.ai_summary,
    s.name as source_name,
    ci.content_url,
    ts_rank(
      to_tsvector('english', ci.title || ' ' || COALESCE(ci.ai_summary, '')),
      plainto_tsquery('english', query_text)
    ) as relevance
  FROM content_items ci
  JOIN sources s ON ci.source_id = s.id
  WHERE ci.user_id = search_content.user_id
    AND to_tsvector('english', ci.title || ' ' || COALESCE(ci.ai_summary, '')) 
        @@ plainto_tsquery('english', query_text)
  ORDER BY relevance DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

// package.json additions
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "supabase db push",
    "db:generate": "supabase gen types typescript --local > src/types/supabase.ts"
  }
}

// README.md
# Daily Digest - Your Personal Intelligence Brief

Transform information overload into a single, intelligent daily brief. Daily Digest is a personal AI-powered system that curates content from all your subscriptions.

## Features

- 🤖 **Bring Your Own AI**: Use your own API keys (OpenAI, Anthropic, Groq)
- 📱 **Multi-Source Support**: Newsletters, YouTube, Podcasts, RSS, Reddit
- ⚡ **Daily Intelligence Brief**: AI-synthesized summaries with cross-source insights
- 💬 **Chat Interface**: Ask questions about your saved content
- 🔒 **Privacy-First**: Your data stays yours, minimal storage

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase:
   - Create a project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `src/lib/supabase/schema.sql`
   - Copy your project URL and anon key to `.env.local`
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Configuration

### Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_service_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your_cron_secret
```

### API Keys

Users provide their own API keys through the onboarding flow:
- OpenAI (required)
- Anthropic (optional)
- Groq (optional)

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Configure cron job in `vercel.json`

## License

MIT