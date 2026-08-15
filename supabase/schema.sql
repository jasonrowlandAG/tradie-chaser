-- TradieChaser MVP Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  business_name text,
  phone text,
  bank_details text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Invoices
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  client_name text not null,
  client_phone text,
  client_email text,
  amount numeric(12,2) not null,
  currency text default 'AUD',
  due_date date not null,
  invoice_number text,
  description text,
  status text default 'outstanding' check (status in ('outstanding', 'paid')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Reminders
create table public.reminders (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  channel text not null check (channel in ('sms', 'email')),
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status text default 'pending' check (status in ('pending', 'sent', 'failed', 'cancelled')),
  error_message text,
  created_at timestamptz default now()
);

-- Indexes
create index invoices_user_id_idx on public.invoices(user_id);
create index invoices_status_idx on public.invoices(status);
create index reminders_scheduled_for_idx on public.reminders(scheduled_for) where status = 'pending';
create index reminders_invoice_id_idx on public.reminders(invoice_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.invoices enable row level security;
alter table public.reminders enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Invoices policies
create policy "Users can view own invoices"
  on public.invoices for select
  using (auth.uid() = user_id);

create policy "Users can insert own invoices"
  on public.invoices for insert
  with check (auth.uid() = user_id);

create policy "Users can update own invoices"
  on public.invoices for update
  using (auth.uid() = user_id);

create policy "Users can delete own invoices"
  on public.invoices for delete
  using (auth.uid() = user_id);

-- Reminders policies (via invoice ownership)
create policy "Users can view own reminders"
  on public.reminders for select
  using (
    exists (
      select 1 from public.invoices
      where invoices.id = reminders.invoice_id
      and invoices.user_id = auth.uid()
    )
  );

create policy "Users can insert own reminders"
  on public.reminders for insert
  with check (
    exists (
      select 1 from public.invoices
      where invoices.id = reminders.invoice_id
      and invoices.user_id = auth.uid()
    )
  );

create policy "Users can update own reminders"
  on public.reminders for update
  using (
    exists (
      select 1 from public.invoices
      where invoices.id = reminders.invoice_id
      and invoices.user_id = auth.uid()
    )
  );

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, business_name)
  values (new.id, new.raw_user_meta_data->>'business_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper: cancel future reminders when invoice is paid
create or replace function public.cancel_reminders_on_paid()
returns trigger as $$
begin
  if new.status = 'paid' and old.status = 'outstanding' then
    update public.reminders
    set status = 'cancelled'
    where invoice_id = new.id
    and status = 'pending';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_invoice_paid
  after update on public.invoices
  for each row execute procedure public.cancel_reminders_on_paid();
