import { badRequest, guardAdmin, notFound } from '$lib/server/admin';
import { deletePitch, getPitch, updatePitch } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const pitch = await getPitch(guard.db, params.id);
  if (!pitch) return notFound('That pitch does not exist.');
  return Response.json({ pitch });
};

export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const pitch = await getPitch(guard.db, params.id);
  if (!pitch) return notFound('That pitch does not exist.');

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return badRequest('Please send the update as JSON.');
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.channel === 'string') patch.channel = body.channel;
  if (typeof body.body === 'string') patch.body = body.body;
  if (typeof body.status === 'string') patch.status = body.status;

  if (Object.keys(patch).length === 0) return badRequest('No editable fields were supplied.');

  await updatePitch(guard.db, params.id, patch);
  const updated = await getPitch(guard.db, params.id);
  return Response.json({ pitch: updated });
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const pitch = await getPitch(guard.db, params.id);
  if (!pitch) return notFound('That pitch does not exist.');

  await deletePitch(guard.db, params.id);
  return Response.json({ ok: true, deleted: params.id });
};
