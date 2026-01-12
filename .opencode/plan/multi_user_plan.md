# Multi-User Support Implementation Plan

## Overview

This plan outlines the steps to convert Waypoint from a single-user application to a multi-user application with Google OAuth authentication.

**Key Decisions:**
- Authentication: Google OAuth via Supabase
- Existing data: Will be orphaned (test data only)
- Gmail tokens: Dedicated `oauth_tokens` table for security

---

## Phase 1: Database Migration

### 1.1 Run Existing Migration

Execute `server/src/db/multi-user-schema.sql` in Supabase SQL Editor.

This migration:
- Adds `user_id UUID REFERENCES auth.users(id)` to all tables
- Enables Row Level Security (RLS) on all tables
- Creates RLS policies for user data isolation
- Removes singleton constraint on `profile` table
- Updates `settings` primary key to `(user_id, key)`

### 1.2 Create OAuth Tokens Table

Create a new dedicated table for storing OAuth credentials securely:

```sql
-- OAuth tokens table for secure credential storage
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,  -- 'google', 'github', etc.
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tokens
CREATE POLICY "Users can view own tokens"
  ON oauth_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens"
  ON oauth_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens"
  ON oauth_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens"
  ON oauth_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_oauth_tokens_user_provider ON oauth_tokens(user_id, provider);
```

### 1.3 Configure Google OAuth in Supabase

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Google provider
3. In Google Cloud Console:
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
   - Configure OAuth consent screen
4. Copy Client ID and Client Secret to Supabase

---

## Phase 2: Server Changes

### 2.1 Apply Auth Middleware to Routes

**File:** `server/src/routes/index.ts`

Add `requireAuth` middleware to all API routes:

```typescript
import { requireAuth } from '../middleware/auth.js';

// Apply to all routes
router.use('/applications', requireAuth, applicationsRouter);
router.use('/profile', requireAuth, profileRouter);
router.use('/documents', requireAuth, documentsRouter);
router.use('/settings', requireAuth, settingsRouter);
router.use('/email', requireAuth, emailRouter);
router.use('/generate', requireAuth, generateRouter);
```

### 2.2 Refactor Services to Accept Supabase Client

All services need to be refactored to accept a user-scoped Supabase client instead of importing the global client.

**Pattern Change:**

```typescript
// BEFORE (global client - bypasses RLS)
import supabase from '../db/index.js';

export async function getApplications() {
  const { data, error } = await supabase
    .from('applications')
    .select('*');
  return data;
}

// AFTER (user-scoped client - respects RLS)
import { SupabaseClient } from '@supabase/supabase-js';

export async function getApplications(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('applications')
    .select('*');
  // RLS automatically filters to user's data
  return data;
}
```

**Files to Update:**

| File | Key Changes |
|------|-------------|
| `services/applications.ts` | Add `supabase` parameter to all functions |
| `services/profile.ts` | Add `supabase` parameter, remove singleton assumption |
| `services/documents.ts` | Add `supabase` parameter to all functions |
| `services/settings.ts` | Add `supabase` parameter, queries now use `user_id` in key |
| `services/email-sync.ts` | Add `supabase` parameter to all functions |

### 2.3 Update Routes to Pass Client

Each route handler needs to pass `req.supabase` to service functions:

```typescript
// BEFORE
router.get('/', async (req, res) => {
  const applications = await getApplications();
  res.json(applications);
});

// AFTER
router.get('/', async (req, res) => {
  const applications = await getApplications(req.supabase);
  res.json(applications);
});
```

**Files to Update:**
- `routes/applications.ts`
- `routes/profile.ts`
- `routes/documents.ts`
- `routes/settings.ts`
- `routes/email.ts`
- `routes/generate.ts`

### 2.4 Update Gmail OAuth Service

**File:** `services/gmail-oauth.ts`

Refactor to use `oauth_tokens` table instead of settings:

```typescript
export async function getGmailTokens(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();
  
  return data;
}

export async function saveGmailTokens(
  supabase: SupabaseClient,
  userId: string,
  tokens: { access_token: string; refresh_token?: string; expires_at?: Date; scopes?: string[] }
) {
  const { data, error } = await supabase
    .from('oauth_tokens')
    .upsert({
      user_id: userId,
      provider: 'google',
      ...tokens,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,provider'
    });
  
  return data;
}
```

### 2.5 Update TypeScript Types

**File:** `server/src/types/index.ts`

Add `user_id` to all entity types:

```typescript
export interface Application {
  id: number;
  user_id: string;  // Add this
  // ... rest of fields
}

// Add new type for OAuth tokens
export interface OAuthToken {
  id: string;
  user_id: string;
  provider: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  scopes?: string[];
  created_at: string;
  updated_at: string;
}
```

---

## Phase 3: Client Changes

### 3.1 Integrate AuthProvider

