import { guardAdmin } from '$lib/server/admin';
import { listBookings } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const bookings = await listBookings(guard.db, 100);
  return Response.json({ bookings });
};
