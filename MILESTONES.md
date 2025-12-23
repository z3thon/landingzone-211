# Landing Zone - Development Milestones

## Overview

Landing Zone is a **multi-community SaaS platform** that connects Discord communities with professional marketplace functionality. Each community operates independently with its own job boards, talent pools, and transaction settings, while users can participate across multiple communities.

## Architecture Principles

- **Multi-Tenancy:** Each Discord community = separate tenant with isolated data
- **Shared Profiles:** Users have one profile but control skill visibility per-community
- **Cross-Community Ratings:** Reviews/ratings are shared across all communities
- **Token-Based Payments:** USD-based tokens, per-minute billing, 14-day escrow
- **Discord Integration:** Bot-based verification and voice channel tracking
- **Glassmorphic UI:** Apple-inspired glassmorphic design system

---

## Milestone 1: Foundation & Core Schema ✅

### Database Schema (Supabase)

**New Tables Required:**
- `communities` - Discord communities/tenants
- `community_members` - User membership in communities
- `community_skill_visibility` - Per-community skill visibility settings
- `tokens` / `token_transactions` - Token balance and transaction history
- `retainers` - User token balances (retainers)
- `call_sessions` - Voice call sessions with billing
- `billing_events` - Per-minute billing events
- `escrow_holdings` - Tokens held in escrow (14-day hold)
- `payouts` - Final payouts to coaches after escrow
- `discord_users` - Discord user verification
- `voice_channels` - Discord voice channels
- `sessions` - Actual call sessions in Discord

**Updated Tables:**
- `profiles` - Add Discord user FK, community-agnostic
- `projects` - Add community FK (projects are community-specific)
- `skills` - Add community visibility settings
- `rates` - Community-specific rates possible

### Key Features
- [ ] Create all database tables with proper relationships
- [ ] Set up Row Level Security (RLS) policies
- [ ] Multi-community isolation via RLS
- [ ] Foreign key indexes and search indexes
- [ ] Full-text search setup (pg_trgm for fuzzy search)

**Deliverables:**
- Complete Supabase migration files
- RLS policies for multi-tenancy
- Database documentation

---

## Milestone 2: Authentication & User Management 🔐

### Supabase Auth Integration
- [ ] User registration/login flows
- [ ] Profile creation workflow
- [ ] Email verification
- [ ] Password reset

### Discord Verification
- [ ] Discord OAuth integration
- [ ] Link Discord account to profile
- [ ] Verify Discord user identity
- [ ] Display Discord username in profile

### Profile Management
- [ ] Create/edit profile
- [ ] Upload profile picture (Supabase Storage)
- [ ] Manage basic info (name, bio, location, etc.)
- [ ] Privacy settings management

**Deliverables:**
- Auth pages (login, register, verify)
- Profile creation/edit pages
- Discord OAuth flow
- Profile API routes

---

## Milestone 3: Community System 🏘️

### Community Management
- [ ] Community creation (Discord server owners only)
- [ ] Community settings (name, description, logo)
- [ ] Transaction fee configuration (% community keeps)
- [ ] Community metrics dashboard
- [ ] Discord bot connection/authorization

### Community Membership
- [ ] Join/leave communities
- [ ] View community members
- [ ] Community-specific profile visibility
- [ ] Community admin roles

### Skill Visibility Per-Community
- [ ] Select which skills to show in each community
- [ ] Community-specific skill display
- [ ] Skill visibility management UI

**Deliverables:**
- Community creation/management pages
- Community membership UI
- Skill visibility controls
- Community API routes

---

## Milestone 4: Token & Payment System 💰

### Token Management (MVP - Simple System)
- [ ] Token balance display
- [ ] Simple token addition (mock/placeholder)
- [ ] Token transaction history
- [ ] Retainer balance tracking

### Escrow System
- [ ] Hold tokens in escrow after calls
- [ ] 14-day escrow period
- [ ] Escrow release workflow
- [ ] Escrow dispute handling (community owner)

