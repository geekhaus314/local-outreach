import { badRequest, notFound, requireAdmin, requireAuth } from '$lib/server/admin';
import {
  channelIsValid,
  getBusiness,
  getCommunication,
  insertCommunication,
  listCommunications,
  outcomeIsValid,
  parseDirection
} from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const guard = requireAuth(locals.user, platform);
  if ('response' in guard) return guard.response;

  const directionParam = url.searchParams.get('direction');
  const direction = parseDirection(directionParam ?? '');
  if (directionParam && !direction) {
    return badRequest("direction must be 'outbound' or 'inbound'.");
  }

  const businessId = url.searchParams.get('business_id') ?? undefined;
  let resolvedBusinessId: string | undefined = businessId ?? undefined;
  if (businessId) {
    const business = await getBusiness(guard.db, businessId);
    if (!business) {
      return notFound('No lead matches that business_id.');
    }
    resolvedBusinessId = business.id;
  }

  const responseNeeded = url.searchParams.get('response_needed') === '1';
  const limitParam = url.searchParams.get('limit');

  const communications = await listCommunications(guard.db, {
    businessId: resolvedBusinessId,
    direction: direction ?? undefined,
    responseNeeded,
    limit: limitParam ? Number(limitParam) : undefined
  });

  return Response.json({ communications });
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const guard = requireAdmin(locals.user, platform);
  if ('response' in guard) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Send JSON with business_id, direction, channel and body.');
  }

  const input = (body ?? {}) as {
    business_id?: unknown;
    business_slug?: unknown;
    direction?: unknown;
    channel?: unknown;
    subject?: unknown;
    body?: unknown;
    occurred_at?: unknown;
    response_to?: unknown;
    outcome?: unknown;
  };

  let businessId = typeof input.business_id === 'string' ? input.business_id : '';
  if (!businessId && typeof input.business_slug === 'string') {
    const business = await getBusiness(guard.db, input.business_slug);
    businessId = business?.id ?? '';
  }
  if (!businessId) return badRequest('business_id or business_slug is required.');

  const business = await getBusiness(guard.db, businessId);
  if (!business) return notFound('No lead matches that business.');

  if (typeof input.direction !== 'string' || !parseDirection(input.direction)) {
    return badRequest("direction must be 'outbound' or 'inbound'.");
  }
  if (typeof input.channel !== 'string' || !channelIsValid(input.channel)) {
    return badRequest('channel must be one of: email, sms, call, voicemail, form, in_person, letter.');
  }
  if (typeof input.body !== 'string' || !input.body.trim()) {
    return badRequest('body is required.');
  }
  if (input.body.length > 50_000) return badRequest('body is too long.');

  const subject = typeof input.subject === 'string' ? input.subject : '';
  const occurredAt = typeof input.occurred_at === 'string' && input.occurred_at ? input.occurred_at : null;
  if (occurredAt && Number.isNaN(Date.parse(occurredAt))) {
    return badRequest('occurred_at must be an ISO date string.');
  }

  let responseTo: string | null = null;
  if (typeof input.response_to === 'string' && input.response_to.trim()) {
    const parent = await getCommunication(guard.db, input.response_to.trim());
    if (!parent) return notFound('response_to points at a message that does not exist.');
    if (parent.business_id !== business.id) {
      return badRequest('response_to must reference a message for the same lead.');
    }
    responseTo = parent.id;
  }

  const outcome = typeof input.outcome === 'string' ? input.outcome : '';
  if (!outcomeIsValid(outcome)) {
    return badRequest(
      "outcome must be one of: '', replied, meeting_booked, declined, gatekeeper, wrong_number."
    );
  }

  const created = await insertCommunication({
    db: guard.db,
    businessId: business.id,
    direction: input.direction as 'outbound' | 'inbound',
    channel: input.channel,
    subject,
    body: input.body,
    occurredAt,
    responseTo,
    outcome,
    actorId: guard.user.id
  });

  return Response.json({ communication: created }, { status: 201 });
};
