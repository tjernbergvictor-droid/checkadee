-- Checkadee cloud sync schema
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> Run).

create table if not exists public.user_lists (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_lists enable row level security;

create policy "Users can read their own lists"
  on public.user_lists for select
  using (auth.uid() = user_id);

create policy "Users can insert their own lists"
  on public.user_lists for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own lists"
  on public.user_lists for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
