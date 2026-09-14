import { sendJson, adminAuthorised, readJson, validateFutureDate, cleanText, supabase } from './_lib.js';

export default async function handler(req, res) {
  if (!adminAuthorised(req)) return sendJson(res, 401, { error: 'Unauthorised' });
  let body;
  try { body = await readJson(req); } catch (error) { return sendJson(res, 400, { error: error.message }); }
  const eventDate = cleanText(body.eventDate, 10);
  if (!validateFutureDate(eventDate)) return sendJson(res, 400, { error: 'Invalid date' });
  try {
    if (req.method === 'POST') {
      await supabase('blocked_dates?on_conflict=event_date', { method: 'POST', headers: { prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ event_date: eventDate, reason: cleanText(body.reason, 240) }) });
      return sendJson(res, 200, { blocked: true });
    }
    if (req.method === 'DELETE') {
      await supabase(`blocked_dates?event_date=eq.${encodeURIComponent(eventDate)}`, { method: 'DELETE' });
      return sendJson(res, 200, { blocked: false });
    }
    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch {
    return sendJson(res, 503, { error: 'Date update failed' });
  }
}
