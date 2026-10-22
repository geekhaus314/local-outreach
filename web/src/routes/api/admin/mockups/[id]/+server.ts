import { badRequest, guardAdmin, notFound } from '$lib/server/admin';
import { deleteMockup, getMockup, updateMockup } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const mockup = await getMockup(guard.db, params.id);
  if (!mockup) return notFound('That mockup does not exist.');
  return Response.json({ mockup });
};

export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const mockup = await getMockup(guard.db, params.id);
  if (!mockup) return notFound('That mockup does not exist.');

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return badRequest('Please send the update as JSON.');
  }

  const patch: { template?: string; theme?: string; previewHost?: string; isIndexable?: boolean } = {};
  if (typeof body.template === 'string') patch.template = body.template;
  if (typeof body.theme === 'string') patch.theme = body.theme;
  if (typeof body.previewHost === 'string') patch.previewHost = body.previewHost;
  if (typeof body.isIndexable === 'boolean') patch.isIndexable = body.isIndexable;

  if (Object.keys(patch).length === 0) return badRequest('No editable fields were supplied.');

  await updateMockup(guard.db, params.id, patch);
  const updated = await getMockup(guard.db, params.id);
  return Response.json({ mockup: updated });
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const mockup = await getMockup(guard.db, params.id);
  if (!mockup) return notFound('That mockup does not exist.');

  await deleteMockup(guard.db, params.id);
  return Response.json({ ok: true, deleted: params.id });
};
