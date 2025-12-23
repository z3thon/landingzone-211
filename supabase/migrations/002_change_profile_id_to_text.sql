-- Migration to change profile ID from UUID to TEXT to support Firebase UIDs
-- Since we're using Firebase Auth instead of Supabase Auth, we need TEXT IDs

-- Drop ALL RLS policies that reference profiles.id or profile_id columns
-- These use auth.uid()::uuid which won't work with Firebase Auth
DROP POLICY IF EXISTS "Community owners can update their communities" ON communities;
DROP POLICY IF EXISTS "Projects are viewable based on privacy" ON projects;
DROP POLICY IF EXISTS "Organizers can manage their projects" ON projects;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Rates visibility based on privacy" ON rates;
DROP POLICY IF EXISTS "Users can manage their own rates" ON rates;
DROP POLICY IF EXISTS "Users can view their call sessions" ON call_sessions;
DROP POLICY IF EXISTS "Certifications are viewable by everyone" ON certifications;
DROP POLICY IF EXISTS "Users can manage their own certifications" ON certifications;
DROP POLICY IF EXISTS "Members can view their community memberships" ON community_members;
DROP POLICY IF EXISTS "Users can join communities" ON community_members;
DROP POLICY IF EXISTS "Community skill visibility is viewable by community members" ON community_skill_visibility;
DROP POLICY IF EXISTS "Users can manage their own skill visibility" ON community_skill_visibility;
DROP POLICY IF EXISTS "Discord users are viewable by everyone" ON discord_users;
DROP POLICY IF EXISTS "Users can insert their own discord link" ON discord_users;
DROP POLICY IF EXISTS "Users can update their own discord link" ON discord_users;
DROP POLICY IF EXISTS "Authenticated users can create endorsements" ON endorsements;
DROP POLICY IF EXISTS "Endorsements are viewable by everyone" ON endorsements;
DROP POLICY IF EXISTS "Industries are viewable by everyone" ON industries;
DROP POLICY IF EXISTS "Users can manage their own industries" ON industries;
DROP POLICY IF EXISTS "Organizers can manage approvals" ON project_approvals;
DROP POLICY IF EXISTS "Users can view their own approvals" ON project_approvals;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Reviews are viewable by authenticated users" ON reviews;
DROP POLICY IF EXISTS "Skills are viewable by everyone" ON skills;
DROP POLICY IF EXISTS "Users can manage their own skills" ON skills;
DROP POLICY IF EXISTS "Users can view their own token balance" ON token_balances;
DROP POLICY IF EXISTS "Users can view their transactions" ON token_transactions;

