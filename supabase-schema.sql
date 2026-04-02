-- VANTAGE: Full schema with tri-signal + regional intelligence
-- Run this in Supabase Dashboard > SQL Editor

create table if not exists articles (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  headline text not null,
  subheadline text,
  category text,
  region text default 'global',
  what_happened text,
  why_it_matters text,
  who_wins_loses text,
  what_to_watch text,
  full_body text not null,
  source_urls text[],
  source_headlines text[],
  signal_score integer default 0,
  signal_sources text[],
  social_context text,
  published_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security but allow public reads
alter table articles enable row level security;

create policy "Allow public read access"
  on articles for select
  using (true);

create policy "Allow service role full access"
  on articles for all
  using (auth.role() = 'service_role');

-- Subscribers for daily digest
create table if not exists subscribers (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  subscribed_at timestamp with time zone default now()
);

alter table subscribers enable row level security;

create policy "Allow service role manage subscribers"
  on subscribers for all
  using (auth.role() = 'service_role');

-- Migration for existing tables (run if articles table already exists):
-- ALTER TABLE articles ADD COLUMN IF NOT EXISTS region text DEFAULT 'global';
