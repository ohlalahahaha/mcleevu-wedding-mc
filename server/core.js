// Canonical booking engine — platform-neutral.
// Called by Vercel functions (api/_route.js) and Cloudflare Pages Functions (functions/api/[[path]].js).
// Interface: handleApi({ method, path, query, headers, bodyText, env }) -> { status, body }

const DEPOSIT_CENTS = 50000;
const HOLD_MINUTES = 30;

function envValue(env, name, optional = false) {
  const value = env[name];
  if (!value && !optional) throw new Error(`Missing server configuration: ${name}`);
  return value || '';
}

export function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

export function sydneyToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function validateFutureDate(value) {
  if (!isIsoDate(value)) return false;
  return value >= sydneyToday();
}

export function cleanText(value, max = 200) {
  return String(value || '').trim().replace(/[<>]/g, '').slice(0, max);
}

export function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

async function supabase(env, path, options = {}) {
  const base = envValue(env, 'SUPABASE_URL').replace(/\/$/, '');
  const key = envValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json', ...(options.headers || {}) };
  const response = await fetch(`${base}/rest/v1/${path}`, { ...options, headers });
  const text = await response.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  if (!response.ok) throw new Error(data?.message || data?.hint || data?.error || `Supabase request failed (${response.status})`);
  return data;
}

async function rpc(env, name, args = {}) {
  return supabase(env, `rpc/${name}`, { method: 'POST', body: JSON.stringify(args) });
}

async function stripeRequest(env, path, values) {
  const key = envValue(env, 'STRIPE_SECRET_KEY');
  const form = new URLSearchParams();
  for (const [keyName, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === '') continue;
    form.append(keyName, String(value));
  }
  const response = await fetch(`https://api.stripe.com/v1/${path}`, { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/x-www-form-urlencoded' }, body: form });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Stripe request failed (${response.status})`);
  return data;
}

function timingSafeEqualStrings(expected, actual) {
  const a = String(expected);
  const b = String(actual);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyStripeSignature(rawBody, signatureHeader, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!signatureHeader || !secret) return false;
  const parts = String(signatureHeader).split(',').map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  if (!timestamp || !signatures.length) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > 300) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${rawBody}`));
  const expected = Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return signatures.some((sig) => timingSafeEqualStrings(expected, sig));
}

function adminAuthorised(env, headers) {
  const expected = envValue(env, 'ADMIN_ACCESS_KEY', true);
  const supplied = headers['x-admin-key'];
  if (!expected || !supplied) return false;
  return timingSafeEqualStrings(expected, supplied);
}

async function sendBookingEmails(env, booking) {
  const key = envValue(env, 'RESEND_API_KEY', true);
  const from = envValue(env, 'RESEND_FROM_EMAIL', true);
  const admins = envValue(env, 'ADMIN_NOTIFICATION_EMAILS', true);
  if (!key || !from) return { sent: false, reason: 'email-not-configured' };
  const customerHtml = `<h1>Your wedding date is confirmed</h1><p>Thank you for trusting Lee with such an important evening.</p><p><strong>Date:</strong> ${booking.event_date}</p><p><strong>Venue:</strong> ${booking.venue_name || 'To be confirmed'}</p><p><strong>Coverage:</strong> 6:00 PM until the reception concludes</p><p><strong>Total:</strong> A$1,000<br><strong>Deposit paid:</strong> A$500<br><strong>Remaining:</strong> A$500</p><p>MC Lee Vu Sydney<br>0401 676 766<br>mcleevu@gmail.com</p>`;
  const messages = [{ from, to: [booking.email], subject: 'Your wedding date is confirmed — MC Lee Vu', html: customerHtml }];
  if (admins) messages.push({ from, to: admins.split(',').map((email) => email.trim()).filter(Boolean), subject: `New MC booking — ${booking.event_date}`, html: `<h1>New confirmed booking</h1><p>${booking.customer_name} &amp; ${booking.partner_name}</p><p>${booking.event_date} · ${booking.venue_name || 'Venue TBC'}</p><p>${booking.email} · ${booking.phone}</p>` });
  for (const message of messages) {
    if (!message.to.length) continue;
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify(message) });
    if (!response.ok) throw new Error(`Resend failed (${response.status})`);
  }
  return { sent: true };
}

function nextDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  return date.toISOString().slice(0, 10);
}

async function createCalendarEvent(env, booking) {
  const clientId = envValue(env, 'GOOGLE_CLIENT_ID', true);
  const clientSecret = envValue(env, 'GOOGLE_CLIENT_SECRET', true);
  const refreshToken = envValue(env, 'GOOGLE_REFRESH_TOKEN', true);
  const calendarId = envValue(env, 'GOOGLE_CALENDAR_ID', true) || 'primary';
  if (!clientId || !clientSecret || !refreshToken) return { created: false, reason: 'calendar-not-configured' };
  const tokenForm = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' });
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: tokenForm });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) throw new Error('Google Calendar token refresh failed');
  const event = { summary: `MC Wedding — ${booking.customer_name} & ${booking.partner_name}`, location: booking.venue_address || booking.venue_name || '', description: `Booking ID: ${booking.id}\nContact: ${booking.email} · ${booking.phone}\nMC starts 6:00 PM and finishes when the reception concludes.\nDeposit: paid · Balance: ${booking.balance_status}`, start: { date: booking.event_date }, end: { date: nextDate(booking.event_date) }, transparency: 'opaque', visibility: 'private' };
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, { method: 'POST', headers: { authorization: `Bearer ${tokenData.access_token}`, 'content-type': 'application/json' }, body: JSON.stringify(event) });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'Google Calendar event creation failed');
  return { created: true, id: data.id };
}

async function fetchBooking(env, id) {
  const rows = await supabase(env, `bookings?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { method: 'GET' });
  return rows?.[0] || null;
}

