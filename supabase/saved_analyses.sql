-- TrueSharpe: per-user saved analyses (strategy history).
--
-- Run this ONCE in the Supabase dashboard -> SQL Editor -> New query -> Run.
-- Row-Level Security guarantees a user can only ever read/insert/delete their
-- OWN rows, so "must be signed in to see your saved analyses" is enforced at
-- the database, not just the UI. No service key is needed; the app uses each
-- user's own session token.

create table if not exists public.saved_analyses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
              references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  name        text,
  summary     jsonb,   -- small: verdict level, headline, key stats (for the list)
  payload     jsonb    -- the full analysis (to re-open the report)
);

alter table public.saved_analyses enable row level security;

drop policy if exists "saved_analyses owner select" on public.saved_analyses;
create policy "saved_analyses owner select" on public.saved_analyses
  for select using (auth.uid() = user_id);

drop policy if exists "saved_analyses owner insert" on public.saved_analyses;
create policy "saved_analyses owner insert" on public.saved_analyses
  for insert with check (auth.uid() = user_id);

drop policy if exists "saved_analyses owner delete" on public.saved_analyses;
create policy "saved_analyses owner delete" on public.saved_analyses
  for delete using (auth.uid() = user_id);

create index if not exists saved_analyses_user_created
  on public.saved_analyses (user_id, created_at desc);
