-- Reel render tracking for the Remotion pipeline (reels-v1).
-- Run in the Supabase SQL editor, then create a PUBLIC storage bucket
-- named `social-videos` (Storage -> New bucket -> public).

create table if not exists reel_renders (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  composition text not null check (composition in ('manifestation','elements')),
  status text not null default 'rendering' check (status in ('rendering','done','error')),
  video_url text,
  caption text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (date, composition)
);

alter table reel_renders enable row level security;

-- Dashboard users read; only the render server (service role, bypasses RLS) writes.
create policy "Authenticated users can read reel renders"
  on reel_renders for select to authenticated using (true);
