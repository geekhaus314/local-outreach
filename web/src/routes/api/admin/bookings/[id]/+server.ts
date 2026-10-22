import { badRequest, guardAdmin, notFound } from '$lib/server/admin';
import { deleteBooking, getBooking, updateBooking } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const booking = await getBooking(guard.db, params.id);
  if (!booking) return notFound('That booking does not exist.');
  return Response.json({ booking });
};

export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const booking = await getBooking(guard.db, params.id);
  if (!booking) return notFound('That booking does not exist.');

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return badRequest('Please send the update as JSON.');
  }

  const patch: Record<string, unknown> = {};
  for (const key of ['name', 'email', 'phone', 'service', 'message', 'status'] as const) {
    if (typeof body[key] === 'string') patch[key] = body[key];
  }
  if (typeof body.consent === 'boolean') patch.consent = body.consent;

  if (Object.keys(patch).length === 0) return badRequest('No editable fields were supplied.');

  await updateBooking(guard.db, params.id, patch);
  const updated = await getBooking(guard.db, params.id);
  return Response.json({ booking: updated });
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const booking = await getBooking(guard.db, params.id);
  if (!booking) return notFound('That booking does not exist.');

  await deleteBooking(guard.db, params.id);
  return Response.json({ ok: true, deleted: params.id });
};