**File:** `client/src/main.tsx`

```typescript
import { AuthProvider } from './components/AuthProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

### 3.2 Add Auth Guard to App

**File:** `client/src/App.tsx`

```typescript
import { useAuth } from './components/AuthProvider';
import Login from './components/Login';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    // ... existing app content
  );
}
```

### 3.3 Update Login Component for Google OAuth

**File:** `client/src/components/Login.tsx`

Update to use Google OAuth instead of email/password:

```typescript
import { supabase } from '../services/supabase';

export default function Login() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        scopes: 'email profile'
      }
    });
    
    if (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="login-container">
      <h1>Welcome to Waypoint</h1>
      <button onClick={handleGoogleLogin}>
        Sign in with Google
      </button>
    </div>
  );
}
```

### 3.4 Add Auth Header to API Calls

**File:** `client/src/services/api.ts`

```typescript
import { supabase } from './supabase';

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && {
      'Authorization': `Bearer ${session.access_token}`
    })
  };
}

// Update all fetch calls to use auth headers
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}
```

---

## Phase 4: Gmail OAuth Integration (Per-User)

### 4.1 Update Gmail OAuth Flow

The existing Gmail OAuth flow needs to be updated to store tokens per-user:

1. **Initiate OAuth** - Include user ID in state parameter
2. **Handle Callback** - Store tokens in `oauth_tokens` table with user association
3. **Token Refresh** - Refresh tokens for specific user

### 4.2 Update Email Sync

Email sync operations need to:
1. Retrieve user's Gmail tokens from `oauth_tokens` table
2. Use user-scoped Supabase client for all database operations
3. Handle token refresh and storage per-user

---

## Implementation Order

### Step 1: Database (Prerequisites)
1. [ ] Run `multi-user-schema.sql` migration
2. [ ] Create `oauth_tokens` table
3. [ ] Configure Google OAuth in Supabase Dashboard

### Step 2: Server - Auth Middleware
4. [ ] Update `routes/index.ts` to apply `requireAuth` middleware

### Step 3: Server - Service Refactoring
5. [ ] Refactor `services/applications.ts`
6. [ ] Refactor `services/profile.ts`
7. [ ] Refactor `services/documents.ts`
8. [ ] Refactor `services/settings.ts`
9. [ ] Refactor `services/email-sync.ts`
10. [ ] Refactor `services/gmail-oauth.ts` for `oauth_tokens` table

### Step 4: Server - Route Updates
11. [ ] Update `routes/applications.ts`
12. [ ] Update `routes/profile.ts`
13. [ ] Update `routes/documents.ts`
14. [ ] Update `routes/settings.ts`
15. [ ] Update `routes/email.ts`
16. [ ] Update `routes/generate.ts`

### Step 5: Server - Types
17. [ ] Update `types/index.ts` with `user_id` fields

### Step 6: Client - Authentication
18. [ ] Update `main.tsx` with AuthProvider
19. [ ] Update `App.tsx` with auth guard
20. [ ] Update `Login.tsx` for Google OAuth
21. [ ] Update `services/api.ts` with auth headers

### Step 7: Testing
22. [ ] Test Google OAuth login flow
23. [ ] Test data isolation between users
24. [ ] Test Gmail OAuth per-user
25. [ ] Test all CRUD operations with auth

---

## Files Summary

### Database
- `server/src/db/multi-user-schema.sql` - Run existing migration
- `server/src/db/oauth-tokens-schema.sql` - Create new file

### Server (14 files)
- `server/src/routes/index.ts` - Add auth middleware
- `server/src/routes/applications.ts` - Pass client to services
- `server/src/routes/profile.ts` - Pass client to services
- `server/src/routes/documents.ts` - Pass client to services
- `server/src/routes/settings.ts` - Pass client to services
- `server/src/routes/email.ts` - Pass client to services
- `server/src/routes/generate.ts` - Pass client to services
- `server/src/services/applications.ts` - Accept client parameter
- `server/src/services/profile.ts` - Accept client parameter
- `server/src/services/documents.ts` - Accept client parameter
- `server/src/services/settings.ts` - Accept client parameter
- `server/src/services/email-sync.ts` - Accept client parameter
- `server/src/services/gmail-oauth.ts` - Use oauth_tokens table
- `server/src/types/index.ts` - Add user_id to types

### Client (4 files)
- `client/src/main.tsx` - Add AuthProvider
- `client/src/App.tsx` - Add auth guard
- `client/src/components/Login.tsx` - Google OAuth
- `client/src/services/api.ts` - Auth headers

---

## Notes

- The `requireAuth` middleware already exists at `server/src/middleware/auth.ts`
- The `AuthProvider` component already exists at `client/src/components/AuthProvider.tsx`
- Existing test data will be orphaned (NULL user_id) and not visible after migration
- RLS policies will automatically filter data by authenticated user
