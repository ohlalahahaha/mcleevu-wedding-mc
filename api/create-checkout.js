import crypto from 'node:crypto';
import { sendJson, readJson, validateFutureDate, cleanText, validEmail, rpc, stripeRequest, env } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  let body;
  try { body = await readJson(req); } catch (error) { return sendJson(res, 400, { error: error.message }); }

  const eventDate = cleanText(body.eventDate, 10);
  const customerName = cleanText(body.customerName, 100);
  const partnerName = cleanText(body.partnerName, 100);
  const email = cleanText(body.email, 160).toLowerCase();
  const phone = cleanText(body.phone, 40);
  const venueName = cleanText(body.venueName, 160);
  const venueAddress = cleanText(body.venueAddress, 240);
  const notes = cleanText(body.notes, 1200);
  const languagePreference = ['english', 'vietnamese', 'bilingual'].includes(body.languagePreference) ? body.languagePreference : 'bilingual';

  if (!validateFutureDate(eventDate) || !customerName || !partnerName || !validEmail(email) || !phone) {
    return sendJson(res, 400, { error: 'Please complete the required wedding details.' });
  }

  const bookingId = crypto.randomUUID();
  let holdAcquired = false;
  try {
    await rpc('acquire_booking_hold', {
      p_booking_id: bookingId,
      p_event_date: eventDate,
      p_customer_name: customerName,
      p_partner_name: partnerName,
      p_email: email,
      p_phone: phone,
      p_venue_name: venueName,
      p_venue_address: venueAddress,
      p_language_preference: languagePreference,
      p_notes: notes,
    });
    holdAcquired = true;

    const siteUrl = env('PUBLIC_SITE_URL').replace(/\/$/, '');
    const expiresAt = Math.floor(Date.now() / 1000) + (30 * 60);
    const session = await stripeRequest('checkout/sessions', {
      mode: 'payment',
      'payment_method_types[0]': 'card',
      'line_items[0][price_data][currency]': 'aud',
      'line_items[0][price_data][unit_amount]': 50000,
      'line_items[0][price_data][product_data][name]': 'MC Lee Vu Sydney — Wedding MC booking deposit',
      'line_items[0][quantity]': 1,
      customer_email: email,
      client_reference_id: bookingId,
      'metadata[booking_id]': bookingId,
      'metadata[event_date]': eventDate,
      'metadata[payment_type]': 'deposit',
      expires_at: expiresAt,
      success_url: `${siteUrl}/?booking=success&booking_id=${encodeURIComponent(bookingId)}&session_id={CHECKOUT_SESSION_ID}#availability`,
      cancel_url: `${siteUrl}/?booking=cancelled&booking_id=${encodeURIComponent(bookingId)}#availability`,
    });

    await rpc('attach_checkout_session', { p_booking_id: bookingId, p_session_id: session.id });
    return sendJson(res, 200, { url: session.url, bookingId });
  } catch (error) {
    if (holdAcquired) {
      try { await rpc('release_booking_hold', { p_booking_id: bookingId }); } catch { /* preserve original error */ }
    }
    const dateConflict = /already|blocked|held/i.test(error.message);
    return sendJson(res, dateConflict ? 409 : 503, { error: dateConflict ? 'That date is no longer available.' : 'Secure checkout is not connected yet.' });
  }
}
