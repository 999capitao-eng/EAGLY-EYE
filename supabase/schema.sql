-- Cole tudo isso no Supabase > SQL Editor > Run

create table if not exists lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  niche text,
  created_at timestamptz default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  list_id uuid not null references lists(id) on delete cascade,
  niche text,
  name text not null,
  phone text,
  city text,
  address text,
  website text,
  instagram text,
  sources text[] default '{}',
  status text not null default 'a_abordar' check (status in ('a_abordar','abordado')),
  contacted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists api_usage (
  provider text not null,
  month text not null,
  count int not null default 0,
  primary key (provider, month)
);

alter table lists enable row level security;
alter table leads enable row level security;
alter table api_usage enable row level security; -- sem policy: só o servidor acessa

create policy "lists_own" on lists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "leads_own" on leads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists leads_list_idx on leads(list_id);
