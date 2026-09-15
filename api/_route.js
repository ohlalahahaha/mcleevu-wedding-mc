import { handleApi } from '../server/core.js';

export async function runVercelRoute(req, res, path) {
  const url = new URL(req.url, 'http://localhost');
  let bodyText = '';
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (req.body && typeof req.body === 'object') bodyText = JSON.stringify(req.body);
    else {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      bodyText = raw;
    }
  }
  const result = await handleApi({ method: req.method, path, query: Object.fromEntries(url.searchParams.entries()), headers: req.headers, bodyText, env: process.env });
  res.statusCode = result.status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(result.body));
}
