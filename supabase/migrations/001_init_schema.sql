-- Create profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create eval_config table
create table if not exists eval_config (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  metrics jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create evals table
create table if not exists evals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  config_id uuid not null references eval_config(id) on delete cascade,
  input text not null,
  output text not null,
  score numeric,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Create indexes
create index if not exists idx_eval_config_user_id on eval_config(user_id);
create index if not exists idx_evals_user_id on evals(user_id);
create index if not exists idx_evals_config_id on evals(config_id);
create index if not exists idx_evals_created_at on evals(created_at desc);

-- Enable RLS
alter table profiles enable row level security;
alter table eval_config enable row level security;
alter table evals enable row level security;

-- RLS Policies for profiles
create policy "Users can read their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- RLS Policies for eval_config
create policy "Users can read their own eval configs"
  on eval_config for select
  using (auth.uid() = user_id);

create policy "Users can insert their own eval configs"
  on eval_config for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own eval configs"
  on eval_config for update
  using (auth.uid() = user_id);

create policy "Users can delete their own eval configs"
  on eval_config for delete
  using (auth.uid() = user_id);

-- RLS Policies for evals
create policy "Users can read their own data"
  on evals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own data"
  on evals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own data"
  on evals for update
  using (auth.uid() = user_id);

create policy "Users can delete their own data"
  on evals for delete
  using (auth.uid() = user_id);
