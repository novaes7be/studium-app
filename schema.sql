-- Run this in Supabase SQL Editor

-- Subjects table
create table subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  color text default '#8757BA',
  created_at timestamptz default now()
);
alter table subjects enable row level security;
create policy "Users manage own subjects" on subjects
  for all using (auth.uid() = user_id);

-- PDFs table
create table pdfs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  name text not null,
  storage_path text not null,
  size bigint,
  annotation_count int default 0,
  created_at timestamptz default now()
);
alter table pdfs enable row level security;
create policy "Users manage own pdfs" on pdfs
  for all using (auth.uid() = user_id);

-- Notes table
create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  pdf_id uuid references pdfs(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);
alter table notes enable row level security;
create policy "Users manage own notes" on notes
  for all using (auth.uid() = user_id);

-- Storage bucket (run in Supabase dashboard > Storage)
-- Create a bucket named "pdfs" with RLS enabled
