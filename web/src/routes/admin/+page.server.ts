import { error } from '@sveltejs/kit';
import { getDatabase, listBookings, listBusinessSummaries } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (!locals.user) {
    error(404, 'Not found');
  }

  const db = getDatabase(platform);
  if (!db) {
    return { user: locals.user, configured: false, prospects: [], bookings: [] };
  }

  const [prospects, bookings] = await Promise.all([listBusinessSummaries(db), listBookings(db, 25)]);

  return {
    user: locals.user,
    configured: true,
    prospects,
    bookings
  };
};