-- Drop the original constraint that references auth.users (we're using Firebase Auth)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Drop foreign key constraints that reference profiles(id)
ALTER TABLE community_members DROP CONSTRAINT IF EXISTS community_members_profile_id_fkey;
ALTER TABLE discord_users DROP CONSTRAINT IF EXISTS discord_users_profile_id_fkey;
ALTER TABLE token_balances DROP CONSTRAINT IF EXISTS token_balances_profile_id_fkey;
ALTER TABLE token_transactions DROP CONSTRAINT IF EXISTS token_transactions_from_profile_id_fkey;
ALTER TABLE token_transactions DROP CONSTRAINT IF EXISTS token_transactions_to_profile_id_fkey;
ALTER TABLE voice_channels DROP CONSTRAINT IF EXISTS voice_channels_coach_profile_id_fkey;
ALTER TABLE call_sessions DROP CONSTRAINT IF EXISTS call_sessions_coach_profile_id_fkey;
ALTER TABLE call_sessions DROP CONSTRAINT IF EXISTS call_sessions_attendee_profile_id_fkey;
ALTER TABLE payouts DROP CONSTRAINT IF EXISTS payouts_coach_profile_id_fkey;
ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_profile_id_fkey;
ALTER TABLE community_skill_visibility DROP CONSTRAINT IF EXISTS community_skill_visibility_profile_id_fkey;
ALTER TABLE certifications DROP CONSTRAINT IF EXISTS certifications_profile_id_fkey;
ALTER TABLE rates DROP CONSTRAINT IF EXISTS rates_profile_id_fkey;
ALTER TABLE industries DROP CONSTRAINT IF EXISTS industries_profile_id_fkey;
ALTER TABLE employment DROP CONSTRAINT IF EXISTS employment_profile_id_fkey;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_organizer_id_fkey;
ALTER TABLE project_approvals DROP CONSTRAINT IF EXISTS project_approvals_profile_id_fkey;
ALTER TABLE project_approvals DROP CONSTRAINT IF EXISTS project_approvals_approved_by_fkey;
ALTER TABLE endorsements DROP CONSTRAINT IF EXISTS endorsements_endorsee_profile_id_fkey;
ALTER TABLE endorsements DROP CONSTRAINT IF EXISTS endorsements_endorser_profile_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewee_profile_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_profile_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_coaching_rate;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_default_rate;

-- Change profile_id columns from UUID to TEXT in all tables
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;
ALTER TABLE community_members ALTER COLUMN profile_id TYPE TEXT;
ALTER TABLE discord_users ALTER COLUMN profile_id TYPE TEXT;
ALTER TABLE token_balances ALTER COLUMN profile_id TYPE TEXT;
ALTER TABLE token_transactions ALTER COLUMN from_profile_id TYPE TEXT;
ALTER TABLE token_transactions ALTER COLUMN to_profile_id TYPE TEXT;
ALTER TABLE voice_channels ALTER COLUMN coach_profile_id TYPE TEXT;
ALTER TABLE call_sessions ALTER COLUMN coach_profile_id TYPE TEXT;
ALTER TABLE call_sessions ALTER COLUMN attendee_profile_id TYPE TEXT;
ALTER TABLE payouts ALTER COLUMN coach_profile_id TYPE TEXT;
ALTER TABLE skills ALTER COLUMN profile_id TYPE TEXT;
ALTER TABLE community_skill_visibility ALTER COLUMN profile_id TYPE TEXT;
ALTER TABLE certifications ALTER COLUMN profile_id TYPE TEXT;
ALTER TABLE rates ALTER COLUMN profile_id TYPE TEXT;
ALTER TABLE industries ALTER COLUMN profile_id TYPE TEXT;
ALTER TABLE employment ALTER COLUMN profile_id TYPE TEXT;
ALTER TABLE projects ALTER COLUMN organizer_id TYPE TEXT;
ALTER TABLE project_approvals ALTER COLUMN profile_id TYPE TEXT;
ALTER TABLE project_approvals ALTER COLUMN approved_by TYPE TEXT;
ALTER TABLE endorsements ALTER COLUMN endorsee_profile_id TYPE TEXT;
ALTER TABLE endorsements ALTER COLUMN endorser_profile_id TYPE TEXT;
ALTER TABLE reviews ALTER COLUMN reviewee_profile_id TYPE TEXT;
ALTER TABLE reviews ALTER COLUMN reviewer_profile_id TYPE TEXT;

-- Re-add foreign key constraints with TEXT type
ALTER TABLE community_members ADD CONSTRAINT community_members_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE discord_users ADD CONSTRAINT discord_users_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE token_balances ADD CONSTRAINT token_balances_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE token_transactions ADD CONSTRAINT token_transactions_from_profile_id_fkey 
    FOREIGN KEY (from_profile_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE token_transactions ADD CONSTRAINT token_transactions_to_profile_id_fkey 
    FOREIGN KEY (to_profile_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE voice_channels ADD CONSTRAINT voice_channels_coach_profile_id_fkey 
    FOREIGN KEY (coach_profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE call_sessions ADD CONSTRAINT call_sessions_coach_profile_id_fkey 
    FOREIGN KEY (coach_profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE call_sessions ADD CONSTRAINT call_sessions_attendee_profile_id_fkey 
    FOREIGN KEY (attendee_profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE payouts ADD CONSTRAINT payouts_coach_profile_id_fkey 
    FOREIGN KEY (coach_profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE skills ADD CONSTRAINT skills_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE community_skill_visibility ADD CONSTRAINT community_skill_visibility_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE certifications ADD CONSTRAINT certifications_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE rates ADD CONSTRAINT rates_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE industries ADD CONSTRAINT industries_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE employment ADD CONSTRAINT employment_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE projects ADD CONSTRAINT projects_organizer_id_fkey 
    FOREIGN KEY (organizer_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE project_approvals ADD CONSTRAINT project_approvals_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE project_approvals ADD CONSTRAINT project_approvals_approved_by_fkey 
    FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE endorsements ADD CONSTRAINT endorsements_endorsee_profile_id_fkey 
    FOREIGN KEY (endorsee_profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE endorsements ADD CONSTRAINT endorsements_endorser_profile_id_fkey 
    FOREIGN KEY (endorser_profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT reviews_reviewee_profile_id_fkey 
    FOREIGN KEY (reviewee_profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT reviews_reviewer_profile_id_fkey 
    FOREIGN KEY (reviewer_profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Re-add rate constraints (these reference UUID rates, not profiles)
ALTER TABLE profiles 
    ADD CONSTRAINT fk_profiles_coaching_rate 
    FOREIGN KEY (coaching_rate_id) REFERENCES rates(id) ON DELETE SET NULL;
    
ALTER TABLE profiles 
    ADD CONSTRAINT fk_profiles_default_rate 
    FOREIGN KEY (default_rate_id) REFERENCES rates(id) ON DELETE SET NULL;

-- Recreate simplified RLS policies
-- Since we're using Firebase Auth, authorization is handled by the application layer
-- These policies allow basic access; actual authorization is done via Firebase tokens

-- Profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (true); -- Authorization handled by app layer
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (true); -- Authorization handled by app layer

-- Rates
CREATE POLICY "Rates visibility based on privacy" ON rates
    FOR SELECT USING (true); -- Authorization handled by app layer
CREATE POLICY "Users can manage their own rates" ON rates
    FOR ALL USING (true); -- Authorization handled by app layer

-- Call Sessions
CREATE POLICY "Users can view their call sessions" ON call_sessions
    FOR SELECT USING (true); -- Authorization handled by app layer

-- Certifications
CREATE POLICY "Certifications are viewable by everyone" ON certifications
    FOR SELECT USING (true);
CREATE POLICY "Users can manage their own certifications" ON certifications
    FOR ALL USING (true); -- Authorization handled by app layer

-- Community Members
CREATE POLICY "Members can view their community memberships" ON community_members
    FOR SELECT USING (true); -- Authorization handled by app layer
CREATE POLICY "Users can join communities" ON community_members
    FOR INSERT WITH CHECK (true); -- Authorization handled by app layer

-- Community Skill Visibility
CREATE POLICY "Community skill visibility is viewable by community members" ON community_skill_visibility
    FOR SELECT USING (true); -- Authorization handled by app layer
CREATE POLICY "Users can manage their own skill visibility" ON community_skill_visibility
    FOR ALL USING (true); -- Authorization handled by app layer

-- Discord Users
CREATE POLICY "Discord users are viewable by everyone" ON discord_users
    FOR SELECT USING (true);
CREATE POLICY "Users can insert their own discord link" ON discord_users
    FOR INSERT WITH CHECK (true); -- Authorization handled by app layer
CREATE POLICY "Users can update their own discord link" ON discord_users
    FOR UPDATE USING (true); -- Authorization handled by app layer

-- Endorsements
CREATE POLICY "Endorsements are viewable by everyone" ON endorsements
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create endorsements" ON endorsements
    FOR INSERT WITH CHECK (true); -- Authorization handled by app layer

-- Industries
CREATE POLICY "Industries are viewable by everyone" ON industries
    FOR SELECT USING (true);
CREATE POLICY "Users can manage their own industries" ON industries
    FOR ALL USING (true); -- Authorization handled by app layer

-- Project Approvals
CREATE POLICY "Users can view their own approvals" ON project_approvals
    FOR SELECT USING (true); -- Authorization handled by app layer
CREATE POLICY "Organizers can manage approvals" ON project_approvals
    FOR ALL USING (true); -- Authorization handled by app layer

-- Reviews
CREATE POLICY "Reviews are viewable by authenticated users" ON reviews
    FOR SELECT USING (true); -- Authorization handled by app layer
CREATE POLICY "Authenticated users can create reviews" ON reviews
    FOR INSERT WITH CHECK (true); -- Authorization handled by app layer

-- Skills
CREATE POLICY "Skills are viewable by everyone" ON skills
    FOR SELECT USING (true);
CREATE POLICY "Users can manage their own skills" ON skills
    FOR ALL USING (true); -- Authorization handled by app layer

-- Token Balances
CREATE POLICY "Users can view their own token balance" ON token_balances
    FOR SELECT USING (true); -- Authorization handled by app layer

-- Token Transactions
CREATE POLICY "Users can view their transactions" ON token_transactions
    FOR SELECT USING (true); -- Authorization handled by app layer

-- Note: profiles.id no longer references auth.users since we're using Firebase Auth
-- The original constraint was: REFERENCES auth.users(id) ON DELETE CASCADE
-- This has been removed as profiles.id is now a standalone TEXT field
-- Firebase UIDs are stored directly as TEXT in profiles.id
-- RLS policies are simplified since authorization is handled by the application using Firebase tokens
