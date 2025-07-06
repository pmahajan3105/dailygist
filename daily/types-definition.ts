// src/types/index.ts

export type SourceType = 
  | 'newsletter'
  | 'youtube'
  | 'podcast'
  | 'rss'
  | 'reddit'
  | 'twitter'
  | 'substack';

export type DigestFormat = 'email' | 'web' | 'both';

export type LLMProvider = 'openai' | 'anthropic' | 'groq' | 'google';

export interface UserProfile {
  id: string;
  email: string;
  timezone: string;
  digest_time: string;
  digest_format: DigestFormat;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  digest_length?: 'short' | 'medium' | 'long';
  include_audio?: boolean;
  importance_threshold?: number;
  preferred_llm?: LLMProvider;
}

export interface APIKey {
  id: string;
  user_id: string;
  provider: LLMProvider;
  encrypted_key: string;
  is_active: boolean;
  created_at: string;
}

export interface Source {
  id: string;
  user_id: string;
  source_type: SourceType;
  name: string;
  config: SourceConfig;
  filters: SourceFilters;
  is_active: boolean;
  last_fetched_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SourceConfig {
  // Newsletter
  email_address?: string;
  
  // YouTube
  channel_id?: string;
  channel_url?: string;
  
  // Podcast
  rss_url?: string;
  
  // Reddit
  subreddit?: string;
  
  // RSS/Blog
  feed_url?: string;
  
  // Twitter
  list_id?: string;
  usernames?: string[];
}

export interface SourceFilters {
  keywords_include?: string[];
  keywords_exclude?: string[];
  min_length?: number;
  max_age_days?: number;
  authors_include?: string[];
  authors_exclude?: string[];
}

export interface ContentItem {
  id: string;
  source_id: string;
  user_id: string;
  title: string;
  author?: string;
  content_url?: string;
  published_at?: string;
  raw_content?: string;
  extracted_text?: string;
  ai_summary?: string;
  key_points?: string[];
  importance_score: number;
  metadata?: ContentMetadata;
  created_at: string;
}

export interface ContentMetadata {
  // YouTube
  video_id?: string;
  duration?: number;
  view_count?: number;
  
  // Podcast
  episode_number?: number;
  duration_seconds?: number;
  
  // Reddit
  subreddit?: string;
  score?: number;
  num_comments?: number;
  
  // General
  tags?: string[];
  image_url?: string;
}

export interface DailyDigest {
  id: string;
  user_id: string;
  digest_date: string;
  full_text?: string;
  sections?: DigestSections;
  audio_url?: string;
  stats?: DigestStats;
  generation_cost?: GenerationCost;
  delivered_at?: string;
  opened_at?: string;
  created_at: string;
}

export interface DigestSections {
  must_know: DigestItem[];
  themes: string[];
  video_highlights: DigestItem[];
  podcast_roundup: DigestItem[];
  quick_reads: DigestItem[];
  connections: string[];
}

export interface DigestItem {
  title: string;
  summary: string;
  source: string;
  url?: string;
  importance: number;
}

export interface DigestStats {
  sources_checked: number;
  items_processed: number;
  items_included: number;
  estimated_read_time: number;
  estimated_time_saved: number;
}

export interface GenerationCost {
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  estimated_cost_usd: number;
  provider: LLMProvider;
}

export interface ChatSession {
  id: string;
  user_id: string;
  digest_id?: string;
  title?: string;
  messages: ChatMessage[];
  total_tokens: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: string[];
}

// Form schemas with Zod
import { z } from 'zod';

export const sourceFormSchema = z.object({
  source_type: z.enum(['newsletter', 'youtube', 'podcast', 'rss', 'reddit', 'twitter', 'substack']),
  name: z.string().min(1, 'Name is required'),
  config: z.object({
    channel_url: z.string().url().optional(),
    rss_url: z.string().url().optional(),
    feed_url: z.string().url().optional(),
    subreddit: z.string().optional(),
  }),
  filters: z.object({
    keywords_include: z.array(z.string()).optional(),
    keywords_exclude: z.array(z.string()).optional(),
    min_length: z.number().optional(),
  }).optional(),
});

export const apiKeyFormSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'groq', 'google']),
  api_key: z.string().min(1, 'API key is required'),
});

export const userPreferencesSchema = z.object({
  timezone: z.string(),
  digest_time: z.string(),
  digest_format: z.enum(['email', 'web', 'both']),
  preferences: z.object({
    digest_length: z.enum(['short', 'medium', 'long']).optional(),
    include_audio: z.boolean().optional(),
    importance_threshold: z.number().min(0).max(1).optional(),
    preferred_llm: z.enum(['openai', 'anthropic', 'groq', 'google']).optional(),
  }),
});