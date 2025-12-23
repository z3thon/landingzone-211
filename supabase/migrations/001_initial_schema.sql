-- Landing Zone Database Schema Migration
-- Multi-community SaaS platform for Discord communities

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search

-- ============================================================================
-- LOOKUP TABLES (No dependencies - create first)
-- ============================================================================

-- Skill Types: Master skill catalog
CREATE TABLE skill_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_language BOOLEAN DEFAULT false,
    language_abbreviation TEXT,
    native_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Industries Types: Master industry catalog
CREATE TABLE industries_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    abbreviation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certification Types: Master certification catalog
CREATE TABLE certification_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role Types: Role definitions
CREATE TABLE role_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate Types: Rate type definitions
CREATE TABLE rate_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role Type Skills: Junction table for role_types ↔ skill_types
CREATE TABLE role_type_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_type_id UUID NOT NULL REFERENCES role_types(id) ON DELETE CASCADE,
    skill_type_id UUID NOT NULL REFERENCES skill_types(id) ON DELETE CASCADE,
    is_language BOOLEAN DEFAULT false,
    skill_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_type_id, skill_type_id)
);

-- ============================================================================
-- CORE ENTITY TABLES
-- ============================================================================

-- Profiles: Central entity - extends Supabase auth.users
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bio TEXT,
    email TEXT,
    phone TEXT,
    
    -- Address fields
    street_1 TEXT,
    street_2 TEXT,
    city TEXT,
    state_region TEXT,
    postal_code TEXT,
    country TEXT,
    
    -- Availability
    available BOOLEAN DEFAULT true,
    available_from TIME,
    available_to TIME,
    
    -- Currency preference
    currency TEXT DEFAULT 'USD',
    
    -- Privacy settings (consolidated JSON)
    privacy_settings JSONB DEFAULT '{
        "email": "public",
        "phone": "public",
        "intro": "public",
        "portfolio": "public",
        "rate": "public"
    }'::jsonb,
    
    -- Rate references (will be set after rates table exists)
    coaching_rate_id UUID,
    default_rate_id UUID,
    
    -- Profile picture
    avatar_url TEXT, -- Supabase Storage URL
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies: Company information
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    website TEXT,
    phone TEXT,
    logo_url TEXT, -- Supabase Storage URL
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MULTI-COMMUNITY TABLES
-- ============================================================================

-- Communities: Discord communities/tenants
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT, -- Supabase Storage URL
    transaction_fee_percent DECIMAL(5,2) DEFAULT 0.00 CHECK (transaction_fee_percent >= 0 AND transaction_fee_percent <= 100),
    discord_server_id TEXT UNIQUE, -- Discord server ID for bot connection
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community Members: Junction table for profiles ↔ communities
CREATE TABLE community_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, community_id)
);

-- Discord Users: Discord account verification and linking
CREATE TABLE discord_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    discord_user_id TEXT NOT NULL UNIQUE,
    discord_username TEXT NOT NULL,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TOKEN & PAYMENT SYSTEM TABLES
-- ============================================================================

