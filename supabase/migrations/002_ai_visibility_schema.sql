-- Drop old tables if they exist (for fresh start)
drop table if exists evals cascade;
drop table if exists eval_config cascade;

-- Create projects table (user's brands/websites)
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  website_url text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create keywords table
create table if not exists keywords (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  keyword text not null,
  created_at timestamp with time zone default now()
);

-- Create competitors table
create table if not exists competitors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  website_url text not null,
  created_at timestamp with time zone default now()
);

-- Create search_results table (tracks visibility over time)
create table if not exists search_results (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  keyword_id uuid not null references keywords(id) on delete cascade,
  engine text not null, -- 'gemini', 'chatgpt', 'perplexity'
  found boolean not null,
  position integer,
  citation_count integer,
  full_response text,
  created_at timestamp with time zone default now()
);

-- Create indexes
create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_keywords_project_id on keywords(project_id);
create index if not exists idx_competitors_project_id on competitors(project_id);
create index if not exists idx_search_results_project_id on search_results(project_id);
create index if not exists idx_search_results_keyword_id on search_results(keyword_id);
create index if not exists idx_search_results_created_at on search_results(created_at desc);

-- Enable RLS
alter table projects enable row level security;
alter table keywords enable row level security;
alter table competitors enable row level security;
alter table search_results enable row level security;

-- RLS Policies for projects
create policy "Users can read their own projects"
  on projects for select
  using (auth.uid() = user_id);

create policy "Users can insert their own projects"
  on projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own projects"
  on projects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own projects"
  on projects for delete
  using (auth.uid() = user_id);

-- RLS Policies for keywords
create policy "Users can read keywords from their projects"
  on keywords for select
  using (
    exists (
      select 1 from projects
      where projects.id = keywords.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert keywords to their projects"
  on keywords for insert
  with check (
    exists (
      select 1 from projects
      where projects.id = keywords.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete keywords from their projects"
  on keywords for delete
  using (
    exists (
      select 1 from projects
      where projects.id = keywords.project_id
      and projects.user_id = auth.uid()
    )
  );

-- RLS Policies for competitors
create policy "Users can read competitors from their projects"
  on competitors for select
  using (
    exists (
      select 1 from projects
      where projects.id = competitors.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert competitors to their projects"
  on competitors for insert
  with check (
    exists (
      select 1 from projects
      where projects.id = competitors.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete competitors from their projects"
  on competitors for delete
  using (
    exists (
      select 1 from projects
      where projects.id = competitors.project_id
      and projects.user_id = auth.uid()
    )
  );

-- RLS Policies for search_results
create policy "Users can read search results from their projects"
  on search_results for select
  using (
    exists (
      select 1 from projects
      where projects.id = search_results.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert search results to their projects"
  on search_results for insert
  with check (
    exists (
      select 1 from projects
      where projects.id = search_results.project_id
      and projects.user_id = auth.uid()
    )
  );
