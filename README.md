# AI Search Engine Visibility Tracker

A SaaS platform that helps brands monitor their visibility in AI-generated search results across multiple AI engines (ChatGPT, Gemini, Claude, Perplexity, etc.). Track keywords, monitor competitors, and get actionable insights on your AI search presence.

## Features

- **Multi-Engine Tracking** - Monitor visibility across GPT-4, Claude, and Gemini simultaneously
- **Keyword Management** - Add and track unlimited keywords for your brand
- **Competitor Monitoring** - Track competitor websites alongside your brand
- **Search Simulation** - Simulate AI searches and check if your site appears in results
- **Analytics Dashboard** - View visibility trends, engine performance, and historical data
- **Improvement Suggestions** - Get AI-powered recommendations to improve visibility
- **User Authentication** - Secure Supabase Auth with email/password
- **Row-Level Security** - Each user can only access their own data

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **AI Models**: 
  - Google Gemini (via Gemini API)
  - OpenAI GPT-4 (via Vercel AI Gateway)
  - Anthropic Claude (via Vercel AI Gateway)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Database Schema

### Tables

**profiles**
- `id` (UUID, PK) - User ID from Supabase Auth
- `email` (text) - User email
- `full_name` (text) - User name
- `created_at`, `updated_at` - Timestamps

**projects**
- `id` (UUID, PK)
- `user_id` (UUID, FK) - References profiles
- `name` (text) - Brand/project name
- `website_url` (text) - Brand website URL
- `description` (text)
- `created_at`, `updated_at`

**keywords**
- `id` (UUID, PK)
- `project_id` (UUID, FK) - References projects
- `keyword` (text) - Keyword to track
- `created_at`

**competitors**
- `id` (UUID, PK)
- `project_id` (UUID, FK) - References projects
- `name` (text) - Competitor name
- `website_url` (text) - Competitor website
- `created_at`

**search_results**
- `id` (UUID, PK)
- `project_id` (UUID, FK) - References projects
- `keyword_id` (UUID, FK) - References keywords
- `engine` (text) - 'gemini', 'gpt-4', 'claude'
- `found` (boolean) - Whether site appeared in results
- `position` (integer) - Position in results (if found)
- `citation_count` (integer) - Number of citations
- `full_response` (text) - Full AI response
- `created_at` - Timestamp for trend tracking

### RLS Policies

All tables have Row-Level Security enabled:
- Users can only read/write/delete their own projects and related data
- Keywords, competitors, and search results are protected through project ownership

## Setup Instructions

### Prerequisites

- Node.js 18+
- Supabase account
- Gemini API key (optional, for Gemini engine)

### 1. Environment Variables

Add these to your Vercel project (Vars section):

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
\`\`\`

### 2. Database Setup

Run all migrations in Supabase SQL Editor in order:

1. `supabase/migrations/001_init_schema.sql` - Initial profiles table
2. `supabase/migrations/002_ai_visibility_schema.sql` - Projects, keywords, competitors, search_results
3. `supabase/migrations/003_fix_policies_and_add_trigger.sql` - Auto-create profiles on signup
4. `supabase/migrations/004_fix_profiles_rls.sql` - Fix RLS policies for profile creation

### 3. Local Development

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

Visit `http://localhost:3000`

### 4. Deployment to Vercel

\`\`\`bash
# Push to GitHub
git push origin main

# Connect to Vercel and deploy
# Add environment variables in Vercel dashboard
# Deploy
\`\`\`

## How It Works

### Search Simulation Flow

1. **User creates a project** with their brand name and website URL
2. **User adds keywords** they want to track (e.g., "best AI tools")
3. **User clicks "Run AI Search"**
4. **App queries 3 AI engines**:
   - Sends keyword to GPT-4 via Vercel AI Gateway
   - Sends keyword to Claude via Vercel AI Gateway
   - Sends keyword to Gemini via Gemini API
5. **App checks if user's website appears** in each response
6. **Results are stored** with timestamp for trend tracking
7. **Dashboard shows**:
   - Visibility percentage per engine
   - Which engines found the site
   - Historical trends
   - Improvement suggestions

### Example: Tracking "AI Tools"

\`\`\`
Keyword: "AI Tools"
Your Site: https://myai.com

Results:
- GPT-4: ✅ Found (position 3)
- Claude: ✅ Found (position 5)
- Gemini: ❌ Not found

Suggestion: "Missing on Gemini - optimize content for Google's AI"
\`\`\`

## API Endpoints

### POST /api/search/simulate

Simulate AI searches for a keyword and store results.

**Request:**
\`\`\`json
{
  "projectId": "project-uuid",
  "keywordId": "keyword-uuid",
  "keyword": "best AI tools"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "results": [
    {
      "engine": "gpt-4",
      "found": true,
      "position": 3,
      "citationCount": 2
    },
    {
      "engine": "claude",
      "found": true,
      "position": 5,
      "citationCount": 1
    },
    {
      "engine": "gemini",
      "found": false,
      "position": null,
      "citationCount": 0
    }
  ]
}
\`\`\`

## User Flow

1. **Sign Up** - Create account with email/password
2. **Create Project** - Add your brand name and website
3. **Add Keywords** - Enter keywords to track
4. **Add Competitors** (optional) - Monitor competitor sites
5. **Run Searches** - Click "Run AI Search" to simulate searches
6. **View Analytics** - See visibility trends and engine performance
7. **Get Suggestions** - Receive recommendations to improve visibility

## Testing

### Manual Testing

1. Sign up with any email
2. Create a project (e.g., "My AI Startup", "https://myai.com")
3. Add keywords (e.g., "AI tools", "machine learning")
4. Click "Run AI Search Simulation"
5. View results in the analytics dashboard

### Test Data

The app uses live AI engines, so each search generates real results. No seed data needed.

## Troubleshooting

### "Failed to create user profile"
- Make sure all 4 migrations have been run in Supabase
- Check that the trigger `on_auth_user_created` exists in Database → Triggers

### "Model not found" error
- Verify Vercel AI Gateway models are correct:
  - `openai/gpt-4.1`
  - `anthropic/claude-sonnet-4`
  - `google/gemini-2.5-flash`

### Search results not showing
- Check browser console for errors (F12)
- Verify Supabase environment variables are set
- Ensure project and keyword exist in database

## Deployment Checklist

- [ ] All 4 database migrations run in Supabase
- [ ] Environment variables added to Vercel
- [ ] Supabase RLS policies verified
- [ ] Test signup and project creation
- [ ] Test search simulation
- [ ] Verify analytics dashboard loads
- [ ] Deploy to Vercel

## Future Enhancements

- Real-time search result notifications
- Export analytics to CSV/PDF
- Scheduled automated searches
- Slack/email alerts for visibility changes
- Custom AI engine integrations
- Advanced competitor analysis
- SEO recommendations engine

## License

MIT

