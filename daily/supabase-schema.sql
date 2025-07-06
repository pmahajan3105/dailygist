-- Daily Digest Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "vector"; -- For embeddings (optional)

-- Custom types
CREATE TYPE source_type AS ENUM (
  'newsletter',
  'youtube', 
  'podcast',
  'rss',
  'reddit',
  'twitter',
  'substack'
);

CREATE TYPE digest_format AS ENUM (
  'email',
  'web',
  'both'
);

CREATE TYPE llm_provider AS ENUM (
  'openai',
  'anthropic',
  'groq',
  'google'
);

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  digest_time TIME DEFAULT '08:00:00',
  digest_format digest_format DEFAULT 'web',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys (encrypted)
CREATE TABLE public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider llm_provider NOT NULL,
  encrypted_key TEXT NOT NULL, -- Use pgcrypto to encrypt
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Content Sources
CREATE TABLE public.sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type source_type NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL, -- URL, channel ID, RSS feed, etc.
  filters JSONB DEFAULT '{}', -- keywords, min_length, etc.
  is_active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Items
CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  content_url TEXT,
  published_at TIMESTAMPTZ,
  raw_content TEXT,
  extracted_text TEXT,
  ai_summary TEXT,
  key_points TEXT[],
  importance_score FLOAT DEFAULT 0.5,
  embedding vector(1536), -- Optional: for semantic search
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Digests
CREATE TABLE public.daily_digests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_date DATE NOT NULL,
  full_text TEXT,
  sections JSONB, -- Structured digest content
  audio_url TEXT,
  stats JSONB DEFAULT '{}', -- items processed, tokens used, etc.
  generation_cost JSONB DEFAULT '{}', -- Track API costs
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, digest_date)
);

-- Chat Sessions
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_id UUID REFERENCES public.daily_digests(id) ON DELETE SET NULL,
  title TEXT,
  messages JSONB DEFAULT '[]',
  total_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email forwarding addresses
CREATE TABLE public.email_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_content_items_user_id ON public.content_items(user_id);
CREATE INDEX idx_content_items_source_id ON public.content_items(source_id);
CREATE INDEX idx_content_items_published_at ON public.content_items(published_at DESC);
CREATE INDEX idx_content_items_importance ON public.content_items(importance_score DESC);
CREATE INDEX idx_daily_digests_user_date ON public.daily_digests(user_id, digest_date DESC);
CREATE INDEX idx_sources_user_id ON public.sources(user_id);

-- Full text search
CREATE INDEX idx_content_items_search ON public.content_items 
  USING gin(to_tsvector('english', title || ' ' || COALESCE(extracted_text, '')));

-- Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own API keys" ON public.user_api_keys
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sources" ON public.sources
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own content" ON public.content_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own digests" ON public.daily_digests
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own chat sessions" ON public.chat_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own email addresses" ON public.email_addresses
  FOR ALL USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (new.id, new.email);
  
  -- Generate unique email forwarding address
  INSERT INTO public.email_addresses (user_id, address)
  VALUES (new.id, split_part(new.email, '@', 1) || '+' || substr(md5(random()::text), 1, 8) || '@digest.app');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to encrypt API keys
CREATE OR REPLACE FUNCTION public.encrypt_api_key(key_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- In production, use a proper encryption key from environment
  RETURN encode(pgp_sym_encrypt(key_text, current_setting('app.encryption_key')), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt API keys
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(decode(encrypted_key, 'base64'), current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set encryption key (in production, use environment variable)
-- ALTER DATABASE your_database_name SET app.encryption_key = 'your-secret-encryption-key';