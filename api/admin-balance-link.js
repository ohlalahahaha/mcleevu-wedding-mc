import { sendJson, adminAuthorised, readJson, cleanText, supabase, stripeRequest, env } from './_lib.js';

export default async function handler(req, res) {
  if (!adminAuthorised(req)) return sendJson(res, 401, { error: 'Unauthorised' });
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  const body = await readJson(req).catch(() => ({}));
  const bookingId = cleanText(body.bookingId, 60);
  if (!bookingId) return sendJson(res, 400, { error: 'Missing booking ID' });
  try {
    const rows = await supabase(`bookings?id=eq.${encodeURIComponent(bookingId)}&status=eq.confirmed&select=*&limit=1`, { method: 'GET' });
    const booking = rows?.[0];
    if (!booking) return sendJson(res, 404, { error: 'Confirmed booking not found' });
    if (booking.balance_status === 'paid') return sendJson(res, 409, { error: 'Balance is already paid' });
    const siteUrl = env('PUBLIC_SITE_URL').replace(/\/$/, '');
    const session = await stripeRequest('checkout/sessions', {
      mode: 'payment',
      'payment_method_types[0]': 'card',
      'line_items[0][price_data][currency]': 'aud',
      'line_items[0][price_data][unit_amount]': 50000,
      'line_items[0][price_data][product_data][name]': 'MC Lee Vu Sydney — remaining wedding MC balance',
      'line_items[0][quantity]': 1,
      customer_email: booking.email,
      client_reference_id: booking.id,
      'metadata[booking_id]': booking.id,
      'metadata[event_date]': booking.event_date,
      'metadata[payment_type]': 'balance',
      success_url: `${siteUrl}/?balance=success#availability`,
      cancel_url: `${siteUrl}/?balance=cancelled#availability`,
    });
    await supabase(`bookings?id=eq.${encodeURIComponent(booking.id)}`, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ balance_status: 'checkout_sent', stripe_balance_checkout_session_id: session.id }) });
    return sendJson(res, 200, { url: session.url });
  } catch {
    return sendJson(res, 503, { error: 'Unable to create balance link' });
  }
}
