import { badRequest, guardAdmin, notFound } from '$lib/server/admin';
import { REGENERATE_KINDS, RegenerateError, regenerateBusiness, type RegenerateKind } from '$lib/server/regenerate';
import { getBusiness } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return badRequest('Please send the regeneration request as JSON.');
  }

  const id = typeof body.id === 'string' ? body.id : '';
  const kind = (typeof body.kind === 'string' ? body.kind : 'all') as RegenerateKind;
  if (!id) return badRequest('id is required.');
  if (!REGENERATE_KINDS.includes(kind)) {
    return badRequest(`kind must be one of: ${REGENERATE_KINDS.join(', ')}.`);
  }

  const business = await getBusiness(guard.db, id);
  if (!business) return notFound('That prospect does not exist.');

  try {
    const outcome = await regenerateBusiness(guard.db, id, kind);
    return Response.json({ ok: true, outcome });
  } catch (error) {
    if (error instanceof RegenerateError) {
      return Response.json({ ok: false, error: error.message }, { status: 422 });
    }
    throw error;
  }
};
