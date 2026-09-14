import { sendJson, supabase, cleanText } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });
  const id = cleanText(req.query?.id, 60);
  if (!id) return sendJson(res, 400, { error: 'Missing booking ID' });
  try {
    const rows = await supabase(`bookings?id=eq.${encodeURIComponent(id)}&select=id,event_date,status,deposit_status,balance_status&limit=1`, { method: 'GET' });
    const booking = rows?.[0];
    if (!booking) return sendJson(res, 404, { error: 'Booking not found' });
    return sendJson(res, 200, booking);
  } catch {
    return sendJson(res, 503, { error: 'Booking status unavailable' });
  }
}
