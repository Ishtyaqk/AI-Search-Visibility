-- Fix: Add IF NOT EXISTS to all policies to prevent duplicate errors
-- This migration adds a trigger to automatically create profiles when users sign up

-- Create a function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Create trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