-- Token Balances: User retainer balances
CREATE TABLE token_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    balance_usd DECIMAL(12,2) DEFAULT 0.00 CHECK (balance_usd >= 0),
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token Transactions: All token movements
CREATE TABLE token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    to_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('purchase', 'call_payment', 'payout', 'refund', 'discount', 'transfer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    call_session_id UUID, -- Will reference call_sessions after it's created
    metadata JSONB, -- Additional transaction data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================================
-- VOICE CALL & BILLING TABLES
-- ============================================================================

-- Voice Channels: Discord voice channels with billing rates
CREATE TABLE voice_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    discord_channel_id TEXT NOT NULL UNIQUE,
    channel_name TEXT NOT NULL,
    coach_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    billing_rate_per_hour DECIMAL(10,2) NOT NULL CHECK (billing_rate_per_hour >= 0),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call Sessions: Actual call sessions with duration tracking
CREATE TABLE call_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voice_channel_id UUID NOT NULL REFERENCES voice_channels(id) ON DELETE CASCADE,
    coach_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    attendee_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 0 CHECK (duration_minutes >= 0),
    total_cost DECIMAL(12,2) DEFAULT 0.00 CHECK (total_cost >= 0),
    grace_period_seconds INTEGER DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated', 'failed')),
    discount_applied DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint for call_session_id in token_transactions
ALTER TABLE token_transactions 
    ADD CONSTRAINT fk_token_transactions_call_session 
    FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE SET NULL;

-- Billing Events: Per-minute billing events for real-time deduction
CREATE TABLE billing_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_session_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    minutes_billed INTEGER NOT NULL DEFAULT 1 CHECK (minutes_billed > 0),
    cost DECIMAL(12,2) NOT NULL CHECK (cost > 0),
    retainer_balance_before DECIMAL(12,2) NOT NULL,
    retainer_balance_after DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escrow Holdings: 14-day escrow holds
CREATE TABLE escrow_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_session_id UUID NOT NULL UNIQUE REFERENCES call_sessions(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    hold_until TIMESTAMPTZ NOT NULL, -- 14 days from call end
    status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'disputed', 'refunded')),
    community_fee_percent DECIMAL(5,2) NOT NULL,
    platform_fee_percent DECIMAL(5,2) DEFAULT 6.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    released_at TIMESTAMPTZ
);

-- Payouts: Final payouts after escrow
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    escrow_holding_id UUID NOT NULL UNIQUE REFERENCES escrow_holdings(id) ON DELETE CASCADE,
    gross_amount DECIMAL(12,2) NOT NULL,
    community_fee DECIMAL(12,2) NOT NULL,
    platform_fee DECIMAL(12,2) NOT NULL,
    net_amount DECIMAL(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- ============================================================================
-- PROFILE ATTRIBUTES
-- ============================================================================

-- Skills: Profile skills with language support
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_type_id UUID NOT NULL REFERENCES skill_types(id) ON DELETE CASCADE,
    description TEXT,
    endorsement_count INTEGER DEFAULT 0 CHECK (endorsement_count >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, skill_type_id)
);

-- Community Skill Visibility: Per-community skill visibility control
CREATE TABLE community_skill_visibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, community_id, skill_id)
);

-- Certifications: Profile certifications
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    certification_type_id UUID NOT NULL REFERENCES certification_types(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    attachment_type TEXT CHECK (attachment_type IN ('file', 'url')),
    file_url TEXT, -- Supabase Storage URL
    url TEXT, -- External URL
    effective_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rates: Profile rates with types and currency
CREATE TABLE rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rate_type_id UUID NOT NULL REFERENCES rate_types(id) ON DELETE CASCADE,
    rate_per_hour DECIMAL(10,2) NOT NULL CHECK (rate_per_hour >= 0),
    currency TEXT DEFAULT 'USD',
    start_date DATE NOT NULL,
    end_date DATE,
    previous_rate_id UUID REFERENCES rates(id) ON DELETE SET NULL,
    previous_rate_per_hour DECIMAL(10,2),
    is_default BOOLEAN DEFAULT false,
    is_coaching BOOLEAN DEFAULT false,
    memo TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints for rate references in profiles
ALTER TABLE profiles 
    ADD CONSTRAINT fk_profiles_coaching_rate 
    FOREIGN KEY (coaching_rate_id) REFERENCES rates(id) ON DELETE SET NULL;
    
ALTER TABLE profiles 
    ADD CONSTRAINT fk_profiles_default_rate 
    FOREIGN KEY (default_rate_id) REFERENCES rates(id) ON DELETE SET NULL;

-- Industries: Profile industries with date ranges
CREATE TABLE industries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    industry_type_id UUID NOT NULL REFERENCES industries_types(id) ON DELETE CASCADE,
    from_date DATE,
    to_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, industry_type_id, from_date)
);

-- Employment: Employment history
CREATE TABLE employment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past', 'terminated')),
    is_company_admin BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROJECTS & PROJECT MANAGEMENT
-- ============================================================================

