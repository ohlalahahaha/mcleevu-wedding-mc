import { handleApi } from '../../server/core.js';

export const onRequest = async (context) => {
  const { request, env, params } = context;
  const segments = Array.isArray(params.path) ? params.path : [];
  const path = `/api/${segments.join('/')}`;
  const url = new URL(request.url);
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const bodyText = hasBody ? await request.text() : '';
  const result = await handleApi({ method: request.method, path, query: Object.fromEntries(url.searchParams.entries()), headers: Object.fromEntries(request.headers.entries()), bodyText, env });
  return Response.json(result.body, { status: result.status, headers: { 'cache-control': 'no-store' } });
};
