-- users mirror
create table if not exists public.users (
	id uuid primary key references auth.users on delete cascade,
	full_name text,
	avatar_url text,
	billing_address jsonb,
	payment_method jsonb,
	created_at timestamptz default now()
);
alter table public.users enable row level security;
create policy if not exists "users-select-own" on public.users for select using (auth.uid() = id);
create policy if not exists "users-update-own" on public.users for update using (auth.uid() = id);

-- customers map
create table if not exists public.customers (
	id uuid primary key references auth.users on delete cascade,
	stripe_customer_id text unique
);
alter table public.customers enable row level security;

-- products and prices
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
	"interval" text check ("interval" in ('day','week','month','year')),
	interval_count int,
	trial_period_days int,
	metadata jsonb
);
alter table public.products enable row level security;
alter table public.prices enable row level security;
create policy if not exists "products-public-read" on public.products for select using (true);
create policy if not exists "prices-public-read"   on public.prices for select using (true);

-- subscriptions
create type if not exists subscription_status as enum (
	'trialing','active','canceled','incomplete','incomplete_expired','past_due','unpaid','paused'
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
	current_period_end   timestamptz default now() not null,
	ended_at timestamptz,
	cancel_at timestamptz,
	canceled_at timestamptz,
	trial_start timestamptz,
	trial_end timestamptz
);
alter table public.subscriptions enable row level security;
create policy if not exists "subs-select-own" on public.subscriptions for select using (auth.uid() = user_id);

-- view for subscriber check
create or replace view public.user_is_subscriber as
select u.id as user_id,
	exists (
		select 1 from public.subscriptions s
		where s.user_id = u.id
			and s.status in ('active','trialing','past_due')
			and s.current_period_end > now()
	) as is_subscriber
from public.users u;

-- workflows catalog
create extension if not exists pg_trgm;
create table if not exists public.workflows (
	id bigserial primary key,
	slug text unique not null,
	title text not null,
	description text,
	tags text[] default '{}',
	nodes_count int default 0,
	nodes_summary jsonb,
	source_path text,
	source_url text,
	raw_json jsonb,
	extracted_text text,
	original_lang text default 'en',
	translated_lang text default 'pt-BR',
	title_i18n jsonb,
	description_i18n jsonb,
	extracted_text_i18n jsonb,
	premium boolean default true,
	created_at timestamptz default now(),
	updated_at timestamptz default now(),
	search_vector tsvector
);

create index if not exists workflows_fts_idx on public.workflows using gin (search_vector);
create index if not exists workflows_trgm_title_idx on public.workflows using gin (title gin_trgm_ops);

create or replace function public.workflows_tsv_update() returns trigger as $$
begin
	new.search_vector :=
		setweight(to_tsvector('simple', coalesce(new.title,'')), 'A') ||
		setweight(to_tsvector('simple', coalesce(new.description,'')), 'B') ||
		setweight(to_tsvector('simple', coalesce(array_to_string(new.tags,' '),'')), 'C') ||
		setweight(to_tsvector('simple', coalesce(new.extracted_text,'')), 'C');
	return new;
end;
$$ language plpgsql;

create trigger if not exists workflows_tsv_update_tg
before insert or update on public.workflows
for each row execute function public.workflows_tsv_update();

alter table public.workflows enable row level security;
create policy if not exists "wf-public-metadata" on public.workflows for select using (true) with check (true);

-- etl logs
create table if not exists public.etl_logs (
	id bigserial primary key,
	kind text,
	ref text,
	status text,
	message text,
	created_at timestamptz default now()
);