# Daily Digest – Master Task List

_Latest compilation of **everything** to build, refactor, move or delete._  
_Source docs merged:_ `DEVELOPMENT_ROADMAP.md` • `MIGRATION_PLAN.md` • `UI_COMPONENTS.md`

---
## 0 Legend
- **✅** Done & committed
- **🔄** In-progress
- **🆕** Not started
- **❌** Remove / deprecate

Each task has a unique **ID** so we can mirror it 1-to-1 with GitHub Issues.

---
## 1 Core Foundation (CF-*)
| ID | Status | Description | Source |
|----|--------|-------------|--------|
| CF-1 | 🆕 | Finalise `tsconfig` references & path aliases across packages | Roadmap |
| CF-2 | 🆕 | Configure `SUPABASE_PROJECT_REF`, run `generate-types` script, commit `database.types.ts` | Roadmap |
| CF-3 | 🆕 | Extract legacy `utils-and-helpers.ts` → `packages/core/src/utils/*` | Roadmap + Migration |
| CF-4 | 🆕 | Delete `daily/` folder once no imports reference it | Migration |

---
## 2 UI Library (UI-*)
| ID | Status | Description | Source |
|----|--------|-------------|--------|
| UI-1 | 🔄 | Copy existing components from `frontend/src/components` → `packages/ui/src/components` | Roadmap |
| UI-2 | 🆕 | Refactor components to TypeScript, add stories in Storybook | UI Components |
| UI-3 | 🆕 | Build new **Source Management** set: `SourceList`, `SourceForm`, `SourceCard` | UI Components |
| UI-4 | 🆕 | Build new **Digest View** set: `DigestList`, `DigestViewer`, `DigestSettings` | UI Components |
| UI-5 | 🆕 | Build new **Auth** forms: `LoginForm`, `SignupForm`, `ForgotPassword` | UI Components |

---
## 3 Authentication (AUTH-*)
| ID | Status | Description | Source |
|----|--------|-------------|--------|
| AUTH-1 | 🆕 | Integrate NextAuth.js with Supabase adapter in `apps/web` | Roadmap |
| AUTH-2 | 🆕 | Implement server & client route guards | Roadmap |

---
## 4 Content Ingestion (CI-*)
| ID | Status | Description | Source |
|----|--------|-------------|--------|
| CI-1 | 🆕 | Base fetcher class + error handling | Roadmap |
| CI-2 | 🆕 | Newsletter fetcher (Metalloy/IMAP) | Roadmap |
| CI-3 | 🆕 | RSS fetcher | Roadmap |
| CI-4 | 🆕 | YouTube fetcher | Roadmap |
| CI-5 | 🆕 | Social feed fetchers (Reddit, Twitter, Substack) | Migration |

---
## 5 AI/ML Infrastructure (AI-*)
| ID | Status | Description | Source |
|----|--------|-------------|--------|
| AI-1 | 🆕 | Set up LangChain.js in backend for document processing | New |
| AI-2 | 🆕 | Configure Supabase pgvector for embeddings storage | New |
| AI-3 | 🆕 | Implement RAG pipeline with LangChain and Supabase | New |
| AI-4 | 🆕 | Set up `ai-sdk` in frontend for streaming responses | New |
| AI-5 | 🆕 | Create chat interface components with `ai-sdk` | New |

## 6 Digest Generation (DG-*)
| ID | Status | Description | Source |
|----|--------|-------------|--------|
| DG-1 | 🆕 | Implement embedding-based content scoring with LangChain | Roadmap |
| DG-2 | 🆕 | Design summarization prompts for different digest lengths | Roadmap |
| DG-3 | 🆕 | Build digest assembly pipeline with RAG context | Roadmap |
| DG-4 | 🆕 | Create responsive email templates with AI-summarized content | Roadmap |

---
## 7 Notifications & Analytics (NA-*)
| ID | Status | Description | Source |
|----|--------|-------------|--------|
| NA-1 | 🆕 | Email send via Resend | Roadmap |
| NA-2 | 🆕 | Web push via VAPID | Roadmap |
| NA-3 | 🆕 | PostHog tracking wrapper | Roadmap |
| NA-4 | 🆕 | Sentry client & server integration | Roadmap |

---
## 8 Dev Experience & QA (DX-*)
| ID | Status | Description | Source |
|----|--------|-------------|--------|
| DX-1 | 🆕 | Jest + Testing Library config | Roadmap |
| DX-2 | 🆕 | Playwright smoke tests | Roadmap |
| DX-3 | 🆕 | GitHub Actions workflow (lint → test → build) | Roadmap |

---
## 9 Cleanup / Deprecations (CL-*)
| ID | Status | Description | Source |
|----|--------|-------------|--------|
| CL-1 | ❌ | Remove old API routes under `frontend/src/api` | Migration |
| CL-2 | ❌ | Delete unused utility functions flagged in migration doc | Migration |
| CL-3 | ❌ | Drop deprecated React components not migrated | UI Components |

---
## 10 Timeline Snapshot
(Gantt lines retained in `DEVELOPMENT_ROADMAP.md`; this file is purely the backlog list.)

---
### How to use
1. Create a GitHub Issue for each **🆕** task (or mark existing PRs).  
2. Move tasks to **🔄 In-progress** when work starts; mark **✅** once merged.  
3. Keep this file updated _at minimum_ at the end of each sprint.
