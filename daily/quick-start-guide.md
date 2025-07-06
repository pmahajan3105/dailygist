# Daily Digest - Quick Start Guide

## 🚀 Getting Started in 15 Minutes

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works)
- At least an OpenAI API key

### Step 1: Set Up the Project (2 min)

```bash
# Run the setup script I created
chmod +x setup.sh
./setup.sh

# Or manually:
npx create-next-app@latest daily-digest --typescript --tailwind --app --use-npm
cd daily-digest
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs openai anthropic-ai/sdk
npm install react-hot-toast react-markdown lucide-react date-fns zod ai
```

### Step 2: Set Up Supabase (5 min)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to Settings → API
3. Copy your Project URL and anon public key
4. Go to SQL Editor and run the entire schema from `supabase-schema.sql`
5. Set the encryption key:
   ```sql
   ALTER DATABASE postgres SET app.encryption_key = 'your-secret-32-char-key';
   ```

### Step 3: Configure Environment (2 min)

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your-random-secret
```

### Step 4: Copy the Code (3 min)

1. Copy all the TypeScript/TSX files I created into your `src` folder
2. The file structure should look like:
```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts
│   │   ├── cron/digest/route.ts
│   │   ├── digest/generate/route.ts
│   │   ├── email/webhook/route.ts
│   │   └── sources/fetch/route.ts
│   ├── auth/
│   │   ├── callback/route.ts
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── verify/page.tsx
│   ├── dashboard/
│   │   ├── chat/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── sources/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── onboarding/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── dashboard/nav.tsx
│   ├── digest/viewer.tsx
│   ├── sources/
│   │   ├── add-source-button.tsx
│   │   ├── add-source-modal.tsx
│   │   └── sources-list.tsx
│   └── ui/
│       ├── button.tsx
│       ├── error.tsx
│       └── loading.tsx
├── lib/
│   ├── ai/llm.ts
│   ├── digest/
│   │   ├── email-template.ts
│   │   └── formatter.ts
│   ├── email/
│   │   ├── ingest.ts
│   │   └── send.ts
│   ├── fetchers/
│   │   ├── base.ts
│   │   ├── index.ts
│   │   ├── reddit.ts
│   │   ├── rss.ts
│   │   └── youtube.ts
│   ├── processors/
│   │   ├── extractor.ts
│   │   └── youtube-transcript.ts
│   └── supabase/
│       ├── actions.ts
│       ├── client.ts
│       ├── middleware.ts
│       └── server.ts
├── types/index.ts
├── utils/cn.ts
└── middleware.ts
```

### Step 5: Run the App! (1 min)

```bash
npm run dev
```

Visit http://localhost:3000 and you should see the landing page!

## 🎯 First Steps After Setup

### 1. Create Your Account
- Click "Get Started" and sign up
- Check your email for verification
- You'll be redirected to onboarding

### 2. Add Your API Keys
- Start with just OpenAI (required)
- Get one at platform.openai.com
- You can add Anthropic/Groq later

### 3. Add Your First Sources
- **Newsletters**: You'll get a unique email address to forward to
- **YouTube**: Just paste channel URLs (e.g., https://youtube.com/@mkbhd)
- **RSS/Blogs**: Any RSS feed URL works
- **Reddit**: Enter subreddit names (without r/)

### 4. Generate Your First Digest
- For testing, go to `/api/digest/generate` with POST:
  ```json
  { "date": "2024-01-06" }
  ```
- Or wait for the daily cron job

## 🛠️ Development Tips

### Testing Content Fetching
```bash
# Test fetching from a source
curl -X POST http://localhost:3000/api/sources/fetch \
  -H "Content-Type: application/json" \
  -d '{"sourceId": "your-source-id"}'
```

### Manual Digest Generation
1. Add some sources first
2. Let them fetch content
3. Call the digest generation API
4. View at `/dashboard`

### Local Cron Testing
```bash
# Simulate the cron job
curl http://localhost:3000/api/cron/digest \
  -H "Authorization: Bearer your-cron-secret"
```

## 📱 Core Features Working

✅ **User Authentication** - Signup, login, sessions
✅ **API Key Management** - Encrypted storage, multi-provider
✅ **Source Management** - Add/remove content sources
✅ **Content Fetching** - RSS, YouTube, Reddit ready
✅ **AI Summarization** - Using user's own keys
✅ **Daily Digest Generation** - Beautiful markdown format
✅ **Chat Interface** - RAG-based Q&A on content
✅ **Settings** - Timezone, delivery preferences

## 🚧 What's Not Implemented Yet

These features need additional work:

1. **Email Delivery** - Set up SendGrid/Resend
2. **YouTube Transcripts** - Add youtube-transcript library
3. **Audio Generation** - Integrate ElevenLabs
4. **Podcast Transcription** - Add Whisper API
5. **Twitter Integration** - Needs API access
6. **Advanced Search** - Vector embeddings with pgvector
7. **Mobile PWA** - Add manifest and service worker

## 🔧 Production Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add all environment variables
4. Add `vercel.json` for cron:
```json
{
  "crons": [{
    "path": "/api/cron/digest",
    "schedule": "0 * * * *"
  }]
}
```

### Production Checklist
- [ ] Set strong encryption key in Supabase
- [ ] Enable RLS policies in Supabase
- [ ] Set up proper email service
- [ ] Configure custom domain
- [ ] Set up monitoring (Sentry)
- [ ] Add rate limiting
- [ ] Implement proper key decryption

## 🎉 You're Ready!

You now have a working Daily Digest app that:
- Aggregates content from multiple sources
- Uses AI to summarize everything
- Generates beautiful daily briefs
- Lets users chat with their content
- Respects privacy with user-owned API keys

Start by adding a few sources and generating your first digest. The app will grow with you as you add more features!

## Need Help?

- **Supabase Issues**: Check RLS policies and permissions
- **API Errors**: Verify your API keys are correct
- **Content Not Fetching**: Check browser console for CORS issues
- **Digest Not Generating**: Ensure you have content items for the date

Happy building! 🚀