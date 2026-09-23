drop function if exists public.attach_checkout_session(uuid, text);

create or replace function public.attach_checkout_session(p_booking_id uuid, p_session_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bookings booking
  set stripe_deposit_checkout_session_id = p_session_id, updated_at = now()
  where booking.id = p_booking_id
    and booking.status = 'hold'
    and booking.hold_expires_at > now()
    and exists (
      select 1 from public.booking_date_locks lock
      where lock.booking_id = p_booking_id
        and lock.event_date = booking.event_date
        and lock.lock_status = 'hold'
        and lock.expires_at > now()
    );
  if found then return true; end if;
  return false;
end;
$$;

revoke all on function public.attach_checkout_session(uuid, text) from public, anon, authenticated;
grant execute on function public.attach_checkout_session(uuid, text) to service_role;

create or replace function public.confirm_balance_payment(p_booking_id uuid, p_session_id text, p_payment_intent_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found'; end if;
  if v_booking.status <> 'confirmed' then raise exception 'Booking is not confirmed'; end if;
  if v_booking.balance_status = 'paid' and v_booking.stripe_balance_checkout_session_id = p_session_id then return; end if;
  if v_booking.stripe_balance_checkout_session_id is distinct from p_session_id then raise exception 'Balance checkout session mismatch'; end if;
  update public.bookings
  set balance_status = 'paid', stripe_balance_payment_intent_id = nullif(p_payment_intent_id,''), updated_at = now()
  where id = p_booking_id;
end;
$$;
