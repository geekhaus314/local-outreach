import { requireAuth } from '$lib/server/admin';
import { LAUNCH_PRICE_ESTIMATE, getAnalyticsSummary } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

// Pipeline analytics, computed on read from real rows: lifecycle funnel with
// estimatedvalue at the published launch price, response rate between outbound
// and inbound messages, monthly performance, and health data. No mock floats.
export const GET: RequestHandler = async ({ locals, platform }) => {
  const guard = requireAuth(locals.user, platform);
  if ('response' in guard) return guard.response;

  const summary = await getAnalyticsSummary(guard.db);
  return Response.json({ analytics: summary, launchPriceEstimate: LAUNCH_PRICE_ESTIMATE });
};
