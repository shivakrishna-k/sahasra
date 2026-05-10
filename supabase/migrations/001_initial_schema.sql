-- weight_entries
create table weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric(4,1) not null,
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);
alter table weight_entries enable row level security;
create policy "Users manage own weight entries"
  on weight_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- training_sessions
create table training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null check (type in ('sparring','running','cardio','strength')),
  duration_minutes integer not null check (duration_minutes > 0),
  notes text,
  created_at timestamptz not null default now()
);
alter table training_sessions enable row level security;
create policy "Users manage own training sessions"
  on training_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_settings
create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  target_weight_kg numeric(4,1) not null default 54.0,
  start_weight_kg numeric(4,1),
  reminder_time time not null default '21:00',
  notifications_enabled boolean not null default false,
  push_subscription jsonb
);
alter table user_settings enable row level security;
create policy "Users manage own settings"
  on user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
