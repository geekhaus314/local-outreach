import { json } from '@sveltejs/kit';
import { getDatabase, listBookings } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ locals, platform }) => {
  if (!locals.adminEmail) {
    return json({ error: 'Not authorized.' }, { status: 403 });
  }

  const db = getDatabase(platform);
  if (!db) {
    return json({ error: 'The database binding is not configured.' }, { status: 503 });
  }

  const bookings = await listBookings(db, 50);
  return json({ bookings });
};
