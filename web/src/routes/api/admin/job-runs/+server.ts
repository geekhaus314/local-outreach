import { guardAdmin } from '$lib/server/admin';
import { listJobRuns } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
  const jobRuns = await listJobRuns(guard.db, limit);
  return Response.json({ jobRuns });
};
