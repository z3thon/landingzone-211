# Landing Zone

A multi-community SaaS platform that connects Discord communities with professional marketplace functionality.

## Features

- **Multi-Tenancy:** Each Discord community operates independently
- **Shared Profiles:** Users control skill visibility per-community
- **Cross-Community Ratings:** Reviews shared across all communities
- **Token-Based Payments:** USD-based tokens with per-minute billing
- **Discord Integration:** Bot-based verification and voice channel tracking
- **Professional Marketplace:** Projects, skills, certifications, rates, endorsements, reviews

## Tech Stack

- **Frontend:** Next.js 16.0.10 (App Router), TypeScript, Tailwind CSS
- **UI Framework:** Glassmorphic design system (Framer Motion)
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Authentication:** Supabase Auth + Discord OAuth
- **Search:** PostgreSQL pg_trgm extension for fuzzy search
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. Apply database migrations:
```bash
# Use Supabase CLI or dashboard to apply migrations
# Migration file: supabase/migrations/001_initial_schema.sql
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # React components
├── lib/                    # Utility functions
│   ├── supabase/          # Supabase client utilities
│   └── auth.ts            # Authentication utilities
├── supabase/
│   └── migrations/        # Database migrations
├── styles/                 # Global styles
├── config/                 # Configuration files
└── types/                  # TypeScript type definitions
```

## Database Schema

See `supabase/migrations/001_initial_schema.sql` for the complete database schema.

Key tables:
- `profiles` - User profiles
- `communities` - Discord communities
- `projects` - Projects/job boards
- `skills`, `certifications`, `rates` - Profile attributes
- `token_balances`, `escrow_holdings` - Payment system
- `call_sessions`, `billing_events` - Voice call tracking

## Development

See `MILESTONES.md` for the development roadmap and milestones.

## License

Private - All rights reserved


