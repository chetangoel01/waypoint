-- Multi-user publish migration (apply after checks pass)

-- 1) Ensure user_id columns exist
alter table public.profile add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.applications add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.work_experience add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.education add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.skills add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.projects add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.stories add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.documents add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.document_versions add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.settings add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.processed_emails add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.oauth_tokens add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- 2) Settings PK must be (user_id, key)
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'settings_pkey'
      and conrelid = 'public.settings'::regclass
  ) then
    if not exists (
      select 1
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
      where c.conname = 'settings_pkey'
        and c.conrelid = 'public.settings'::regclass
        and a.attname = 'user_id'
    ) then
      alter table public.settings drop constraint settings_pkey;
      alter table public.settings add primary key (user_id, key);
    end if;
  end if;
end $$;

-- 3) One profile per user
create unique index if not exists idx_profile_user_id
  on public.profile(user_id);

-- 4) processed_emails unique per user
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'processed_emails_email_id_key'
      and conrelid = 'public.processed_emails'::regclass
  ) then
    alter table public.processed_emails
      drop constraint processed_emails_email_id_key;
  end if;
end $$;

drop index if exists public.processed_emails_email_id_key;

create unique index if not exists idx_processed_emails_user_email_id
  on public.processed_emails(user_id, email_id);

-- 5) Enable RLS
alter table public.profile enable row level security;
alter table public.applications enable row level security;
alter table public.work_experience enable row level security;
alter table public.education enable row level security;
alter table public.skills enable row level security;
alter table public.projects enable row level security;
alter table public.stories enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.settings enable row level security;
alter table public.processed_emails enable row level security;
alter table public.oauth_tokens enable row level security;

-- 6) RLS policies

-- Profile
drop policy if exists "Users can select own profile" on public.profile;
drop policy if exists "Users can insert own profile" on public.profile;
drop policy if exists "Users can update own profile" on public.profile;
drop policy if exists "Users can delete own profile" on public.profile;

create policy "Users can select own profile"
  on public.profile for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profile for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profile for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own profile"
  on public.profile for delete
  using (auth.uid() = user_id);

-- Applications
drop policy if exists "Users can select own applications" on public.applications;
drop policy if exists "Users can insert own applications" on public.applications;
drop policy if exists "Users can update own applications" on public.applications;
drop policy if exists "Users can delete own applications" on public.applications;

create policy "Users can select own applications"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "Users can insert own applications"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own applications"
  on public.applications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own applications"
  on public.applications for delete
  using (auth.uid() = user_id);

-- Work Experience
drop policy if exists "Users can select own work_experience" on public.work_experience;
drop policy if exists "Users can insert own work_experience" on public.work_experience;
drop policy if exists "Users can update own work_experience" on public.work_experience;
drop policy if exists "Users can delete own work_experience" on public.work_experience;

create policy "Users can select own work_experience"
  on public.work_experience for select
  using (auth.uid() = user_id);

create policy "Users can insert own work_experience"
  on public.work_experience for insert
  with check (auth.uid() = user_id);

create policy "Users can update own work_experience"
  on public.work_experience for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own work_experience"
  on public.work_experience for delete
  using (auth.uid() = user_id);

-- Education
drop policy if exists "Users can select own education" on public.education;
drop policy if exists "Users can insert own education" on public.education;
drop policy if exists "Users can update own education" on public.education;
drop policy if exists "Users can delete own education" on public.education;

create policy "Users can select own education"
  on public.education for select
  using (auth.uid() = user_id);

create policy "Users can insert own education"
  on public.education for insert
  with check (auth.uid() = user_id);

create policy "Users can update own education"
  on public.education for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own education"
  on public.education for delete
  using (auth.uid() = user_id);

-- Skills
drop policy if exists "Users can select own skills" on public.skills;
drop policy if exists "Users can insert own skills" on public.skills;
drop policy if exists "Users can update own skills" on public.skills;
drop policy if exists "Users can delete own skills" on public.skills;

