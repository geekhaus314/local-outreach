import { badRequest, notFound, requireAdmin, requireAuth } from '$lib/server/admin';
import {
  deleteBusiness,
  getBusiness,
  lifecycleStatusIsValid,
  listAudits,
  listCommunications,
  listBookingsByBusiness,
  listLifecycleEvents,
  listMockups,
  listPitches,
  rowToAdminProspect,
  updateBusiness
} from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const guard = requireAuth(locals.user, platform);
  if ('response' in guard) return guard.response;

  const row = await getBusiness(guard.db, params.slug);
  if (!row) return notFound('That lead does not exist.');

  const [audits, pitches, mockups, bookings, communications, lifecycleEvents] = await Promise.all([
    listAudits(guard.db, row.id),
    listPitches(guard.db, row.id),
    listMockups(guard.db, row.id),
    listBookingsByBusiness(guard.db, row.slug),
    listCommunications(guard.db, { businessId: row.id }),
    listLifecycleEvents(guard.db, row.id)
  ]);

  return Response.json({
    lead: rowToAdminProspect(row),
    audits,
    pitches,
    mockups,
    bookings,
    communications,
    lifecycleEvents
  });
};

export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
  const guard = requireAdmin(locals.user, platform);
  if ('response' in guard) return guard.response;

  const row = await getBusiness(guard.db, params.slug);
  if (!row) return notFound('That lead does not exist.');

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return badRequest('Send the update as JSON.');
  }

  const allowed = Object.fromEntries(
    Object.entries(body).filter(([key]) => !['id', 'slug', 'created_at', 'updated_at'].includes(key))
  );

  if (Object.keys(allowed).length === 0) {
    return badRequest('No editable fields were supplied.');
  }
  if (
    'lifecycle_status' in allowed &&
    !(typeof allowed.lifecycle_status === 'string' && lifecycleStatusIsValid(allowed.lifecycle_status))
  ) {
    return badRequest(
      'lifecycle_status must be one of: cold, contacted, audited, proposal_sent, converted, rejected.'
    );
  }

  await updateBusiness(guard.db, row.id, allowed);
  const updated = await getBusiness(guard.db, row.id);
  return Response.json({ lead: updated ? rowToAdminProspect(updated) : null });
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const guard = requireAdmin(locals.user, platform);
  if ('response' in guard) return guard.response;

  const row = await getBusiness(guard.db, params.slug);
  if (!row) return notFound('That lead does not exist.');

  await deleteBusiness(guard.db, row.id);
  return Response.json({ ok: true, deleted: row.slug });
};
