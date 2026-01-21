# Waypoint - Architecture & Development Guide

## Project Overview

**Name**: Waypoint
**Description**: A personal job application tracker with AI-powered content generation and Gmail integration.
**Type**: Monorepo (npm workspaces) containing Client (React) and Server (Express).
**Primary Data Store**: Supabase (PostgreSQL) with Row Level Security (RLS).

---

## Project Structure

```
├── client/           # Vite + React frontend
│   └── src/          # Components, hooks, services, types
├── server/           # Express API backend
│   └── src/          # Routes, services, db, middleware, types
├── docs/             # Documentation
└── tsconfig.base.json # Shared TypeScript settings
```

---

## Tech Stack

### Frontend (`/client`)
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **State Management**: React Query (@tanstack/react-query)
- **Styling**: CSS Modules (`*.module.css`)
- **Routing**: React Router DOM v6+
- **HTTP Client**: Native `fetch` wrapper (`client/src/services/api.ts`)

### Backend (`/server`)
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL via `@supabase/supabase-js`
- **Authentication**: Bearer Token (Supabase Session) -> Scoped DB Client
- **AI**: OpenAI API (GPT-4o-mini)
- **Email**: Gmail API (googleapis)

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server in watch mode |
| `npm run dev:client` | Start only the client |
| `npm run dev:server` | Start only the server |
| `npm run build` | Build all workspaces |
| `npm run build:prod` | Build with `NODE_ENV=production` |
| `npm run start:prod` | Start compiled server |
| `npm run lint` | Run ESLint across workspaces |
| `npm run typecheck` | Run TypeScript checks |
| `npm run test` | Run tests |

---

## Architecture & Control Flow

### Authentication & Data Security

The app uses a **Scoped Client** pattern for security.

**Middleware**: `requireAuth` (`server/src/middleware/auth.ts`)

**Flow**:
1. Extracts `Bearer` token from `Authorization` header
2. Verifies token via `supabase.auth.getUser(token)`
3. Creates a *new* `SupabaseClient` instance scoped to user's auth context
4. Attaches `req.supabase` and `req.user` to the request

**Important**: All service calls must use `req.supabase` (not a global admin client) to ensure Row Level Security (RLS) policies are enforced.

### API Request Lifecycle

```
Client Component -> React Query -> api.ts -> Express Route -> requireAuth -> Service (scoped DB) -> Response
```

**Error Handling**:
- Backend uses `ApiError` class
- `asyncHandler` wrapper catches promise rejections
- Global error middleware sanitizes errors:
  - **Dev**: Returns full error stack
  - **Prod**: Returns generic messages unless error matches "safe" whitelist

---

## Key Workflows

### Application Management (CRUD)
- **Frontend**: `useCreateApplication` -> `applicationsApi.create`
- **Backend**: `POST /api/applications`
- **Service**: `applicationsService.create(req.supabase, data)`
- RLS policy ensures data isolation per user

### AI Content Generation
- **Frontend**: `useAi.generateCoverLetter` -> `generateApi.coverLetter`
- **Backend**: `POST /api/generate/cover-letter`
- **Service**: `aiService.generateCoverLetter`
  1. Fetches Profile, Experience, Skills, and Application details
  2. Combines system prompt with JSON-structured context
  3. Calls OpenAI `gpt-4o-mini`
  4. Returns generated text + metadata

### Gmail Synchronization
- **Trigger**: User initiates via `POST /api/email/sync`
- **Service**: `emailSyncService.syncEmails`
  1. Fetches recent emails via Gmail API
  2. Checks `processed_emails` table to skip duplicates
  3. Sends to OpenAI for classification (job-related, company, role, status)
  4. Updates existing applications or creates new ones
  5. Logs results in `processed_emails`

---

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/applications` | GET, POST | List/create applications |
| `/api/applications/:id` | GET, PUT, DELETE | Single application CRUD |
| `/api/generate/cover-letter` | POST | Generate cover letter |
| `/api/email/sync` | POST | Sync Gmail |
| `/api/email/auth-url` | GET | Get Gmail OAuth URL |
| `/api/profile` | GET, PUT | User profile |

---

## Data Models

All tables have `user_id` with RLS policies for automatic data isolation.

```
UserProfile ||--o{ Application : owns
Application ||--o{ Document : contains
Application ||--o{ ProcessedEmail : generated_from
Document ||--o{ DocumentVersion : history
```

---

## Key Files

### Backend (`server/src`)
- `middleware/auth.ts` - Supabase client scoping (critical)
- `services/ai.ts` - Context assembly & OpenAI calls
- `services/email-processor.ts` - Email classification logic
- `db/supabase-schema.sql` - Database schema

### Frontend (`client/src`)
- `services/api.ts` - Auth header injection, session refresh
- `hooks/useAi.ts` - AI generation mutations

---

## Coding Standards

- TypeScript strict mode enabled
- ESLint configured per workspace
- Conventional Commits (e.g., `feat(ui):`, `fix(lint):`)
- React components in PascalCase
- Hooks prefixed with `use`

---

## Environment Variables

Required in `.env`:
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `ENCRYPTION_KEY` (required in production)

Optional:
- `OPENAI_API_KEY` (users can provide their own)
- `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET` (for email integration)

See `.env.example` for full list.
