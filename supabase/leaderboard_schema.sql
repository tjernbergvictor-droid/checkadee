-- Checkadee friend leaderboard schema
-- Run this once in the Supabase SQL Editor, after supabase/schema.sql.
-- Unlike user_lists (private, only readable by its owner), this table is
-- readable by any signed-in user -- but only ever contains what people have
-- explicitly opted to share (see the "Visa i topplistan" toggle per list).

create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  list_id uuid not null,
  display_name text not null,
  source text not null,
  list_name text not null,
  seen_count integer not null default 0,
  last_species_name text,
  last_species_date date,
  updated_at timestamptz not null default now(),
  unique (user_id, list_id)
);

alter table public.leaderboard_entries enable row level security;

create policy "Any signed-in user can read the leaderboard"
  on public.leaderboard_entries for select
  using (auth.uid() is not null);

create policy "Users can insert their own leaderboard entries"
  on public.leaderboard_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own leaderboard entries"
  on public.leaderboard_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own leaderboard entries"
  on public.leaderboard_entries for delete
  using (auth.uid() = user_id);
