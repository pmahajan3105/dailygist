import { z } from 'zod';

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
  created_at: string;
  updated_at: string;
}

export interface SourceConfig {
  email_address?: string;
  channel_id?: string;
  channel_url?: string;
  rss_url?: string;
  subreddit?: string;
  feed_url?: string;
  list_id?: string;
  usernames?: string[];
  [key: string]: any; // For additional provider-specific config
}

export interface SourceFilters {
  keywords_include?: string[];
  keywords_exclude?: string[];
  min_length?: number;
  max_age_days?: number;
  authors_include?: string[];
  authors_exclude?: string[];
  [key: string]: any; // For additional filter options
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
  video_id?: string;
  duration?: number;
  view_count?: number;
  episode_number?: number;
  duration_seconds?: number;
  subreddit?: string;
  score?: number;
  num_comments?: number;
  tags?: string[];
  image_url?: string;
  [key: string]: any; // For additional metadata
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
  [key: string]: any; // For additional sections
}

export interface DigestItem {
  title: string;
  summary: string;
  source: string;
  url?: string;
  importance: number;
  [key: string]: any; // For additional item properties
}

export interface DigestStats {
  sources_checked: number;
  items_processed: number;
  items_included: number;
  estimated_read_time: number;
  estimated_time_saved: number;
  [key: string]: any; // For additional stats
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
  [key: string]: any; // For additional message properties
}

// Form schemas with Zod
export const sourceFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  source_type: z.enum(['newsletter', 'youtube', 'podcast', 'rss', 'reddit', 'twitter', 'substack']),
  config: z.object({}).passthrough(),
  filters: z.object({}).passthrough().optional(),
  is_active: z.boolean().default(true)
});

export const userPreferencesSchema = z.object({
  digest_length: z.enum(['short', 'medium', 'long']).default('medium'),
  include_audio: z.boolean().default(false),
  importance_threshold: z.number().min(0).max(1).default(0.5),
  preferred_llm: z.enum(['openai', 'anthropic', 'groq', 'google']).default('openai')
});

export const apiKeySchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'groq', 'google']),
  key: z.string().min(1, 'API key is required')
});
