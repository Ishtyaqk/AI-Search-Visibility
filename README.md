# 🧠 AI Agent Evaluation Framework

A full-stack Next.js + Supabase web app for evaluating and monitoring AI agents, built as part of the Icecreamlabs Full-Stack Developer Assignment.

---

## 🚀 Overview

Each user can:
- Configure their AI evaluation settings.
- Upload or simulate evaluation results.
- View dashboards with key metrics such as accuracy, latency, and PII redaction rate.
- Drill down into detailed evaluation records.

The app demonstrates:
- Multi-tenancy using Supabase Auth + Row Level Security (RLS)
- Real-time dashboards with Recharts
- REST API ingestion endpoint for evaluation data
- Scalable schema handling up to 20,000 rows

---

## 🏗️ Tech Stack

- **Frontend:** Next.js 14, TypeScript, TailwindCSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **Charts:** Recharts / Chart.js
- **Deployment:** Vercel
- **Seed Script:** Node.js (faker.js)

---

## 🧩 Database Schema

-- Fix RLS policy on profiles table to allow trigger to insert
-- The trigger function needs to be able to insert profiles for new users

-- Drop the restrictive insert policy
drop policy if exists "Users can insert their own profiles" on profiles;

-- Create a new policy that allows both users and the trigger function to insert
create policy "Allow profile creation"
  on profiles for insert
  with check (true);

-- Keep the select and update policies restrictive
drop policy if exists "Users can read their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;

create policy "Users can read their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);


---

## 🔐 RLS Policies

Enable Row Level Security on `evals` and `eval_config`.

```sql
alter table evals enable row level security;
alter table eval_config enable row level security;

create policy "Users can read their own data"
on evals for select
using (auth.uid() = user_id);

create policy "Users can insert their own data"
on evals for insert
with check (auth.uid() = user_id);
