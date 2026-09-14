grant execute on function public.public_date_availability(date) to service_role;
grant execute on function public.acquire_booking_hold(uuid,date,text,text,text,text,text,text,text,text) to service_role;
grant execute on function public.attach_checkout_session(uuid,text) to service_role;
grant execute on function public.release_booking_hold(uuid) to service_role;
grant execute on function public.confirm_booking_from_stripe(uuid,text,text,integer,text) to service_role;
grant execute on function public.confirm_balance_payment(uuid,text,text) to service_role;
grant execute on function public.cleanup_expired_holds() to service_role;
