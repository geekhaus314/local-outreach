import { getDatabase, listLeads, countBusinessesByVertical } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (!locals.user) return { leads: [], verticals: [], dbConfigured: false };

  const db = getDatabase(platform);
  if (!db) return { leads: [], verticals: [], dbConfigured: false };

  const leads = await listLeads(db);
  const verticals = await countBusinessesByVertical(db);
  return { leads, verticals, dbConfigured: true };
};
