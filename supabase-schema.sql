-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Businesses table
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  name text not null,
  description text,
  product_or_service text check (product_or_service in ('product', 'service', 'both')),
  what_they_sell text,
  industry text,
  target_audience text,
  demographics jsonb default '{}',
  locations jsonb default '[]',
  competitors text[] default '{}',
  logo_url text,
  imagery_urls text[] default '{}',
  analytics_connected boolean default false,
  crm_connected boolean default false,
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Campaigns table
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses on delete cascade,
  month integer not null check (month in (1, 2, 3)),
  theme text,
  audience_breakdown jsonb default '{}',
  suggested_channels jsonb default '[]',
  budget_breakdown jsonb default '{}',
  funnel jsonb default '{}',
  raw_content text,
  status text default 'draft' check (status in ('draft', 'active', 'completed')),
  created_at timestamptz default now()
);

-- Ad creatives table
create table if not exists ad_creatives (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns on delete cascade,
  business_id uuid references businesses on delete cascade,
  funnel_stage text not null check (funnel_stage in ('tof', 'mof', 'bof')),
  variant integer not null check (variant between 1 and 3),
  format text,
  headline text,
  copy text,
  cta text,
  html_content text,
  created_at timestamptz default now()
);

-- Prospects table
create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses on delete cascade,
  name text,
  company text,
  email text,
  phone text,
  linkedin_url text,
  tier integer check (tier in (1, 2, 3)),
  tier_reasoning text,
  company_size text,
  estimated_revenue text,
  years_in_business integer,
  company_news text,
  lead_score integer default 0,
  behavioural_score integer default 0,
  firmographic_score integer default 0,
  status text default 'prospect' check (status in ('prospect', 'contacted', 'qualified', 'negotiating', 'customer', 'lost')),
  touchpoints jsonb default '[]',
  source text default 'csv_upload',
  custom_fields jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Lead score events table
create table if not exists lead_score_events (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects on delete cascade,
  business_id uuid references businesses on delete cascade,
  event_type text not null check (event_type in ('ad_click', 'email_open', 'email_click', 'website_visit', 'website_revisit', 'contact_form', 'firmographic')),
  points integer not null,
  note text,
  created_at timestamptz default now()
);

-- Sales strategies table
create table if not exists sales_strategies (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses on delete cascade,
  prospect_id uuid references prospects on delete cascade,
  suggested_channel text,
  message_template text,
  follow_up_sequence jsonb default '[]',
  positive_response_strategy text,
  negative_response_strategy text,
  created_at timestamptz default now()
);

-- Customers (converted prospects)
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses on delete cascade,
  prospect_id uuid references prospects,
  name text not null,
  company text,
  email text,
  contract_value numeric default 0,
  close_date date,
  marketing_spend_attributed numeric default 0,
  created_at timestamptz default now()
);

-- ROI records
create table if not exists roi_records (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses on delete cascade,
  month integer,
  ad_spend numeric default 0,
  revenue_generated numeric default 0,
  new_customers integer default 0,
  roi_percentage numeric,
  cac numeric,
  ltv numeric,
  calculated_at timestamptz default now()
);

-- Row Level Security
alter table businesses enable row level security;
alter table campaigns enable row level security;
alter table ad_creatives enable row level security;
alter table prospects enable row level security;
alter table lead_score_events enable row level security;
alter table sales_strategies enable row level security;
alter table customers enable row level security;
alter table roi_records enable row level security;

-- RLS Policies
create policy "Users can manage their own business" on businesses
  for all using (auth.uid() = user_id);

create policy "Users can manage their campaigns" on campaigns
  for all using (
    business_id in (select id from businesses where user_id = auth.uid())
  );

create policy "Users can manage their ad creatives" on ad_creatives
  for all using (
    business_id in (select id from businesses where user_id = auth.uid())
  );

create policy "Users can manage their prospects" on prospects
  for all using (
    business_id in (select id from businesses where user_id = auth.uid())
  );

create policy "Users can manage their lead score events" on lead_score_events
  for all using (
    business_id in (select id from businesses where user_id = auth.uid())
  );

create policy "Users can manage their sales strategies" on sales_strategies
  for all using (
    business_id in (select id from businesses where user_id = auth.uid())
  );

create policy "Users can manage their customers" on customers
  for all using (
    business_id in (select id from businesses where user_id = auth.uid())
  );

create policy "Users can manage their ROI records" on roi_records
  for all using (
    business_id in (select id from businesses where user_id = auth.uid())
  );

-- Storage bucket for business assets
insert into storage.buckets (id, name, public) values ('business-assets', 'business-assets', true)
  on conflict (id) do nothing;

create policy "Users can upload their own assets" on storage.objects
  for insert with check (bucket_id = 'business-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view business assets" on storage.objects
  for select using (bucket_id = 'business-assets');

create policy "Users can delete their own assets" on storage.objects
  for delete using (bucket_id = 'business-assets' and auth.uid()::text = (storage.foldername(name))[1]);
