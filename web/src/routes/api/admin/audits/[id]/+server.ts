import { badRequest, guardAdmin, notFound } from '$lib/server/admin';
import { deleteAudit, getAudit, updateAudit } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const audit = await getAudit(guard.db, params.id);
  if (!audit) return notFound('That audit does not exist.');
  return Response.json({ audit });
};

export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const audit = await getAudit(guard.db, params.id);
  if (!audit) return notFound('That audit does not exist.');

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return badRequest('Please send the update as JSON.');
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.summary === 'string') patch.summary = body.summary;
  if (Array.isArray(body.findings)) {
    patch.findings = body.findings.filter((item): item is string => typeof item === 'string');
  }
  if (typeof body.siteHealth === 'number') patch.siteHealth = body.siteHealth;

  if (Object.keys(patch).length === 0) return badRequest('No editable fields were supplied.');

  await updateAudit(guard.db, params.id, patch);
  const updated = await getAudit(guard.db, params.id);
  return Response.json({ audit: updated });
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const audit = await getAudit(guard.db, params.id);
  if (!audit) return notFound('That audit does not exist.');

  await deleteAudit(guard.db, params.id);
  return Response.json({ ok: true, deleted: params.id });
};
