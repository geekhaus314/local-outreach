import { badRequest, guardAdmin, notFound } from '$lib/server/admin';
import {
  deleteBusiness,
  getBusiness,
  listAudits,
  listBookingsByBusiness,
  listMockups,
  listPitches,
  rowToAdminProspect,
  updateBusiness
} from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const row = await getBusiness(guard.db, params.slug);
  if (!row) return notFound('That prospect does not exist.');

  const [audits, pitches, mockups, bookings] = await Promise.all([
    listAudits(guard.db, row.id),
    listPitches(guard.db, row.id),
    listMockups(guard.db, row.id),
    listBookingsByBusiness(guard.db, row.slug)
  ]);

  return Response.json({ prospect: rowToAdminProspect(row), audits, pitches, mockups, bookings });
};

export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const row = await getBusiness(guard.db, params.slug);
  if (!row) return notFound('That prospect does not exist.');

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return badRequest('Please send the update as JSON.');
  }

  const allowed = Object.fromEntries(
    Object.entries(body).filter(
      ([key]) => !['id', 'slug', 'created_at', 'updated_at'].includes(key)
    )
  );

  if (Object.keys(allowed).length === 0) {
    return badRequest('No editable fields were supplied.');
  }

  await updateBusiness(guard.db, row.id, allowed);
  const updated = await getBusiness(guard.db, row.id);
  return Response.json({ prospect: updated ? rowToAdminProspect(updated) : null });
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const row = await getBusiness(guard.db, params.slug);
  if (!row) return notFound('That prospect does not exist.');

  await deleteBusiness(guard.db, row.id);
  return Response.json({ ok: true, deleted: row.slug });
};