-- Projects: Projects with community association
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    private BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Outlines: Detailed project outlines
CREATE TABLE project_outlines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    outline TEXT NOT NULL, -- Rich text content
    order_number INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Approvals: Junction table for profiles ↔ projects
CREATE TABLE project_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_type_id UUID REFERENCES role_types(id) ON DELETE SET NULL,
    rate_id UUID REFERENCES rates(id) ON DELETE SET NULL,
    approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    invitation_type TEXT DEFAULT 'application' CHECK (invitation_type IN ('invitation', 'application')),
    notes TEXT,
    skills JSONB, -- Array of skill IDs
    languages JSONB, -- Array of language skill IDs
    industries JSONB, -- Array of industry IDs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, profile_id)
);

-- Project Files/URLs: Files and URLs attached to projects
CREATE TABLE project_files_urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    attachment_type TEXT NOT NULL CHECK (attachment_type IN ('file', 'url')),
    file_url TEXT, -- Supabase Storage URL if attachment_type = 'file'
    url TEXT, -- External URL if attachment_type = 'url'
    memo TEXT,
    resource TEXT, -- Rich text content
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Needed Roles: Roles required for projects
CREATE TABLE project_needed_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role_type_id UUID NOT NULL REFERENCES role_types(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, role_type_id)
);

-- Project Needed Skills: Skills required for projects
CREATE TABLE project_needed_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill_type_id UUID NOT NULL REFERENCES skill_types(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, skill_type_id)
);

-- ============================================================================
-- SOCIAL/REVIEWS
-- ============================================================================

-- Endorsements: Peer skill endorsements
CREATE TABLE endorsements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endorsee_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    endorser_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(endorsee_profile_id, endorser_profile_id, skill_id)
);

-- Reviews: Public reviews (merged with feedback)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewee_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_approval_id UUID REFERENCES project_approvals(id) ON DELETE SET NULL,
    review_text TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false, -- For private feedback
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Foreign key indexes
CREATE INDEX idx_community_members_profile_id ON community_members(profile_id);
CREATE INDEX idx_community_members_community_id ON community_members(community_id);
CREATE INDEX idx_community_skill_visibility_profile_id ON community_skill_visibility(profile_id);
CREATE INDEX idx_community_skill_visibility_community_id ON community_skill_visibility(community_id);
CREATE INDEX idx_community_skill_visibility_skill_id ON community_skill_visibility(skill_id);
CREATE INDEX idx_discord_users_profile_id ON discord_users(profile_id);
CREATE INDEX idx_discord_users_discord_user_id ON discord_users(discord_user_id);

CREATE INDEX idx_token_balances_profile_id ON token_balances(profile_id);
CREATE INDEX idx_token_transactions_from_profile_id ON token_transactions(from_profile_id);
CREATE INDEX idx_token_transactions_to_profile_id ON token_transactions(to_profile_id);
CREATE INDEX idx_token_transactions_call_session_id ON token_transactions(call_session_id);
CREATE INDEX idx_escrow_holdings_call_session_id ON escrow_holdings(call_session_id);
CREATE INDEX idx_payouts_coach_profile_id ON payouts(coach_profile_id);
CREATE INDEX idx_payouts_escrow_holding_id ON payouts(escrow_holding_id);

CREATE INDEX idx_voice_channels_community_id ON voice_channels(community_id);
CREATE INDEX idx_voice_channels_coach_profile_id ON voice_channels(coach_profile_id);
CREATE INDEX idx_call_sessions_voice_channel_id ON call_sessions(voice_channel_id);
CREATE INDEX idx_call_sessions_coach_profile_id ON call_sessions(coach_profile_id);
CREATE INDEX idx_call_sessions_attendee_profile_id ON call_sessions(attendee_profile_id);
CREATE INDEX idx_billing_events_call_session_id ON billing_events(call_session_id);

