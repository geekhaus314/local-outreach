import { badRequest, guardAdmin, notFound } from '$lib/server/admin';
import { getBusiness, insertPitch, listPitches } from '$lib/server/db';
import { buildPitch } from '$lib/server/pitch';
import { rowToProspect } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const businessId = url.searchParams.get('business_id') ?? undefined;
  const pitches = await listPitches(guard.db, businessId);
  return Response.json({ pitches });
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return badRequest('Please send the pitch as JSON.');
  }

  const businessId = typeof body.businessId === 'string' ? body.businessId : '';
  const channel = body.channel === 'sms' ? 'sms' : 'email';
  if (!businessId) return badRequest('businessId is required.');

  const business = await getBusiness(guard.db, businessId);
  if (!business) return notFound('That prospect does not exist.');

  const draft = buildPitch(rowToProspect(business), {
    channel,
    auditSummary: business.audit_summary
  });
  if (!draft) {
    return Response.json(
      { error: 'There are no verifiable facts stored for this prospect, so a pitch cannot be generated. Run an audit first or add pitch facts.' },
      { status: 422 }
    );
  }

  const id = crypto.randomUUID();
  await insertPitch(guard.db, { id, businessId, channel: draft.channel, body: draft.body, status: 'draft' });
  return Response.json(
    { pitch: { id, businessId, channel: draft.channel, body: draft.body, status: 'draft', createdAt: new Date().toISOString() } },
    { status: 201 }
  );
};
