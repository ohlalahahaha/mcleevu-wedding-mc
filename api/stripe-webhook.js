import { sendJson, readRaw, verifyStripeSignature, env, rpc, supabase, sendBookingEmails, createCalendarEvent } from './_lib.js';

export const config = { api: { bodyParser: false } };

async function fetchBooking(id) {
  const rows = await supabase(`bookings?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { method: 'GET' });
  return rows?.[0] || null;
}

async function markSync(id, patch) {
  try {
    await supabase(`bookings?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify(patch) });
  } catch { /* booking remains confirmed */ }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  const raw = await readRaw(req);
  const signature = req.headers['stripe-signature'];
  const secret = env('STRIPE_WEBHOOK_SECRET', true);
  if (!verifyStripeSignature(raw, signature, secret)) return sendJson(res, 400, { error: 'Invalid Stripe signature' });

  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch { return sendJson(res, 400, { error: 'Invalid event' }); }

  try {
    const inserted = await supabase('stripe_webhook_events?on_conflict=stripe_event_id', {
      method: 'POST',
      headers: { prefer: 'resolution=ignore-duplicates,return=representation' },
      body: JSON.stringify({ stripe_event_id: event.id, type: event.type }),
    });
    if (Array.isArray(inserted) && inserted.length === 0) return sendJson(res, 200, { received: true, duplicate: true });
  } catch { /* booking RPCs remain idempotent */ }

  const session = event.data?.object;
  const bookingId = session?.metadata?.booking_id || session?.client_reference_id;
  const paymentType = session?.metadata?.payment_type;

  try {
    if (event.type === 'checkout.session.completed' && bookingId) {
      if (session.payment_status !== 'paid' || session.amount_total !== 50000 || String(session.currency).toLowerCase() !== 'aud') throw new Error('Unexpected Stripe payment state');
      if (paymentType === 'balance') {
        await rpc('confirm_balance_payment', { p_booking_id: bookingId, p_session_id: session.id, p_payment_intent_id: session.payment_intent || '' });
        return sendJson(res, 200, { received: true });
      }
      await rpc('confirm_booking_from_stripe', {
        p_booking_id: bookingId,
        p_session_id: session.id,
        p_payment_intent_id: session.payment_intent || '',
        p_amount_total: session.amount_total || 0,
        p_currency: session.currency || '',
      });
      const booking = await fetchBooking(bookingId);
      if (booking) {
        try {
          const calendar = await createCalendarEvent(booking);
          if (calendar.created) await markSync(bookingId, { google_calendar_event_id: calendar.id, calendar_sync_status: 'synced' });
          else await markSync(bookingId, { calendar_sync_status: 'not_configured' });
        } catch { await markSync(bookingId, { calendar_sync_status: 'retry_required' }); }
        try { await sendBookingEmails(booking); } catch { /* payment remains authoritative */ }
      }
    }
    if (event.type === 'checkout.session.expired' && bookingId && paymentType !== 'balance') await rpc('release_booking_hold', { p_booking_id: bookingId });
    return sendJson(res, 200, { received: true });
  } catch {
    return sendJson(res, 500, { error: 'Webhook processing failed' });
  }
}