CREATE INDEX idx_projects_community_id ON projects(community_id);
CREATE INDEX idx_projects_organizer_id ON projects(organizer_id);
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_project_outlines_project_id ON project_outlines(project_id);
CREATE INDEX idx_project_approvals_project_id ON project_approvals(project_id);
CREATE INDEX idx_project_approvals_profile_id ON project_approvals(profile_id);
CREATE INDEX idx_project_files_urls_project_id ON project_files_urls(project_id);
CREATE INDEX idx_project_needed_roles_project_id ON project_needed_roles(project_id);
CREATE INDEX idx_project_needed_skills_project_id ON project_needed_skills(project_id);

CREATE INDEX idx_skills_profile_id ON skills(profile_id);
CREATE INDEX idx_skills_skill_type_id ON skills(skill_type_id);
CREATE INDEX idx_certifications_profile_id ON certifications(profile_id);
CREATE INDEX idx_certifications_certification_type_id ON certifications(certification_type_id);
CREATE INDEX idx_rates_profile_id ON rates(profile_id);
CREATE INDEX idx_rates_rate_type_id ON rates(rate_type_id);
CREATE INDEX idx_industries_profile_id ON industries(profile_id);
CREATE INDEX idx_industries_industry_type_id ON industries(industry_type_id);
CREATE INDEX idx_employment_profile_id ON employment(profile_id);
CREATE INDEX idx_employment_company_id ON employment(company_id);

CREATE INDEX idx_endorsements_endorsee_profile_id ON endorsements(endorsee_profile_id);
CREATE INDEX idx_endorsements_endorser_profile_id ON endorsements(endorser_profile_id);
CREATE INDEX idx_endorsements_skill_id ON endorsements(skill_id);
CREATE INDEX idx_reviews_reviewee_profile_id ON reviews(reviewee_profile_id);
CREATE INDEX idx_reviews_reviewer_profile_id ON reviews(reviewer_profile_id);
CREATE INDEX idx_reviews_project_approval_id ON reviews(project_approval_id);

CREATE INDEX idx_role_type_skills_role_type_id ON role_type_skills(role_type_id);
CREATE INDEX idx_role_type_skills_skill_type_id ON role_type_skills(skill_type_id);

-- Full-text search indexes (using GIN for pg_trgm)
CREATE INDEX idx_profiles_name_trgm ON profiles USING gin(name gin_trgm_ops);
CREATE INDEX idx_profiles_bio_trgm ON profiles USING gin(bio gin_trgm_ops);
CREATE INDEX idx_projects_name_trgm ON projects USING gin(name gin_trgm_ops);
CREATE INDEX idx_projects_description_trgm ON projects USING gin(description gin_trgm_ops);
CREATE INDEX idx_companies_name_trgm ON companies USING gin(name gin_trgm_ops);
CREATE INDEX idx_communities_name_trgm ON communities USING gin(name gin_trgm_ops);
CREATE INDEX idx_communities_description_trgm ON communities USING gin(description gin_trgm_ops);

-- Composite indexes for common queries
CREATE INDEX idx_skills_profile_skill_type ON skills(profile_id, skill_type_id);
CREATE INDEX idx_projects_community_status ON projects(community_id, status);
CREATE INDEX idx_project_approvals_project_approved ON project_approvals(project_id, approved);
CREATE INDEX idx_call_sessions_status ON call_sessions(status);
CREATE INDEX idx_escrow_holdings_status ON escrow_holdings(status);
CREATE INDEX idx_token_transactions_status ON token_transactions(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_skill_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_outlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_needed_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_needed_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment ENABLE ROW LEVEL SECURITY;
ALTER TABLE endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE industries_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_type_skills ENABLE ROW LEVEL SECURITY;

-- Communities: Public read (name, description), owners can manage
CREATE POLICY "Communities are viewable by everyone" ON communities
    FOR SELECT USING (true);

CREATE POLICY "Community owners can update their communities" ON communities
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM community_members
            WHERE community_members.community_id = communities.id
            AND community_members.profile_id = auth.uid()::uuid
            AND community_members.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Community owners can insert communities" ON communities
    FOR INSERT WITH CHECK (true); -- Will be restricted by application logic

-- Community Members: Members can view their communities
CREATE POLICY "Members can view their community memberships" ON community_members
    FOR SELECT USING (
        profile_id = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = community_members.community_id
            AND cm.profile_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Users can join communities" ON community_members
    FOR INSERT WITH CHECK (profile_id = auth.uid()::uuid);

-- Profiles: Users can read public profiles, edit own profile
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid()::uuid);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid()::uuid);

