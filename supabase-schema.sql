-- Run this in your Supabase SQL editor (supabase.com → project → SQL Editor)

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  name text not null,
  xp integer not null default 0,
  streak integer not null default 0,
  last_task_date date,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  title text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  completed boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists taunts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  from_name text not null,
  message text not null,
  created_at timestamptz default now()
);

-- Enable RLS but allow all operations via anon key (public app, no auth)
alter table sessions enable row level security;
alter table players  enable row level security;
alter table tasks    enable row level security;
alter table taunts   enable row level security;

create policy "public_all_sessions" on sessions for all using (true) with check (true);
create policy "public_all_players"  on players  for all using (true) with check (true);
create policy "public_all_tasks"    on tasks    for all using (true) with check (true);
create policy "public_all_taunts"   on taunts   for all using (true) with check (true);
