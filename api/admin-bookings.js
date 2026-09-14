import { sendJson, adminAuthorised, supabase } from './_lib.js';

export default async function handler(req, res) {
  if (!adminAuthorised(req)) return sendJson(res, 401, { error: 'Unauthorised' });
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });
  try {
    const rows = await supabase('bookings?select=*&order=event_date.asc&limit=200', { method: 'GET' });
    return sendJson(res, 200, { bookings: rows || [] });
  } catch {
    return sendJson(res, 503, { error: 'Bookings unavailable' });
  }
}