-- Projects: Public read (unless private), organizers can edit
CREATE POLICY "Projects are viewable based on privacy" ON projects
    FOR SELECT USING (
        NOT private
        OR organizer_id = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM project_approvals
            WHERE project_approvals.project_id = projects.id
            AND project_approvals.profile_id = auth.uid()::uuid
        )
        OR EXISTS (
            SELECT 1 FROM community_members
            WHERE community_members.community_id = projects.community_id
            AND community_members.profile_id = auth.uid()::uuid
            AND community_members.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Organizers can manage their projects" ON projects
    FOR ALL USING (organizer_id = auth.uid()::uuid);

-- Project Approvals: Participants can view own approvals, organizers can manage
CREATE POLICY "Users can view their own approvals" ON project_approvals
    FOR SELECT USING (
        profile_id = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_approvals.project_id
            AND projects.organizer_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Organizers can manage approvals" ON project_approvals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_approvals.project_id
            AND projects.organizer_id = auth.uid()::uuid
        )
    );

-- Rates: Profile owners control visibility based on privacy settings
CREATE POLICY "Rates visibility based on privacy" ON rates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = rates.profile_id
            AND (
                profiles.id = auth.uid()::uuid
                OR (profiles.privacy_settings->>'rate') IN ('public', 'community')
            )
        )
    );

CREATE POLICY "Users can manage their own rates" ON rates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = rates.profile_id
            AND profiles.id = auth.uid()::uuid
        )
    );

-- Reviews/Endorsements: Public read (authenticated), authenticated users can create
CREATE POLICY "Reviews are viewable by authenticated users" ON reviews
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND reviewer_profile_id = auth.uid()::uuid);

CREATE POLICY "Endorsements are viewable by everyone" ON endorsements
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create endorsements" ON endorsements
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND endorser_profile_id = auth.uid()::uuid);

-- Token Balances: Users can only view their own balance
CREATE POLICY "Users can view their own token balance" ON token_balances
    FOR SELECT USING (profile_id = auth.uid()::uuid);

-- Token Transactions: Visible to involved parties
CREATE POLICY "Users can view their transactions" ON token_transactions
    FOR SELECT USING (
        from_profile_id = auth.uid()::uuid
        OR to_profile_id = auth.uid()::uuid
    );

-- Call Sessions: Participants can view their own sessions
CREATE POLICY "Users can view their call sessions" ON call_sessions
    FOR SELECT USING (
        coach_profile_id = auth.uid()::uuid
        OR attendee_profile_id = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM voice_channels
            JOIN communities ON communities.id = voice_channels.community_id
            JOIN community_members ON community_members.community_id = communities.id
            WHERE voice_channels.id = call_sessions.voice_channel_id
            AND community_members.profile_id = auth.uid()::uuid
            AND community_members.role IN ('owner', 'admin')
        )
    );

-- Skills/Certifications/Industries: Public read, profile owners can manage
CREATE POLICY "Skills are viewable by everyone" ON skills FOR SELECT USING (true);
CREATE POLICY "Users can manage their own skills" ON skills FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = skills.profile_id AND profiles.id = auth.uid()::uuid)
);

CREATE POLICY "Certifications are viewable by everyone" ON certifications FOR SELECT USING (true);
CREATE POLICY "Users can manage their own certifications" ON certifications FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = certifications.profile_id AND profiles.id = auth.uid()::uuid)
);

CREATE POLICY "Industries are viewable by everyone" ON industries FOR SELECT USING (true);
CREATE POLICY "Users can manage their own industries" ON industries FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = industries.profile_id AND profiles.id = auth.uid()::uuid)
);

