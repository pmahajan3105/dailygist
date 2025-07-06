// src/lib/fetchers/base.ts
import { Source, ContentItem } from '@/types'

export abstract class ContentFetcher {
  abstract fetch(source: Source): Promise<Partial<ContentItem>[]>
}

// src/lib/fetchers/rss.ts
import Parser from 'rss-parser'
import { ContentFetcher } from './base'
import { Source, ContentItem } from '@/types'
import { extractArticleContent } from '../processors/extractor'

export class RSSFetcher extends ContentFetcher {
  private parser = new Parser()

  async fetch(source: Source): Promise<Partial<ContentItem>[]> {
    const feedUrl = source.config.feed_url || source.config.rss_url
    if (!feedUrl) throw new Error('No feed URL configured')

    try {
      const feed = await this.parser.parseURL(feedUrl)
      const items: Partial<ContentItem>[] = []

      for (const item of feed.items.slice(0, 10)) { // Limit to 10 items
        const content: Partial<ContentItem> = {
          source_id: source.id,
          user_id: source.user_id,
          title: item.title || 'Untitled',
          author: item.creator || feed.title,
          content_url: item.link,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
          raw_content: item.content || item.contentSnippet || '',
        }

        // Extract full article content if URL available
        if (item.link) {
          try {
            const extracted = await extractArticleContent(item.link)
            content.extracted_text = extracted.textContent
            content.metadata = {
              ...content.metadata,
              image_url: extracted.image,
            }
          } catch (error) {
            console.error(`Failed to extract content from ${item.link}:`, error)
          }
        }

        items.push(content)
      }

      return items
    } catch (error) {
      console.error(`Failed to fetch RSS feed ${feedUrl}:`, error)
      throw error
    }
  }
}

// src/lib/fetchers/youtube.ts
import { ContentFetcher } from './base'
import { Source, ContentItem } from '@/types'

export class YouTubeFetcher extends ContentFetcher {
  async fetch(source: Source): Promise<Partial<ContentItem>[]> {
    const channelUrl = source.config.channel_url
    if (!channelUrl) throw new Error('No channel URL configured')

    // Extract channel ID from URL
    const channelId = this.extractChannelId(channelUrl)
    
    // YouTube channels provide RSS feeds
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    
    // Use RSS fetcher for YouTube
    const rssFetcher = new RSSFetcher()
    const items = await rssFetcher.fetch({
      ...source,
      config: { ...source.config, feed_url: feedUrl }
    })

    // Enhance with YouTube-specific metadata
    return items.map(item => ({
      ...item,
      metadata: {
        ...item.metadata,
        video_id: this.extractVideoId(item.content_url || ''),
        // We'll fetch transcript in the processor
      }
    }))
  }

  private extractChannelId(url: string): string {
    // Handle different YouTube URL formats
    const patterns = [
      /youtube\.com\/channel\/([^\/\?]+)/,
      /youtube\.com\/c\/([^\/\?]+)/,
      /youtube\.com\/@([^\/\?]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }

    throw new Error('Invalid YouTube channel URL')
  }

  private extractVideoId(url: string): string {
    const match = url.match(/v=([^&]+)/)
    return match ? match[1] : ''
  }
}

// src/lib/fetchers/reddit.ts
import { ContentFetcher } from './base'
import { Source, ContentItem } from '@/types'

export class RedditFetcher extends ContentFetcher {
  async fetch(source: Source): Promise<Partial<ContentItem>[]> {
    const subreddit = source.config.subreddit
    if (!subreddit) throw new Error('No subreddit configured')

    try {
      // Reddit provides JSON feeds
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/top.json?limit=10&t=day`,
        {
          headers: {
            'User-Agent': 'DailyDigest/1.0'
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch Reddit feed')

      const data = await response.json()
      const items: Partial<ContentItem>[] = []

      for (const post of data.data.children) {
        const postData = post.data
        
        items.push({
          source_id: source.id,
          user_id: source.user_id,
          title: postData.title,
          author: postData.author,
          content_url: `https://reddit.com${postData.permalink}`,
          published_at: new Date(postData.created_utc * 1000).toISOString(),
          raw_content: postData.selftext || postData.url,
          metadata: {
            subreddit: postData.subreddit,
            score: postData.score,
            num_comments: postData.num_comments,
            image_url: postData.thumbnail !== 'self' ? postData.thumbnail : undefined,
          }
        })
      }

      return items
    } catch (error) {
      console.error(`Failed to fetch Reddit feed for r/${subreddit}:`, error)
      throw error
    }
  }
}

