import crypto from 'node:crypto';

export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload));
}

export function env(name, optional = false) {
  const value = process.env[name];
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

export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw new Error('Invalid JSON body'); }
}

export async function readRaw(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export async function supabase(path, options = {}) {
  const base = env('SUPABASE_URL').replace(/\/$/, '');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const headers = { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json', ...(options.headers || {}) };
  const response = await fetch(`${base}/rest/v1/${path}`, { ...options, headers });
  const text = await response.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  if (!response.ok) throw new Error(data?.message || data?.hint || data?.error || `Supabase request failed (${response.status})`);
  return data;
}

export async function rpc(name, args = {}) {
  return supabase(`rpc/${name}`, { method: 'POST', body: JSON.stringify(args) });
}

function appendForm(form, key, value) {
  if (value === undefined || value === null || value === '') return;
  form.append(key, String(value));
}

export async function stripeRequest(path, values) {
  const key = env('STRIPE_SECRET_KEY');
  const form = new URLSearchParams();
  for (const [keyName, value] of Object.entries(values)) appendForm(form, keyName, value);
  const response = await fetch(`https://api.stripe.com/v1/${path}`, { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/x-www-form-urlencoded' }, body: form });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Stripe request failed (${response.status})`);
  return data;
}

export function verifyStripeSignature(rawBody, signatureHeader, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!signatureHeader || !secret) return false;
  const parts = String(signatureHeader).split(',').map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  if (!timestamp || !signatures.length) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > 300) return false;
  const payload = `${timestamp}.${rawBody.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const expectedBuffer = Buffer.from(expected);
  return signatures.some((sig) => { const actual = Buffer.from(sig); return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer); });
}

export function cleanText(value, max = 200) {
  return String(value || '').trim().replace(/[<>]/g, '').slice(0, max);
}

export function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export function adminAuthorised(req) {
  const expected = env('ADMIN_ACCESS_KEY', true);
  const supplied = req.headers['x-admin-key'];
  if (!expected || !supplied) return false;
  const a = Buffer.from(String(expected)); const b = Buffer.from(String(supplied));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function sendBookingEmails(booking) {
  const key = env('RESEND_API_KEY', true); const from = env('RESEND_FROM_EMAIL', true); const admins = env('ADMIN_NOTIFICATION_EMAILS', true);
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

export async function createCalendarEvent(booking) {
  const clientId = env('GOOGLE_CLIENT_ID', true); const clientSecret = env('GOOGLE_CLIENT_SECRET', true); const refreshToken = env('GOOGLE_REFRESH_TOKEN', true); const calendarId = env('GOOGLE_CALENDAR_ID', true) || 'primary';
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

function nextDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  return date.toISOString().slice(0, 10);
}