-- Companies: Public read, company admins can edit
CREATE POLICY "Companies are viewable by everyone" ON companies FOR SELECT USING (true);
CREATE POLICY "Company admins can edit companies" ON companies FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM employment
        WHERE employment.company_id = companies.id
        AND employment.profile_id = auth.uid()::uuid
        AND employment.is_company_admin = true
    )
);

-- Lookup tables: Public read
CREATE POLICY "Lookup tables are viewable by everyone" ON skill_types FOR SELECT USING (true);
CREATE POLICY "Lookup tables are viewable by everyone" ON industries_types FOR SELECT USING (true);
CREATE POLICY "Lookup tables are viewable by everyone" ON certification_types FOR SELECT USING (true);
CREATE POLICY "Lookup tables are viewable by everyone" ON role_types FOR SELECT USING (true);
CREATE POLICY "Lookup tables are viewable by everyone" ON rate_types FOR SELECT USING (true);
CREATE POLICY "Lookup tables are viewable by everyone" ON role_type_skills FOR SELECT USING (true);

-- Additional policies for project-related tables
CREATE POLICY "Project outlines are viewable with project" ON project_outlines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_outlines.project_id
            AND (
                NOT projects.private
                OR projects.organizer_id = auth.uid()::uuid
                OR EXISTS (
                    SELECT 1 FROM project_approvals
                    WHERE project_approvals.project_id = projects.id
                    AND project_approvals.profile_id = auth.uid()::uuid
                )
            )
        )
    );

CREATE POLICY "Project files are viewable with project" ON project_files_urls
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_files_urls.project_id
            AND (
                NOT projects.private
                OR projects.organizer_id = auth.uid()::uuid
            )
        )
    );

CREATE POLICY "Project needed roles/skills are viewable with project" ON project_needed_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_needed_roles.project_id
            AND (
                NOT projects.private
                OR projects.organizer_id = auth.uid()::uuid
            )
        )
    );

CREATE POLICY "Project needed skills are viewable with project" ON project_needed_skills
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_needed_skills.project_id
            AND (
                NOT projects.private
                OR projects.organizer_id = auth.uid()::uuid
            )
        )
    );

-- Discord users: Users can view their own, public profiles can show verified status
CREATE POLICY "Discord users are viewable by everyone" ON discord_users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own discord link" ON discord_users
    FOR UPDATE USING (profile_id = auth.uid()::uuid);

CREATE POLICY "Users can insert their own discord link" ON discord_users
    FOR INSERT WITH CHECK (profile_id = auth.uid()::uuid);

-- Community skill visibility: Viewable by community members
CREATE POLICY "Community skill visibility is viewable by community members" ON community_skill_visibility
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_members
            WHERE community_members.community_id = community_skill_visibility.community_id
            AND community_members.profile_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Users can manage their own skill visibility" ON community_skill_visibility
    FOR ALL USING (profile_id = auth.uid()::uuid);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discord_users_updated_at BEFORE UPDATE ON discord_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_token_balances_updated_at BEFORE UPDATE ON token_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_voice_channels_updated_at BEFORE UPDATE ON voice_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_call_sessions_updated_at BEFORE UPDATE ON call_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON certifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rates_updated_at BEFORE UPDATE ON rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_industries_updated_at BEFORE UPDATE ON industries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employment_updated_at BEFORE UPDATE ON employment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update endorsement count
CREATE OR REPLACE FUNCTION update_endorsement_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE skills
        SET endorsement_count = endorsement_count + 1
        WHERE id = NEW.skill_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE skills
        SET endorsement_count = GREATEST(endorsement_count - 1, 0)
        WHERE id = OLD.skill_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_skill_endorsement_count
    AFTER INSERT OR DELETE ON endorsements
    FOR EACH ROW EXECUTE FUNCTION update_endorsement_count();

-- Function to create token balance on profile creation
CREATE OR REPLACE FUNCTION create_token_balance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO token_balances (profile_id, balance_usd, currency)
    VALUES (NEW.id, 0.00, 'USD');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_profile_token_balance
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_token_balance();