create policy "Users can select own skills"
  on public.skills for select
  using (auth.uid() = user_id);

create policy "Users can insert own skills"
  on public.skills for insert
  with check (auth.uid() = user_id);

create policy "Users can update own skills"
  on public.skills for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own skills"
  on public.skills for delete
  using (auth.uid() = user_id);

-- Projects
drop policy if exists "Users can select own projects" on public.projects;
drop policy if exists "Users can insert own projects" on public.projects;
drop policy if exists "Users can update own projects" on public.projects;
drop policy if exists "Users can delete own projects" on public.projects;

create policy "Users can select own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Stories
drop policy if exists "Users can select own stories" on public.stories;
drop policy if exists "Users can insert own stories" on public.stories;
drop policy if exists "Users can update own stories" on public.stories;
drop policy if exists "Users can delete own stories" on public.stories;

create policy "Users can select own stories"
  on public.stories for select
  using (auth.uid() = user_id);

create policy "Users can insert own stories"
  on public.stories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own stories"
  on public.stories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own stories"
  on public.stories for delete
  using (auth.uid() = user_id);

-- Documents
drop policy if exists "Users can select own documents" on public.documents;
drop policy if exists "Users can insert own documents" on public.documents;
drop policy if exists "Users can update own documents" on public.documents;
drop policy if exists "Users can delete own documents" on public.documents;

create policy "Users can select own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can insert own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update own documents"
  on public.documents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- Document Versions
drop policy if exists "Users can select own document_versions" on public.document_versions;
drop policy if exists "Users can insert own document_versions" on public.document_versions;
drop policy if exists "Users can update own document_versions" on public.document_versions;
drop policy if exists "Users can delete own document_versions" on public.document_versions;

create policy "Users can select own document_versions"
  on public.document_versions for select
  using (auth.uid() = user_id);

create policy "Users can insert own document_versions"
  on public.document_versions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own document_versions"
  on public.document_versions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own document_versions"
  on public.document_versions for delete
  using (auth.uid() = user_id);

-- Settings
drop policy if exists "Users can select own settings" on public.settings;
drop policy if exists "Users can insert own settings" on public.settings;
drop policy if exists "Users can update own settings" on public.settings;
drop policy if exists "Users can delete own settings" on public.settings;

create policy "Users can select own settings"
  on public.settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own settings"
  on public.settings for delete
  using (auth.uid() = user_id);

-- Processed Emails
drop policy if exists "Users can select own processed_emails" on public.processed_emails;
drop policy if exists "Users can insert own processed_emails" on public.processed_emails;
drop policy if exists "Users can update own processed_emails" on public.processed_emails;
drop policy if exists "Users can delete own processed_emails" on public.processed_emails;

create policy "Users can select own processed_emails"
  on public.processed_emails for select
  using (auth.uid() = user_id);

create policy "Users can insert own processed_emails"
  on public.processed_emails for insert
  with check (auth.uid() = user_id);

create policy "Users can update own processed_emails"
  on public.processed_emails for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own processed_emails"
  on public.processed_emails for delete
  using (auth.uid() = user_id);

-- OAuth Tokens
drop policy if exists "Users can select own oauth_tokens" on public.oauth_tokens;
drop policy if exists "Users can insert own oauth_tokens" on public.oauth_tokens;
drop policy if exists "Users can update own oauth_tokens" on public.oauth_tokens;
drop policy if exists "Users can delete own oauth_tokens" on public.oauth_tokens;

create policy "Users can select own oauth_tokens"
  on public.oauth_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert own oauth_tokens"
  on public.oauth_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update own oauth_tokens"
  on public.oauth_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own oauth_tokens"
  on public.oauth_tokens for delete
  using (auth.uid() = user_id);

-- 7) Expand document types to match API
alter table public.documents
  drop constraint if exists documents_type_check;

alter table public.documents
  add constraint documents_type_check
  check (type in ('cover_letter', 'custom_question', 'resume_points', 'interview_prep'));