// src/lib/fetchers/index.ts
import { Source } from '@/types'
import { RSSFetcher } from './rss'
import { YouTubeFetcher } from './youtube'
import { RedditFetcher } from './reddit'

export async function fetchContent(source: Source) {
  let fetcher: ContentFetcher

  switch (source.source_type) {
    case 'rss':
    case 'substack':
    case 'podcast':
      fetcher = new RSSFetcher()
      break
    case 'youtube':
      fetcher = new YouTubeFetcher()
      break
    case 'reddit':
      fetcher = new RedditFetcher()
      break
    default:
      throw new Error(`Unsupported source type: ${source.source_type}`)
  }

  return fetcher.fetch(source)
}

// src/lib/processors/extractor.ts
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

export async function extractArticleContent(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DailyDigest/1.0)'
      }
    })

    if (!response.ok) throw new Error('Failed to fetch article')

    const html = await response.text()
    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()

    if (!article) throw new Error('Failed to parse article')

    return {
      title: article.title,
      content: article.content,
      textContent: article.textContent,
      length: article.length,
      excerpt: article.excerpt,
      byline: article.byline,
      siteName: article.siteName,
      image: dom.window.document.querySelector('meta[property="og:image"]')?.getAttribute('content')
    }
  } catch (error) {
    console.error(`Failed to extract content from ${url}:`, error)
    throw error
  }
}

// src/lib/processors/youtube-transcript.ts
export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  // In production, you'd use youtube-transcript library or YouTube API
  // For now, returning placeholder
  return `Transcript for video ${videoId} would be fetched here`
}

// src/lib/ai/llm.ts
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { LLMProvider } from '@/types'

export interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  model?: string
}

export abstract class LLM {
  abstract summarize(text: string, maxLength?: number): Promise<string>
  abstract extractKeyPoints(text: string): Promise<string[]>
  abstract generateDigest(sections: any): Promise<string>
}

export class OpenAILLM extends LLM {
  private client: OpenAI

  constructor(apiKey: string, private model = 'gpt-4-turbo-preview') {
    this.client = new OpenAI({ apiKey })
  }

  async summarize(text: string, maxLength = 200): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: `You are a skilled content summarizer. Create concise, informative summaries that capture the key information. Maximum ${maxLength} words.`
        },
        {
          role: 'user',
          content: `Summarize this content:\n\n${text.slice(0, 4000)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 300,
    })

    return response.choices[0].message.content || ''
  }

  async extractKeyPoints(text: string): Promise<string[]> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'Extract 3-5 key points from the content. Return as a JSON array of strings.'
        },
        {
          role: 'user',
          content: text.slice(0, 4000)
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    try {
      const result = JSON.parse(response.choices[0].message.content || '{}')
      return result.points || []
    } catch {
      return []
    }
  }

  async generateDigest(sections: any): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are creating a daily digest. Format it in clean markdown with clear sections. Be concise but informative.'
        },
        {
          role: 'user',
          content: `Create a daily digest from these sections:\n${JSON.stringify(sections, null, 2)}`
        }
      ],
      temperature: 0.5,
      max_tokens: 2000,
    })

    return response.choices[0].message.content || ''
  }
}

export class AnthropicLLM extends LLM {
  private client: Anthropic

  constructor(apiKey: string, private model = 'claude-3-sonnet-20240229') {
    this.client = new Anthropic({ apiKey })
  }

  async summarize(text: string, maxLength = 200): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 300,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: `Summarize this content in maximum ${maxLength} words:\n\n${text.slice(0, 4000)}`
      }]
    })

    return message.content[0].type === 'text' ? message.content[0].text : ''
  }

  async extractKeyPoints(text: string): Promise<string[]> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 300,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: `Extract 3-5 key points from this content. Return only a JSON array of strings:\n\n${text.slice(0, 4000)}`
      }]
    })

    try {
      const content = message.content[0].type === 'text' ? message.content[0].text : '[]'
      return JSON.parse(content)
    } catch {
      return []
    }
  }

  async generateDigest(sections: any): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      temperature: 0.5,
      messages: [{
        role: 'user',
        content: `Create a daily digest in markdown format from these sections:\n${JSON.stringify(sections, null, 2)}`
      }]
    })

    return message.content[0].type === 'text' ? message.content[0].text : ''
  }
}

export function createLLM(config: LLMConfig): LLM {
  switch (config.provider) {
    case 'openai':
      return new OpenAILLM(config.apiKey, config.model)
    case 'anthropic':
      return new AnthropicLLM(config.apiKey, config.model)
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`)
  }
}