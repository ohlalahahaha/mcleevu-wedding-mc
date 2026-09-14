import { sendJson, validateFutureDate, rpc } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });
  const date = String(req.query?.date || '');
  if (!validateFutureDate(date)) return sendJson(res, 400, { error: 'Choose a valid wedding date.' });
  try {
    const result = await rpc('public_date_availability', { p_event_date: date });
    const status = Array.isArray(result) ? result[0] : result;
    const normalized = typeof status === 'string' ? status.replaceAll('"', '') : status?.status || 'unavailable';
    return sendJson(res, 200, { status: normalized, available: normalized === 'available' });
  } catch {
    return sendJson(res, 503, { error: 'Online availability is not connected yet.' });
  }
}
