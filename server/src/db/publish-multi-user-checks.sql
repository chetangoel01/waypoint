-- Preflight checks for multi-user publish
-- Run this first and resolve any non-zero results before applying migrations.

-- Duplicate profiles per user
select user_id, count(*)
from public.profile
group by user_id
having count(*) > 1;

-- Duplicate processed emails per user
select user_id, email_id, count(*)
from public.processed_emails
group by user_id, email_id
having count(*) > 1;

-- Null user_id checks
select 'applications' as table, count(*) from public.applications where user_id is null
union all select 'document_versions', count(*) from public.document_versions where user_id is null
union all select 'documents', count(*) from public.documents where user_id is null
union all select 'education', count(*) from public.education where user_id is null
union all select 'oauth_tokens', count(*) from public.oauth_tokens where user_id is null
union all select 'processed_emails', count(*) from public.processed_emails where user_id is null
union all select 'profile', count(*) from public.profile where user_id is null
union all select 'projects', count(*) from public.projects where user_id is null
union all select 'settings', count(*) from public.settings where user_id is null
union all select 'skills', count(*) from public.skills where user_id is null
union all select 'stories', count(*) from public.stories where user_id is null
union all select 'work_experience', count(*) from public.work_experience where user_id is null;
