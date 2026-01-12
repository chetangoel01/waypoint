-- Multi-user migration for Waypoint
-- Run this in the Supabase SQL Editor

-- 1. Enable RLS on all tables
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_emails ENABLE ROW LEVEL SECURITY;

-- 2. Add user_id column to all tables
-- Profile (remove singleton constraint if exists, keep identity column as-is)
ALTER TABLE profile DROP CONSTRAINT IF EXISTS profile_id_check;
-- Note: id is already an identity column, no need to modify it
ALTER TABLE profile ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Other tables
ALTER TABLE applications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE work_experience ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE education ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE skills ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE stories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
-- document_versions doesn't need user_id strictly if it links to documents(id) which has RLS,
-- but adding it can make direct queries safer/easier.
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE processed_emails ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 3. Create RLS Policies
-- Drop existing policies first to make script idempotent

-- Profile Policies
DROP POLICY IF EXISTS "Users can view own profile" ON profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON profile;
DROP POLICY IF EXISTS "Users can update own profile" ON profile;
CREATE POLICY "Users can view own profile" ON profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profile FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profile FOR UPDATE USING (auth.uid() = user_id);

-- Application Policies
DROP POLICY IF EXISTS "Users can crud own applications" ON applications;
CREATE POLICY "Users can crud own applications" ON applications USING (auth.uid() = user_id);

-- Work Experience Policies
DROP POLICY IF EXISTS "Users can crud own work_experience" ON work_experience;
CREATE POLICY "Users can crud own work_experience" ON work_experience USING (auth.uid() = user_id);

-- Education Policies
DROP POLICY IF EXISTS "Users can crud own education" ON education;
CREATE POLICY "Users can crud own education" ON education USING (auth.uid() = user_id);

-- Skills Policies
DROP POLICY IF EXISTS "Users can crud own skills" ON skills;
CREATE POLICY "Users can crud own skills" ON skills USING (auth.uid() = user_id);

-- Projects Policies
DROP POLICY IF EXISTS "Users can crud own projects" ON projects;
CREATE POLICY "Users can crud own projects" ON projects USING (auth.uid() = user_id);

-- Stories Policies
DROP POLICY IF EXISTS "Users can crud own stories" ON stories;
CREATE POLICY "Users can crud own stories" ON stories USING (auth.uid() = user_id);

-- Documents Policies
DROP POLICY IF EXISTS "Users can crud own documents" ON documents;
CREATE POLICY "Users can crud own documents" ON documents USING (auth.uid() = user_id);

-- Document Versions Policies
DROP POLICY IF EXISTS "Users can crud own document_versions" ON document_versions;
CREATE POLICY "Users can crud own document_versions" ON document_versions USING (auth.uid() = user_id);

-- Settings Policies
DROP POLICY IF EXISTS "Users can crud own settings" ON settings;
CREATE POLICY "Users can crud own settings" ON settings USING (auth.uid() = user_id);

-- Processed Emails Policies
DROP POLICY IF EXISTS "Users can crud own processed_emails" ON processed_emails;
CREATE POLICY "Users can crud own processed_emails" ON processed_emails USING (auth.uid() = user_id);

-- 4. Update Settings Table Primary Key
-- Currently 'key' is PK. Needs to be (user_id, key) for multi-user.
-- Only do this if the old constraint exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'settings_pkey' AND conrelid = 'settings'::regclass) THEN
    -- Check if user_id is part of the primary key
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conname = 'settings_pkey' AND c.conrelid = 'settings'::regclass AND a.attname = 'user_id'
    ) THEN
      ALTER TABLE settings DROP CONSTRAINT settings_pkey;
      ALTER TABLE settings ADD PRIMARY KEY (user_id, key);
    END IF;
  END IF;
END $$;

-- 5. Fix Profile Constraints
-- We want one profile per user, not one profile total.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_user_id ON profile(user_id);
