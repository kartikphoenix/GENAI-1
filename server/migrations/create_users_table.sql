-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create users table
create table if not exists public.users (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  password text not null,
  role text not null default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Disable RLS (Row Level Security) for now
alter table public.users disable row level security; 