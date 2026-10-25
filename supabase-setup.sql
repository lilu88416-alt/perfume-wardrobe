-- Run once in Supabase Dashboard > SQL Editor
create table if not exists public.perfume_wardrobes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.perfume_wardrobes enable row level security;
revoke all on public.perfume_wardrobes from anon;
grant select, insert, update on public.perfume_wardrobes to authenticated;
drop policy if exists "owner read" on public.perfume_wardrobes;
drop policy if exists "owner insert" on public.perfume_wardrobes;
drop policy if exists "owner update" on public.perfume_wardrobes;
create policy "owner read" on public.perfume_wardrobes for select to authenticated using (auth.uid() = user_id);
create policy "owner insert" on public.perfume_wardrobes for insert to authenticated with check (auth.uid() = user_id);
create policy "owner update" on public.perfume_wardrobes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
