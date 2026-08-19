# Waypoint

A personal job application tracker with AI-powered content generation and Gmail integration.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

### Application Tracking
- Track job applications with status updates (Saved, Applied, Phone Screen, Interview, Offer, Rejected, Withdrawn)
- Store job descriptions, company info, and application URLs
- Add contacts and notes for each application
- Visual dashboard with statistics and charts

### AI-Powered Content Generation
- Generate personalized cover letters based on your profile and job descriptions
- Create custom responses to application questions
- Refine and iterate on generated content
- Uses GPT-4o-mini for fast, cost-effective generation

### Profile Management
- Store your work experience, education, skills, projects, and stories
- Upload and parse PDF resumes for AI context
- STAR format story templates for behavioral questions
- Preview what context the AI sees when generating content

### Gmail Integration
- Connect your Gmail account via OAuth
- Automatically detect job application emails
- AI classifies and extracts company, role, and status from emails
- Creates or updates applications based on email content
- Real-time sync progress with status updates

### Document Management
- Save generated cover letters and Q&A responses
- Version history for all documents
- Edit and refine saved documents

## Tech Stack

- **Frontend:** React, TypeScript, Vite, CSS Modules, React Query
- **Backend:** Node.js, Express, TypeScript
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI GPT-4o-mini
- **Email:** Gmail API with OAuth 2.0

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- OpenAI API key (for AI features)
- Google Cloud project (for Gmail integration)

### Installation

```bash
# Clone the repository
git clone https://github.com/chetangoel01/waypoint.git
cd waypoint

# Install dependencies
npm install

# Start development servers
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
# Application environment (development | production)
NODE_ENV=development

# Server configuration
PORT=3001
SERVER_URL=http://localhost:3001
CLIENT_URL=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Security - Encryption key for sensitive data (at least 32 characters)
# Generate with: openssl rand -base64 32
ENCRYPTION_KEY=your-encryption-key-here

# OpenAI API Key (can also be set in Settings)
OPENAI_API_KEY=sk-your-key-here

# Logging level (debug | info | warn | error)
LOG_LEVEL=info
```
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
read_lints

### Gmail Integration Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **Gmail API**
4. Configure OAuth consent screen (External, add `gmail.readonly` scope)
5. Create OAuth credentials (Web application)
6. Add redirect URI: `http://localhost:3001/api/email/callback`
7. Enter your Client ID and Client Secret in Settings → Email Integration

## Project Structure

```
waypoint/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # React Query hooks
│   │   ├── services/       # API client
│   │   ├── tests/          # Test setup
│   │   └── types/          # TypeScript types
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, rate-limit, validation
│   │   ├── db/             # Database schema & init
│   │   ├── tests/          # Test suite
│   │   └── types/          # TypeScript types
│   └── package.json
├── .github/
│   └── workflows/          # CI/CD pipelines
└── package.json            # Root package.json
```

## API Endpoints

### Applications
- `GET /api/applications` - List all applications
- `GET /api/applications/:id` - Get single application
- `POST /api/applications` - Create application
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application

### Profile
- `GET /api/profile` - Get profile
- `PUT /api/profile` - Update profile
- `GET /api/experience` - List work experience
- `GET /api/education` - List education
- `GET /api/skills` - List skills (grouped by category)
- `GET /api/projects` - List projects
- `GET /api/stories` - List stories

### AI Generation
- `POST /api/generate/cover-letter` - Generate cover letter
- `POST /api/generate/custom-response` - Generate Q&A response
- `POST /api/generate/refine` - Refine existing content

### Email Integration
- `GET /api/email/status` - Check Gmail connection status
- `GET /api/email/auth-url` - Get OAuth authorization URL
- `POST /api/email/sync` - Trigger email sync
- `GET /api/email/sync-stream` - SSE endpoint for sync progress

### Documents
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get document with versions
- `POST /api/documents` - Create document
- `POST /api/documents/:id/versions` - Add new version

## Scripts

```bash
npm run dev          # Start both client and server in development
npm run dev:client   # Start only the frontend
npm run dev:server   # Start only the backend
npm run build        # Build all packages
npm run build:prod   # Build for production
npm run start:prod   # Start production server
```

## Testing

```bash
# Run all workspace tests
npm run test

# Server tests only
npm run test --workspace=server

# Client tests only
npm run test --workspace=client

# Run tests in watch mode
npm run test --workspace=server -- --watch
```

### Test Coverage

The test suite includes comprehensive coverage for:

- **Middleware Tests**: Authentication, rate limiting, validation, error handling
- **Route Tests**: All API endpoints with success and error scenarios
- **Schema Validation**: Zod schema validation for all request/response types
- **Service Layer**: Business logic and data access layer tests
- **Edge Cases**: Error handling, validation failures, not found scenarios

### Test Structure

```
server/src/tests/
├── middleware/          # Auth, rate-limit, validate, response tests
├── routes/              # API endpoint tests (applications, documents, etc.)
├── schemas.test.ts      # Schema validation tests
├── db-schema.test.ts    # Database schema and RLS tests
└── setup.ts             # Test environment configuration
```

### Database Test Suite

The server DB tests connect directly to Postgres to validate schema + RLS.
Set `DATABASE_URL` in `.env` (see `.env.example`) before running.
If `DATABASE_URL` is missing, the DB tests are skipped.

Server tests also load `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` from `.env`
so the Express app can initialize without exiting.

### CI/CD

The project uses GitHub Actions for continuous integration:

- **Automated Testing**: Runs on every push and pull request
- **Multi-Node Testing**: Tests against Node.js 20 and 22
- **Build Verification**: Ensures both client and server build successfully
- **Docker Smoke Tests**: Validates Docker container builds and health checks

**Required GitHub Secrets** (for CI):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key
- `ENCRYPTION_KEY` - Encryption key (at least 32 characters)
- `VITE_SUPABASE_URL` - Supabase URL for client build
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key for client build

View CI status at: https://github.com/chetangoel01/waypoint/actions

## Production Deployment

### Docker (Recommended)

The easiest way to deploy Waypoint is with Docker:

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t waypoint .
docker run -d -p 3001:3001 -v ./data:/app/data -e OPENAI_API_KEY=sk-your-key waypoint
```

### Manual Deployment

```bash
# Install dependencies
npm ci

# Build for production
npm run build:prod

# Start production server
npm run start:prod
```

### Security Considerations

- Never commit `.env` files to version control
- Use strong, unique API keys in production
- Configure `CLIENT_URL` and `SERVER_URL` for your domain
- Rate limiting is enabled by default (100 req/15min, 10 AI req/min)
- Security headers are added via Helmet middleware

## Design System

- **Fonts:** Source Serif 4 (headings), DM Sans (body)
- **Primary Accent:** Terracotta (`#c45d3a`)
- **Status Colors:**
  - Gray: Saved
  - Blue (Sky): Applied, Phone Screen
  - Amber (Honey): Interview
  - Green (Sage): Offer
  - Red (Rose): Rejected, Withdrawn

## License

MIT
