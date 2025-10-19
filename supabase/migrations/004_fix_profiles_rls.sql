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