### Fee Calculation
- [ ] Landing Zone 6% fee
- [ ] Community owner configurable fee
- [ ] Coach payout calculation
- [ ] Transaction breakdown display

**Future (Post-MVP):**
- Stripe integration for token purchase
- Real USD conversion
- International currency support
- Refund system (inactive >1 year)

**Deliverables:**
- Token balance UI
- Escrow management system
- Fee calculation logic
- Transaction history pages

---

## Milestone 5: Voice Calls & Billing System 📞

### Voice Channel Integration
- [ ] Track Discord voice channels
- [ ] Create voice channel records
- [ ] Link channels to communities
- [ ] Channel settings (billing rate, coach info)

### Call Session Tracking
- [ ] Start call session (Discord bot event)
- [ ] Track call duration
- [ ] End call session
- [ ] Session history

### Per-Minute Billing
- [ ] 30-second grace period
- [ ] Per-minute billing after grace period
- [ ] Real-time token deduction from retainer
- [ ] Low balance warnings
- [ ] Auto-kick when funds exhausted
- [ ] Billing rate display before joining

### Coach Discounts
- [ ] Coach can apply discounts
- [ ] Partial refund to client
- [ ] Discount history

**Deliverables:**
- Voice channel management
- Call session tracking
- Real-time billing system
- Billing API endpoints

---

## Milestone 6: Projects & Job Boards 📋

### Project Management
- [ ] Create projects (community-specific)
- [ ] Project outlines with rich text
- [ ] Project files/URLs attachments
- [ ] Project status management
- [ ] Private/public projects

### Project Roles & Skills
- [ ] Define needed roles for projects
- [ ] Define needed skills for projects
- [ ] Role-skill associations
- [ ] Match profiles to project needs

### Project Approvals
- [ ] Apply to projects
- [ ] Invite profiles to projects
- [ ] Approval workflow (organizer)
- [ ] Role assignment
- [ ] Rate assignment per approval

**Deliverables:**
- Project creation/editing pages
- Project listing/search
- Approval workflow UI
- Project API routes

---

## Milestone 7: Profiles & Skills System 👤

### Skills Management
- [ ] Add/edit skills
- [ ] Skill types catalog
- [ ] Language skills support
- [ ] Skill endorsements
- [ ] Endorsement count tracking

### Certifications
- [ ] Add/edit certifications
- [ ] Certification types
- [ ] File/URL attachments
- [ ] Certification dates/status

### Rates
- [ ] Set hourly rates
- [ ] Rate types (default, coaching)
- [ ] Historical rate tracking
- [ ] Currency support
- [ ] Rate visibility (privacy)

### Industries & Employment
- [ ] Add industries
- [ ] Industry types
- [ ] Employment history
- [ ] Company associations

**Deliverables:**
- Skills management UI
- Certifications management
- Rate management
- Profile attributes API

---

## Milestone 8: Reviews & Endorsements ⭐

### Reviews System
- [ ] Leave reviews for profiles
- [ ] Link reviews to project approvals
- [ ] Public/private reviews
- [ ] Review display on profiles
- [ ] Cross-community review aggregation

### Endorsements
- [ ] Endorse skills
- [ ] View endorsements received
- [ ] Endorsement count per skill
- [ ] Endorsement display

**Deliverables:**
- Review creation/display UI
- Endorsement system
- Review aggregation logic
- Social proof components

---

## Milestone 9: Search & Discovery 🔍

### Fuzzy Search Implementation
- [ ] Postgres pg_trgm extension setup
- [ ] Search profiles (name, skills, bio)
- [ ] Search projects/jobs (title, description, requirements)
- [ ] Search companies (name, description)
- [ ] Search communities (name, description, skills)

### Search Filters
- [ ] Filter by skills
- [ ] Filter by industries
- [ ] Filter by rate range
- [ ] Filter by community
- [ ] Filter by availability
- [ ] Sort options (relevance, date, rate)

