# Daily Digest - Technical Architecture

## Current Architecture

### Frontend
- **Framework**: Next.js 13+ (App Router) with TypeScript
- **State Management**: React Query + Zustand
- **Routing**: Next.js App Router
- **UI Components**: shadcn/ui + Tailwind CSS
- **AI Integration**: Vercel `ai-sdk` for streaming responses and chat interfaces
- **Build Tool**: Turborepo for monorepo management
- **Styling**: Tailwind CSS + CSS Modules

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **Database**: Supabase PostgreSQL with pgvector
- **Authentication**: Supabase Auth
- **AI Processing**: LangChain.js for:
  - Document loading & chunking
  - Text embeddings (OpenAI)
  - Vector similarity search
  - RAG (Retrieval-Augmented Generation) pipeline
- **Storage**: Supabase Storage for file uploads
- **Cron Jobs**: Vercel Cron Jobs for scheduled tasks

### Key Components

#### Frontend Structure (Next.js App)
```
apps/web/
├── app/                  # App Router pages and layouts
│   ├── (auth)/          # Authentication routes
│   ├── dashboard/       # Authenticated user dashboard
│   └── api/             # API routes
├── components/          # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   └── chat/            # AI chat components
├── lib/
│   ├── ai/              # AI client setup (ai-sdk)
│   └── supabase/        # Supabase client
└── types/               # TypeScript types
```

#### Existing UI Components
- **Layout**: Box, FlexBox, GridBox
- **Navigation**: Header, TopNav, Tabs
- **Inputs**: Button, Input, Select
- **Data Display**: Table, Tag, SummaryCard
- **Feedback**: Modal
- **Typography**: Text

## Target Architecture

### Monorepo Structure
```
/
├── apps/
│   ├── web/              # Next.js web application (ai-sdk)
│   └── cron/             # Cron jobs and background tasks (LangChain.js)
│
├── packages/
│   ├── core/             # Shared business logic and types
│   ├── ui/               # Reusable UI components
│   └── llm/              # LLM integration utilities (powered by `ai` SDK)
│
└── docs/                 # Documentation
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **State Management**: React Query + Zustand
- **Styling**: Tailwind CSS + CSS Modules
- **Component Library**: Custom built on top of Radix UI
- **Form Handling**: React Hook Form + Zod
- **Data Fetching**: React Query
- **Authentication**: NextAuth.js with Supabase

#### Backend
- **Framework**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: tRPC for type-safe APIs
- **Background Jobs**: Inngest for background processing
- **LLM Client**: [`ai` SDK](https://ai-sdk.dev) (Vercel) for OpenAI/Anthropic calls

#### Infrastructure
- **Hosting**: Vercel (Web) + Supabase (Database/Auth)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry + LogRocket
- **Analytics**: PostHog

## Component Architecture

### UI Component Library

#### Core Principles
1. **Composition**: Build complex UIs from simple, reusable components
2. **Accessibility**: WCAG 2.1 AA compliance
3. **Performance**: Code splitting and lazy loading
4. **Theming**: Support for light/dark mode and custom themes
5. **Type Safety**: Full TypeScript support

#### Component Categories

1. **Layout**
   - `Box` - Basic building block
   - `Flex` - Flexbox container
   - `Grid` - CSS Grid container
   - `Container` - Responsive container
   - `Stack` - Vertical/horizontal stack

2. **Typography**
   - `Text` - Base text component
   - `Heading` - Semantic headings
   - `Label` - Form labels
   - `Code` - Inline code blocks

3. **Forms**
   - `Button` - Various button styles
   - `Input` - Text input
   - `Select` - Dropdown selection
   - `Checkbox` - Toggle input
   - `Radio` - Radio button
   - `Switch` - Toggle switch
   - `Form` - Form wrapper with validation

4. **Navigation**
   - `Link` - Client-side navigation
   - `Tabs` - Tab navigation
   - `Breadcrumbs` - Navigation trail
   - `Pagination` - Page navigation

5. **Feedback**
   - `Alert` - Status messages
   - `Toast` - Notification toasts
   - `Dialog` - Modal dialogs
   - `Tooltip` - Contextual help
   - `Progress` - Loading indicators

6. **Data Display**
   - `Table` - Data tables
   - `Card` - Content container
   - `Badge` - Status indicators
   - `Avatar` - User avatars
   - `Tag` - Categorical labels

## AI/ML Architecture

#### Frontend (ai-sdk)
- Streaming chat interfaces
- Real-time UI updates
- Client-side state management for AI interactions
- Optimistic UI updates

#### Backend (LangChain.js)
- **Document Processing**:
  - Text extraction from various sources (newsletters, RSS, etc.)
  - Text cleaning and chunking
  - Embedding generation
- **Vector Database**:
  - Supabase pgvector for storing embeddings
  - Efficient similarity search
- **RAG Pipeline**:
  - Context retrieval using vector similarity
  - Prompt engineering for summarization
  - Response generation with context
- **Scheduled Processing**:
  - Daily digest generation
  - Batch processing of content updates

## State Management

### Client State
- **Local State**: React `useState`
- **Global UI State**: Zustand
- **Server State**: React Query
- **Form State**: React Hook Form

### Server State
- **Data Fetching**: React Query
- **Mutations**: Optimistic updates
- **Real-time**: Supabase Realtime

## API Layer

### REST API (Legacy)
- Base URL: `/api`
- Authentication: Bearer token
- Error handling: Standardized error responses

### tRPC (Future)
- Type-safe API endpoints
- Automatic type inference
- Batching support
- Subscriptions for real-time updates

## Authentication & Authorization

### Authentication Flow
1. User signs in with email/password or OAuth
2. JWT token is stored in HTTP-only cookie
3. Token is verified on each request
4. User session is managed by NextAuth.js

### Authorization
- Role-based access control (RBAC)
- Row-level security in Supabase
- Route guards for protected routes

## Data Layer

### Database Schema
- Users & Profiles
- Content Sources
- Digest Entries
- User Preferences
- API Keys

### Data Access
- **Database Client**: Supabase Client
- **Type Safety**: Generated types from database schema
- **Migrations**: Version-controlled database migrations

## Performance Optimization

### Frontend
- Code splitting with dynamic imports
- Image optimization
- Bundle analysis
- Performance monitoring

### Backend
- Edge caching
- Request deduplication
- Database query optimization
- Connection pooling

## Testing Strategy

### Unit Tests
- Components: React Testing Library
- Hooks: React Hooks Testing Library
- Utils: Jest

### Integration Tests
- API endpoints: Jest + Supertest
- Component interactions: React Testing Library

### E2E Tests
- Cypress for critical user flows
- Visual regression testing

## Monitoring & Observability

### Error Tracking
- Frontend: Sentry
- Backend: Sentry
- Logs: LogRocket

### Performance Monitoring
- Web Vitals
- API response times
- Database query performance

## Deployment

### Environments
- Development
- Staging
- Production

### CI/CD Pipeline
1. Linting & Type checking
2. Unit tests
3. Build artifacts
4. E2E tests
5. Deployment to staging
6. Manual approval for production

## Future Considerations

### Scalability
- Database sharding
- CDN integration
- Edge functions

### Developer Experience
- Storybook for component development
- Better TypeScript tooling
- Automated code generation

### Features
- Offline support with Service Workers
- Web Push Notifications
- Progressive Web App (PWA) support
