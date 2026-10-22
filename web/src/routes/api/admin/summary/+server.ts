import { guardAdmin } from '$lib/server/admin';
import { getPipelineSummary } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const summary = await getPipelineSummary(guard.db);
  return Response.json({ summary });
};
