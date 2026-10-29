import { error } from '@sveltejs/kit';
import { getAnalyticsSummary, getDatabase, LAUNCH_PRICE_ESTIMATE } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (!locals.user) error(404, 'Not found');

  const db = getDatabase(platform);
  if (!db) {
    return { analytics: null, configured: false, launchPriceEstimate: LAUNCH_PRICE_ESTIMATE };
  }

  const analytics = await getAnalyticsSummary(db);
  return { analytics, configured: true, launchPriceEstimate: LAUNCH_PRICE_ESTIMATE };
};
