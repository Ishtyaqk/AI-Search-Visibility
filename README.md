# AI Evaluation SaaS Dashboard

A full-stack SaaS application for managing AI model evaluations with Supabase authentication and real-time analytics.

## Features

- User authentication with Supabase Auth
- Create and manage evaluation configurations
- Ingest evaluation data via API
- Real-time analytics dashboard
- User profile management
- Row-level security for data privacy

## Setup

### Prerequisites

- Node.js 18+
- Supabase account

### Environment Variables

Create a `.env.local` file with:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
\`\`\`

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase:
   - Create a new Supabase project
   - Run the migration: `supabase/migrations/001_init_schema.sql`
4. Seed test data: `npm run seed`
5. Start development: `npm run dev`

## Test Credentials

After running the seed script:

- Email: `test@example.com`
- Password: `Test123!@#`

## API Endpoints

### POST /api/evals/ingest

Ingest evaluation data.

\`\`\`bash
curl -X POST http://localhost:3000/api/evals/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "configId": "config-uuid",
    "input": "test input",
    "output": "test output",
    "score": 0.95
  }'
\`\`\`

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## License

MIT
