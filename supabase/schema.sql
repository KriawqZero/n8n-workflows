-- Supabase schema for Marcilio Ortiz Workflows platform
-- Core user tables
create table if not exists public.users (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  billing_address jsonb,
  payment_method jsonb,
  created_at timestamp with time zone default now()
);

alter table public.users enable row level security;
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- Stripe mapping tables
create table if not exists public.customers (
  id uuid primary key references auth.users on delete cascade,
  stripe_customer_id text unique
);

alter table public.customers enable row level security;

create table if not exists public.products (
  id text primary key,
  active boolean,
  name text,
  description text,
  image text,
  metadata jsonb
);

create table if not exists public.prices (
  id text primary key,
  product_id text references public.products,
  active boolean,
  description text,
  unit_amount bigint,
  currency text check (char_length(currency) = 3),
  type text check (type in ('one_time','recurring')),
  interval text check (interval in ('day','week','month','year')),
  interval_count int,
  trial_period_days int,
  metadata jsonb
);

alter table public.products enable row level security;
alter table public.prices enable row level security;
create policy "products_public_read" on public.products for select using (true);
create policy "prices_public_read" on public.prices for select using (true);

-- Subscriptions
create type if not exists subscription_status as enum (
  'trialing','active','canceled','incomplete','incomplete_expired',
  'past_due','unpaid','paused'
);

create table if not exists public.subscriptions (
  id text primary key,
  user_id uuid not null references auth.users,
  status subscription_status,
  metadata jsonb,
  price_id text references public.prices,
  quantity int,
  cancel_at_period_end boolean,
  created timestamptz default now() not null,
  current_period_start timestamptz default now() not null,
  current_period_end timestamptz default now() not null,
  ended_at timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz
);

alter table public.subscriptions enable row level security;
create policy "subs_select_own" on public.subscriptions for select using (auth.uid() = user_id);

-- Workflows catalog
create table if not exists public.workflows (
  id bigserial primary key,
  slug text unique not null,
  title text not null,
  description text,
  tags text[] default '{}',
  original_lang text default 'en',
  content jsonb,
  status text check (status in ('free','premium')) default 'free',
  imported_at timestamptz default now(),
  title_pt text,
  description_pt text
);

alter table public.workflows enable row level security;
create policy "workflows_public" on public.workflows for select using (true);

-- Translation table for future use
create table if not exists public.workflow_translations (
  workflow_id bigint references public.workflows on delete cascade,
  language text not null,
  title text,
  description text,
  content jsonb,
  primary key (workflow_id, language)
);

alter table public.workflow_translations enable row level security;
create policy "wf_trans_public" on public.workflow_translations for select using (true);

-- Categories and tags
create table if not exists public.categories (
  id bigserial primary key,
  name text unique not null
);

create table if not exists public.tags (
  id bigserial primary key,
  name text unique not null
);

create table if not exists public.workflow_categories (
  workflow_id bigint references public.workflows on delete cascade,
  category_id bigint references public.categories on delete cascade,
  primary key (workflow_id, category_id)
);

create table if not exists public.workflow_tags (
  workflow_id bigint references public.workflows on delete cascade,
  tag_id bigint references public.tags on delete cascade,
  primary key (workflow_id, tag_id)
);

-- Logging table for ETL operations
create table if not exists public.etl_logs (
  id bigserial primary key,
  kind text,
  ref text,
  status text,
  message text,
  created_at timestamptz default now()
);
