create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  goal text,
  water_goal_ml integer not null default 2500,
  weight numeric(5,2),
  weight_goal numeric(5,2),
  xp integer not null default 0,
  coins integer not null default 0,
  streak integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  name text not null,
  meal_time time not null,
  items text,
  xp_reward integer not null default 10,
  sort_order integer not null default 0
);

create table if not exists meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  meal_id uuid not null references meals(id) on delete cascade,
  log_date date not null default current_date,
  completed boolean not null default true,
  completed_at timestamptz not null default now(),
  unique(user_id, meal_id, log_date)
);

create table if not exists water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  amount_ml integer not null,
  logged_at timestamptz not null default now()
);

create table if not exists rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  name text not null,
  coin_cost integer not null check (coin_cost > 0),
  created_at timestamptz not null default now()
);