### Search Results
- [ ] Highlight matching terms
- [ ] Show community-specific skills
- [ ] Display ratings/reviews
- [ ] Pagination

**Deliverables:**
- Search page with filters
- Search API endpoints
- Search result components
- Fuzzy search optimization

---

## Milestone 10: UI/UX Implementation 🎨

### Glassmorphic Design System
- [ ] Integrate glassmorphic starter pack
- [ ] Customize color palette
- [ ] GlassCard components
- [ ] GlassButton components
- [ ] Navigation component
- [ ] Responsive design

### Key Pages
- [ ] Dashboard/homepage
- [ ] Profile pages (view/edit)
- [ ] Project pages (view/create/edit)
- [ ] Community pages
- [ ] Search/discovery page
- [ ] Settings pages
- [ ] Token/payment pages

### Mobile Responsiveness
- [ ] Mobile-first design
- [ ] Touch-friendly interactions
- [ ] Mobile navigation
- [ ] Responsive tables/cards

**Deliverables:**
- Complete UI implementation
- Glassmorphic component library
- Responsive layouts
- Design system documentation

---

## Milestone 11: Real-Time Features ⚡ (Future)

### Supabase Realtime
- [ ] Real-time project updates
- [ ] Real-time approval notifications
- [ ] Real-time call status
- [ ] Real-time token balance updates
- [ ] Real-time messaging (if needed)

**Deliverables:**
- Realtime subscriptions
- Live updates UI
- Notification system

---

## Milestone 12: Email Notifications 📧 (Future)

### Resend Integration
- [ ] Project approval notifications
- [ ] New project invitations
- [ ] Review/endorsement notifications
- [ ] Call session summaries
- [ ] Escrow release notifications
- [ ] Low balance warnings

**Deliverables:**
- Email templates
- Resend integration
- Notification preferences
- Email API routes

---

## Milestone 13: Stripe Integration 💳 (Future)

### Payment Processing
- [ ] Stripe Connect setup
- [ ] Token purchase flow
- [ ] USD conversion
- [ ] International currency support
- [ ] Payment webhooks
- [ ] Refund system

**Deliverables:**
- Stripe integration
- Payment pages
- Webhook handlers
- Currency conversion

---

## Milestone 14: Discord Bot Integration 🤖 (Future)

### Bot Features
- [ ] Bot installation/authorization
- [ ] Voice channel creation tracking
- [ ] Call session detection
- [ ] Billing notifications
- [ ] Low balance warnings
- [ ] Community commands

**Deliverables:**
- Discord bot application
- Bot commands
- Event handlers
- Integration documentation

---

## Technical Stack Summary

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **UI Framework:** Glassmorphic design system (Framer Motion)
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Authentication:** Supabase Auth + Discord OAuth
- **Search:** PostgreSQL pg_trgm (fuzzy search)
- **Payments:** Simple token system (MVP) → Stripe (future)
- **Email:** Resend (future milestone)
- **Deployment:** Vercel
- **Database:** Supabase PostgreSQL with RLS

---

## Development Priorities

### Phase 1: Core Foundation (Milestones 1-3)
Build the foundation: database, auth, communities

### Phase 2: Core Features (Milestones 4-8)
Implement core marketplace features: tokens, calls, projects, profiles

### Phase 3: Discovery & UI (Milestones 9-10)
Search functionality and complete UI implementation

### Phase 4: Enhancements (Milestones 11-14)
Real-time, email, payments, Discord bot

---

## Success Criteria

- ✅ Multi-community isolation working
- ✅ Users can join multiple communities
- ✅ Per-community skill visibility
- ✅ Cross-community ratings
- ✅ Token system functional
- ✅ Per-minute billing working
- ✅ 14-day escrow system
- ✅ Discord verification working
- ✅ Fuzzy search implemented
- ✅ Glassmorphic UI complete
- ✅ Mobile responsive
- ✅ Production-ready deployment

