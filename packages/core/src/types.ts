import { z } from 'zod';

export const ContentSourceSchema = z.enum([
  'email',
  'rss',
  'podcast',
  'youtube',
  'twitter',
  'other'
]);

export type ContentSource = z.infer<typeof ContentSourceSchema>;

export interface ContentItem {
  id: string;
  title: string;
  source: ContentSource;
  url?: string;
  summary?: string;
  content: string;
  publishedAt: Date;
  processedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface DigestItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: ContentSource;
  url?: string;
  publishedAt: Date;
  importance: number; // 1-5, 5 being most important
  tags?: string[];
}

export interface Digest {
  id: string;
  userId: string;
  items: DigestItem[];
  generatedAt: Date;
  readTime: number; // in minutes
  settings: {
    preferredLength: 'short' | 'medium' | 'long'; // 5, 15, or 25 minutes
    includeSources: ContentSource[];
    excludeTags?: string[];
  };
}