async function markSync(env, id, patch) {
  try {
    await supabase(env, `bookings?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify(patch) });
  } catch { /* booking remains confirmed */ }
}

function parseJsonBody(bodyText) {
  if (!bodyText) return {};
  return JSON.parse(bodyText);
}

async function availability(env, query) {
  const date = String(query?.date || '');
  if (!validateFutureDate(date)) return { status: 400, body: { error: 'Choose a valid wedding date.' } };
  try {
    const result = await rpc(env, 'public_date_availability', { p_event_date: date });
    const status = Array.isArray(result) ? result[0] : result;
    const normalized = typeof status === 'string' ? status.replaceAll('"', '') : status?.status || 'unavailable';
    return { status: 200, body: { status: normalized, available: normalized === 'available' } };
  } catch {
    return { status: 503, body: { error: 'Online availability is not connected yet.' } };
  }
}

async function createCheckout(env, bodyText) {
  let body;
  try { body = parseJsonBody(bodyText); } catch { return { status: 400, body: { error: 'Invalid JSON body' } }; }

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
    return { status: 400, body: { error: 'Please complete the required wedding details.' } };
  }

  const bookingId = crypto.randomUUID();
  let holdAcquired = false;
  try {
    await rpc(env, 'acquire_booking_hold', {
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

    const siteUrl = envValue(env, 'PUBLIC_SITE_URL').replace(/\/$/, '');
    const expiresAt = Math.floor(Date.now() / 1000) + (HOLD_MINUTES * 60);
    const session = await stripeRequest(env, 'checkout/sessions', {
      mode: 'payment',
      'payment_method_types[0]': 'card',
      'line_items[0][price_data][currency]': 'aud',
      'line_items[0][price_data][unit_amount]': DEPOSIT_CENTS,
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

    await rpc(env, 'attach_checkout_session', { p_booking_id: bookingId, p_session_id: session.id });
    return { status: 200, body: { url: session.url, bookingId } };
  } catch (error) {
    if (holdAcquired) {
      try { await rpc(env, 'release_booking_hold', { p_booking_id: bookingId }); } catch { /* preserve original error */ }
    }
    const dateConflict = /already|blocked|held/i.test(error.message);
    return { status: dateConflict ? 409 : 503, body: { error: dateConflict ? 'That date is no longer available.' : 'Secure checkout is not connected yet.' } };
  }
}

async function stripeWebhook(env, headers, bodyText) {
  const secret = envValue(env, 'STRIPE_WEBHOOK_SECRET', true);
  if (!(await verifyStripeSignature(bodyText, headers['stripe-signature'], secret))) return { status: 400, body: { error: 'Invalid Stripe signature' } };

  let event;
  try { event = JSON.parse(bodyText); } catch { return { status: 400, body: { error: 'Invalid event' } }; }

  try {
    const inserted = await supabase(env, 'stripe_webhook_events?on_conflict=stripe_event_id', {
      method: 'POST',
      headers: { prefer: 'resolution=ignore-duplicates,return=representation' },
      body: JSON.stringify({ stripe_event_id: event.id, type: event.type }),
    });
    if (Array.isArray(inserted) && inserted.length === 0) return { status: 200, body: { received: true, duplicate: true } };
  } catch { /* booking RPCs remain idempotent */ }

  const session = event.data?.object;
  const bookingId = session?.metadata?.booking_id || session?.client_reference_id;
  const paymentType = session?.metadata?.payment_type;

  try {
    if (event.type === 'checkout.session.completed' && bookingId) {
      if (session.payment_status !== 'paid' || session.amount_total !== DEPOSIT_CENTS || String(session.currency).toLowerCase() !== 'aud') throw new Error('Unexpected Stripe payment state');
      if (paymentType === 'balance') {
        await rpc(env, 'confirm_balance_payment', { p_booking_id: bookingId, p_session_id: session.id, p_payment_intent_id: session.payment_intent || '' });
        return { status: 200, body: { received: true } };
      }
      await rpc(env, 'confirm_booking_from_stripe', {
        p_booking_id: bookingId,
        p_session_id: session.id,
        p_payment_intent_id: session.payment_intent || '',
        p_amount_total: session.amount_total || 0,
        p_currency: session.currency || '',
      });
      const booking = await fetchBooking(env, bookingId);
      if (booking) {
        try {
          const calendar = await createCalendarEvent(env, booking);
          if (calendar.created) await markSync(env, bookingId, { google_calendar_event_id: calendar.id, calendar_sync_status: 'synced' });
          else await markSync(env, bookingId, { calendar_sync_status: 'not_configured' });
        } catch { await markSync(env, bookingId, { calendar_sync_status: 'retry_required' }); }
        try { await sendBookingEmails(env, booking); } catch { /* payment remains authoritative */ }
      }
    }
    if (event.type === 'checkout.session.expired' && bookingId && paymentType !== 'balance') await rpc(env, 'release_booking_hold', { p_booking_id: bookingId });
    return { status: 200, body: { received: true } };
  } catch {
    return { status: 500, body: { error: 'Webhook processing failed' } };
  }
}

async function bookingStatus(env, query) {
  const id = cleanText(query?.id, 60);
  if (!id) return { status: 400, body: { error: 'Missing booking ID' } };
  try {
    const rows = await supabase(env, `bookings?id=eq.${encodeURIComponent(id)}&select=id,event_date,status,deposit_status,balance_status&limit=1`, { method: 'GET' });
    const booking = rows?.[0];
    if (!booking) return { status: 404, body: { error: 'Booking not found' } };
    return { status: 200, body: booking };
  } catch {
    return { status: 503, body: { error: 'Booking status unavailable' } };
  }
}

async function adminBookings(env, headers) {
  if (!adminAuthorised(env, headers)) return { status: 401, body: { error: 'Unauthorised' } };
  try {
    const rows = await supabase(env, 'bookings?select=*&order=event_date.asc&limit=200', { method: 'GET' });
    return { status: 200, body: { bookings: rows || [] } };
  } catch {
    return { status: 503, body: { error: 'Bookings unavailable' } };
  }
}

async function adminBlockDate(env, method, headers, bodyText) {
  if (!adminAuthorised(env, headers)) return { status: 401, body: { error: 'Unauthorised' } };
  let body;
  try { body = parseJsonBody(bodyText); } catch { return { status: 400, body: { error: 'Invalid JSON body' } }; }
  const eventDate = cleanText(body.eventDate, 10);
  if (!validateFutureDate(eventDate)) return { status: 400, body: { error: 'Invalid date' } };
  try {
    if (method === 'POST') {
      await supabase(env, 'blocked_dates?on_conflict=event_date', { method: 'POST', headers: { prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ event_date: eventDate, reason: cleanText(body.reason, 240) }) });
      return { status: 200, body: { blocked: true } };
    }
    if (method === 'DELETE') {
      await supabase(env, `blocked_dates?event_date=eq.${encodeURIComponent(eventDate)}`, { method: 'DELETE' });
      return { status: 200, body: { blocked: false } };
    }
    return { status: 405, body: { error: 'Method not allowed' } };
  } catch {
    return { status: 503, body: { error: 'Date update failed' } };
  }
}

async function adminBalanceLink(env, headers, bodyText) {
  if (!adminAuthorised(env, headers)) return { status: 401, body: { error: 'Unauthorised' } };
  let body;
  try { body = parseJsonBody(bodyText); } catch { body = {}; }
  const bookingId = cleanText(body.bookingId, 60);
  if (!bookingId) return { status: 400, body: { error: 'Missing booking ID' } };
  try {
    const rows = await supabase(env, `bookings?id=eq.${encodeURIComponent(bookingId)}&status=eq.confirmed&select=*&limit=1`, { method: 'GET' });
    const booking = rows?.[0];
    if (!booking) return { status: 404, body: { error: 'Confirmed booking not found' } };
    if (booking.balance_status === 'paid') return { status: 409, body: { error: 'Balance is already paid' } };
    const siteUrl = envValue(env, 'PUBLIC_SITE_URL').replace(/\/$/, '');
    const session = await stripeRequest(env, 'checkout/sessions', {
      mode: 'payment',
      'payment_method_types[0]': 'card',
      'line_items[0][price_data][currency]': 'aud',
      'line_items[0][price_data][unit_amount]': DEPOSIT_CENTS,
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
    await supabase(env, `bookings?id=eq.${encodeURIComponent(booking.id)}`, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ balance_status: 'checkout_sent', stripe_balance_checkout_session_id: session.id }) });
    return { status: 200, body: { url: session.url } };
  } catch {
    return { status: 503, body: { error: 'Unable to create balance link' } };
  }
}

export async function handleApi({ method, path, query = {}, headers = {}, bodyText = '', env = {} }) {
  try {
    if (path === '/api/availability') {
      if (method !== 'GET') return { status: 405, body: { error: 'Method not allowed' } };
      return await availability(env, query);
    }
    if (path === '/api/create-checkout') {
      if (method !== 'POST') return { status: 405, body: { error: 'Method not allowed' } };
      return await createCheckout(env, bodyText);
    }
    if (path === '/api/stripe-webhook') {
      if (method !== 'POST') return { status: 405, body: { error: 'Method not allowed' } };
      return await stripeWebhook(env, headers, bodyText);
    }
    if (path === '/api/booking-status') {
      if (method !== 'GET') return { status: 405, body: { error: 'Method not allowed' } };
      return await bookingStatus(env, query);
    }
    if (path === '/api/admin-bookings') return await adminBookings(env, headers);
    if (path === '/api/admin-block-date') return await adminBlockDate(env, method, headers, bodyText);
    if (path === '/api/admin-balance-link') {
      if (method !== 'POST') return { status: 405, body: { error: 'Method not allowed' } };
      return await adminBalanceLink(env, headers, bodyText);
    }
    return { status: 404, body: { error: 'Not found' } };
  } catch (error) {
    if (/Missing server configuration/.test(error.message)) {
      if (path === '/api/availability') return { status: 503, body: { error: 'Online availability is not connected yet.' } };
      if (path === '/api/create-checkout') return { status: 503, body: { error: 'Secure checkout is not connected yet.' } };
      if (path === '/api/booking-status') return { status: 503, body: { error: 'Booking status unavailable' } };
      if (path === '/api/admin-bookings') return { status: 503, body: { error: 'Bookings unavailable' } };
      if (path === '/api/admin-block-date') return { status: 503, body: { error: 'Date update failed' } };
      if (path === '/api/admin-balance-link') return { status: 503, body: { error: 'Unable to create balance link' } };
    }
    return { status: 500, body: { error: 'Unexpected server error' } };
  }
}
