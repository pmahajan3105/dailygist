# Daily Digest – Product Requirements Document (PRD)

## 1 • Purpose
Deliver a *personal AI-powered daily brief* that converts a user’s scattered content (starting with newsletters, later podcasts) into a concise, readable, and conversational report. The brief adapts to the user’s desired depth (5-, 15-, 25-minute modes) and is available as web, email, and chat.

## 2 • Background & Opportunity
Modern knowledge-workers drown in newsletters, feeds, and saved links while fearing they miss important insights. Existing solutions (RSS readers, read-later apps) still demand too much reading. A calm, single briefing that automatically filters and synthesises content can reclaim hours each day and build loyalty.

## 3 • Product Principles
1. **One Brief Daily** – no infinite feed; information arrives once, on schedule.  
2. **Calm Technology** – Ma / Kanso: minimal UI, no dopamine loops.  
3. **Synthesis > Summary** – highlight cross-source insights, not isolated TL;DRs.  
4. **Privacy & Control** – data stays with the user; minimal server storage.  
5. **Progressive Depth** – user selects 5 / 15 / 25-minute digest modes.
6. **AI-Powered Intelligence** – Leverage LangChain.js for advanced content processing and retrieval.

## 4 • Target Users
• Tech & knowledge workers drowning in newsletters.  
• Podcast enthusiasts wanting key takeaways.  
• Builders & researchers seeking AI-curated context.

## 5 • User Journey
### Morning Ritual (Primary)
1. Open Daily Digest email/web page.  
2. Scan or listen to preferred digest length.  
3. Flag items for later.  
4. Start day informed.

### Deep Dive (Secondary)
1. Open chat on a digest item.  
2. Ask follow-up questions.  
3. Receive sourced answers and full context.

## 6 • Scope & Phases
| Phase | Timeline | Key Sources | Core Deliverables |
|-------|----------|-------------|-------------------|
| **0. Foundation** | Week 0 | – | Tech scaffolding, Supabase auth, LangChain.js integration for ingestion, embedding, and querying with Supabase and RAG, serverless function setup |
| **1. MVP** | Weeks 1-3 | Newsletters, RSS | • User onboarding  
• Newsletter forwarding & parsing  
• RSS fetcher  
• AI summariser (LangChain.js)  
• Vector embeddings & storage (Supabase)  
• RAG-based context retrieval  
• Digest compiler (5/15/25 modes)  
• Web & email delivery |
| **2. Podcasts** | Weeks 4-5 | Podcast RSS | • Transcript (Whisper API)  
• Episode summarisation  
• Integration into digest |
| **3. Intelligence Layer** | Weeks 6-7 | ↑ | • Cross-source synthesis  
• Importance ranking  
• Chat interface (RAG) |
| **4. Audio / Personalisation** | Weeks 8-9 | ↑ | • ElevenLabs audio generation  
• Learning from read/skip patterns |

## 7 • Functional Requirements (MVP)
### 7.1 Account & Settings
- Email/password or social login via Supabase.  
- Set timezone & digest delivery time.

### 7.2 Source Management
- Add Newsletter (forwarding address).  
- Add RSS feed.  
- View & toggle active sources.

### 7.3 Content Pipeline
1. Scheduler triggers fetch.  
2. HTML/Feed content extracted → text.  
3. LangChain.js processes text for ingestion, embedding, and querying.  
4. Importance scored (simple heuristics).  
5. Digest assembled per chosen mode.

### 7.4 Digest Delivery
- Web reader (Next.js App Router).  
- Responsive email (MJML).  
- Adjustable length selector (5/15/25).  
- Stats footer (items processed, time saved).

### 7.5 Chat (post-MVP)
- RAG over stored summaries + pgvector; cite sources.

## 8 • Non-Functional Requirements
- P99 digest generation < 90 s.  
- Mobile-first responsive UI.  
- GDPR-compliant data deletion.  
- Error rate < 1 % of items processed.

## 9 • Metrics & KPIs
- Daily Digest open rate ≥ 60 %.  
- Avg. digest scroll depth ≥ 70 %.  
- Chat follow-ups per user ≥ 0.3 / day.  
- Token cost per user ≤ $0.05 / day.

## 10 • Open Questions
1. Store raw HTML for future reference or discard after summarisation?  
2. Exact word counts mapping to 5 / 15 / 25-minute reads.  
3. Free-tier limits – # of sources vs. daily token cap.

---
**Revision History**  
v0.1 – 2025-07-06 • Initial draft (incorporates: no BYOK Day 1, podcasts as second source, adjustable digest lengths).
