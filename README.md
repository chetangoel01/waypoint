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
- **Database:** SQLite (better-sqlite3)
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

# Initialize the database
npm run db:init

# Start development servers
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Environment Variables

Create a `.env` file in the project root:

```env
# OpenAI API Key (optional - can also be set in Settings)
OPENAI_API_KEY=sk-your-key-here

# Database path (optional - defaults to ./server/data/app.db)
DATABASE_PATH=./server/data/app.db
```

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
│   │   └── types/          # TypeScript types
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── db/             # Database schema & init
│   │   └── types/          # TypeScript types
│   └── package.json
├── electron/               # Electron shell (WIP)
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
npm run db:init      # Initialize/migrate database
```

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
