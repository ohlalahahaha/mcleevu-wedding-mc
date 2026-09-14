create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  status text not null default 'hold' check (status in ('hold','confirmed','cancelled')),
  hold_expires_at timestamptz,
  customer_name text not null,
  partner_name text not null,
  email text not null,
  phone text not null,
  venue_name text,
  venue_address text,
  language_preference text not null default 'bilingual' check (language_preference in ('english','vietnamese','bilingual')),
  notes text,
  total_amount_cents integer not null default 100000 check (total_amount_cents = 100000),
  deposit_amount_cents integer not null default 50000 check (deposit_amount_cents = 50000),
  deposit_status text not null default 'unpaid' check (deposit_status in ('unpaid','paid','refunded')),
  balance_amount_cents integer not null default 50000 check (balance_amount_cents = 50000),
  balance_status text not null default 'unpaid' check (balance_status in ('unpaid','checkout_sent','paid','refunded')),
  stripe_customer_id text,
  stripe_deposit_checkout_session_id text unique,
  stripe_deposit_payment_intent_id text,
  stripe_balance_checkout_session_id text unique,
  stripe_balance_payment_intent_id text,
  google_calendar_event_id text,
  calendar_sync_status text not null default 'pending',
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_date_locks (
  event_date date primary key,
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  lock_status text not null check (lock_status in ('hold','confirmed')),
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.blocked_dates (
  event_date date primary key,
  reason text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  wedding_label text,
  quote text not null,
  source text,
  consent_to_publish boolean not null default false,
  visible boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_webhook_events (
  stripe_event_id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

alter table public.bookings enable row level security;
alter table public.booking_date_locks enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.testimonials enable row level security;
alter table public.stripe_webhook_events enable row level security;

create or replace function public.public_date_availability(p_event_date date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lock public.booking_date_locks%rowtype;
begin
  if p_event_date < (now() at time zone 'Australia/Sydney')::date then return 'unavailable'; end if;
  if exists(select 1 from public.blocked_dates where event_date = p_event_date) then return 'unavailable'; end if;
  select * into v_lock from public.booking_date_locks where event_date = p_event_date;
  if not found then return 'available'; end if;
  if v_lock.lock_status = 'confirmed' then return 'unavailable'; end if;
  if v_lock.expires_at is not null and v_lock.expires_at > now() then return 'held'; end if;
  return 'available';
end;
$$;

create or replace function public.acquire_booking_hold(
  p_booking_id uuid,
  p_event_date date,
  p_customer_name text,
  p_partner_name text,
  p_email text,
  p_phone text,
  p_venue_name text default null,
  p_venue_address text default null,
  p_language_preference text default 'bilingual',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.booking_date_locks%rowtype;
  v_expiry timestamptz := now() + interval '30 minutes';
begin
  perform pg_advisory_xact_lock(hashtext(p_event_date::text));
  if p_event_date < (now() at time zone 'Australia/Sydney')::date then raise exception 'Date is in the past'; end if;
  if exists(select 1 from public.blocked_dates where event_date = p_event_date) then raise exception 'Date is blocked'; end if;
  select * into v_existing from public.booking_date_locks where event_date = p_event_date for update;
  if found then
    if v_existing.lock_status = 'confirmed' then raise exception 'Date already booked'; end if;
    if v_existing.expires_at is not null and v_existing.expires_at > now() then raise exception 'Date temporarily held'; end if;
    update public.bookings set status = 'cancelled', updated_at = now() where id = v_existing.booking_id and status = 'hold';
    delete from public.booking_date_locks where event_date = p_event_date;
  end if;
  insert into public.bookings (id,event_date,status,hold_expires_at,customer_name,partner_name,email,phone,venue_name,venue_address,language_preference,notes)
  values (p_booking_id,p_event_date,'hold',v_expiry,p_customer_name,p_partner_name,p_email,p_phone,nullif(p_venue_name,''),nullif(p_venue_address,''),p_language_preference,nullif(p_notes,''));
  insert into public.booking_date_locks(event_date,booking_id,lock_status,expires_at) values (p_event_date,p_booking_id,'hold',v_expiry);
  return p_booking_id;
end;
$$;

create or replace function public.attach_checkout_session(p_booking_id uuid, p_session_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bookings set stripe_deposit_checkout_session_id = p_session_id, updated_at = now() where id = p_booking_id and status = 'hold';
end;
$$;

create or replace function public.release_booking_hold(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.booking_date_locks where booking_id = p_booking_id and lock_status = 'hold';
  update public.bookings set status = 'cancelled', updated_at = now() where id = p_booking_id and status = 'hold';
end;
$$;

create or replace function public.confirm_booking_from_stripe(
  p_booking_id uuid,
  p_session_id text,
  p_payment_intent_id text,
  p_amount_total integer,
  p_currency text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
begin
  if p_amount_total <> 50000 or lower(p_currency) <> 'aud' then raise exception 'Unexpected Stripe amount or currency'; end if;
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found'; end if;
  if v_booking.status = 'confirmed' and v_booking.deposit_status = 'paid' then return; end if;
  if v_booking.status <> 'hold' then raise exception 'Booking is not on hold'; end if;
  if v_booking.stripe_deposit_checkout_session_id is distinct from p_session_id then raise exception 'Checkout session mismatch'; end if;
  update public.bookings set status = 'confirmed', hold_expires_at = null, deposit_status = 'paid', stripe_deposit_payment_intent_id = nullif(p_payment_intent_id,''), updated_at = now() where id = p_booking_id;
  update public.booking_date_locks set lock_status = 'confirmed', expires_at = null, updated_at = now() where booking_id = p_booking_id;
end;
$$;

create or replace function public.confirm_balance_payment(p_booking_id uuid, p_session_id text, p_payment_intent_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bookings set balance_status = 'paid', stripe_balance_checkout_session_id = p_session_id, stripe_balance_payment_intent_id = nullif(p_payment_intent_id,''), updated_at = now()
  where id = p_booking_id and status = 'confirmed' and balance_status <> 'paid';
end;
$$;

create or replace function public.cleanup_expired_holds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with expired as (
    delete from public.booking_date_locks where lock_status = 'hold' and expires_at <= now() returning booking_id
  )
  update public.bookings b set status = 'cancelled', updated_at = now() where b.id in (select booking_id from expired) and b.status = 'hold';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.public_date_availability(date) from public, anon, authenticated;
revoke all on function public.acquire_booking_hold(uuid,date,text,text,text,text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.attach_checkout_session(uuid,text) from public, anon, authenticated;
revoke all on function public.release_booking_hold(uuid) from public, anon, authenticated;
revoke all on function public.confirm_booking_from_stripe(uuid,text,text,integer,text) from public, anon, authenticated;
revoke all on function public.confirm_balance_payment(uuid,text,text) from public, anon, authenticated;
revoke all on function public.cleanup_expired_holds() from public, anon, authenticated;
