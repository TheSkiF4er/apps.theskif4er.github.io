-- FPV table sync schema for Supabase
-- Default password: fpv58
-- SHA-256(fpv58): c415fa767c6a3edc746874be3aa962663421a7db9ed7f1823b07349e72cd90de

create extension if not exists pgcrypto;

create table if not exists public.page_access (
  id integer primary key default 1 check (id = 1),
  password_hash text not null,
  updated_at timestamptz not null default now()
);

insert into public.page_access (id, password_hash)
values (1, 'c415fa767c6a3edc746874be3aa962663421a7db9ed7f1823b07349e72cd90de')
on conflict (id) do nothing;

create table if not exists public.cell_marks (
  cell_id text primary key,
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  updated_at timestamptz not null default now()
);

create table if not exists public.legend_items (
  color text primary key check (color ~ '^#[0-9A-Fa-f]{6}$'),
  label text not null,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists page_access_touch_updated_at on public.page_access;
create trigger page_access_touch_updated_at
before update on public.page_access
for each row execute function public.touch_updated_at();

drop trigger if exists cell_marks_touch_updated_at on public.cell_marks;
create trigger cell_marks_touch_updated_at
before update on public.cell_marks
for each row execute function public.touch_updated_at();

drop trigger if exists legend_items_touch_updated_at on public.legend_items;
create trigger legend_items_touch_updated_at
before update on public.legend_items
for each row execute function public.touch_updated_at();

alter table public.page_access enable row level security;
alter table public.cell_marks enable row level security;
alter table public.legend_items enable row level security;

drop policy if exists "page_access_read_all" on public.page_access;
create policy "page_access_read_all"
on public.page_access
for select
to anon
using (true);

drop policy if exists "cell_marks_read_all" on public.cell_marks;
create policy "cell_marks_read_all"
on public.cell_marks
for select
to anon
using (true);

drop policy if exists "cell_marks_insert_all" on public.cell_marks;
create policy "cell_marks_insert_all"
on public.cell_marks
for insert
to anon
with check (true);

drop policy if exists "cell_marks_update_all" on public.cell_marks;
create policy "cell_marks_update_all"
on public.cell_marks
for update
to anon
using (true)
with check (true);

drop policy if exists "cell_marks_delete_all" on public.cell_marks;
create policy "cell_marks_delete_all"
on public.cell_marks
for delete
to anon
using (true);

drop policy if exists "legend_items_read_all" on public.legend_items;
create policy "legend_items_read_all"
on public.legend_items
for select
to anon
using (true);

drop policy if exists "legend_items_insert_all" on public.legend_items;
create policy "legend_items_insert_all"
on public.legend_items
for insert
to anon
with check (true);

drop policy if exists "legend_items_update_all" on public.legend_items;
create policy "legend_items_update_all"
on public.legend_items
for update
to anon
using (true)
with check (true);

drop policy if exists "legend_items_delete_all" on public.legend_items;
create policy "legend_items_delete_all"
on public.legend_items
for delete
to anon
using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'cell_marks'
  ) then
    alter publication supabase_realtime add table public.cell_marks;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'legend_items'
  ) then
    alter publication supabase_realtime add table public.legend_items;
  end if;
end $$;

-- Optional: change password later
-- update public.page_access
-- set password_hash = 'PASTE_NEW_SHA256_HASH_HERE'
-- where id = 1;
