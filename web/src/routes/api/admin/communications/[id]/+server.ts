import { badRequest, notFound, requireAdmin, requireAuth } from '$lib/server/admin';
import {
  channelIsValid,
  deleteCommunication,
  getCommunication,
  outcomeIsValid,
  updateCommunication
} from '$lib/server/db';
import type { RequestHandler } from './$types';
import type { CommunicationOutcome } from '$lib/server/db';

export const prerender = false;

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const guard = requireAuth(locals.user, platform);
  if ('response' in guard) return guard.response;

  const communication = await getCommunication(guard.db, params.id);
  if (!communication) return notFound('That communication does not exist.');

  return Response.json({ communication });
};

export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
  const guard = requireAdmin(locals.user, platform);
  if ('response' in guard) return guard.response;

  const existing = await getCommunication(guard.db, params.id);
  if (!existing) return notFound('That communication does not exist.');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Send JSON with the fields to update.');
  }

  const input = (body ?? {}) as {
    channel?: unknown;
    subject?: unknown;
    body?: unknown;
    occurred_at?: unknown;
    outcome?: unknown;
  };

  if (input.channel !== undefined) {
    if (typeof input.channel !== 'string' || !channelIsValid(input.channel)) {
      return badRequest('channel must be one of: email, sms, call, voicemail, form, in_person, letter.');
    }
  }
  if (input.subject !== undefined && typeof input.subject !== 'string') {
    return badRequest('subject must be a string.');
  }
  if (input.body !== undefined) {
    if (typeof input.body !== 'string' || !input.body.trim()) return badRequest('body cannot be emptied.');
    if (input.body.length > 50_000) return badRequest('body is too long.');
  }
  if (input.occurred_at !== undefined) {
    if (input.occurred_at === null) {
      // clearing the timestamp is allowed
    } else if (
      typeof input.occurred_at !== 'string' ||
      !input.occurred_at ||
      Number.isNaN(Date.parse(input.occurred_at))
    ) {
      return badRequest('occurred_at must be null or an ISO date string.');
    }
  }
  if (input.outcome !== undefined) {
    if (typeof input.outcome !== 'string' || !outcomeIsValid(input.outcome)) {
      return badRequest(
        "outcome must be one of: '', replied, meeting_booked, declined, gatekeeper, wrong_number."
      );
    }
  }

  await updateCommunication(guard.db, existing.id, {
    channel: input.channel as string | undefined,
    subject: input.subject as string | undefined,
    body: input.body as string | undefined,
    occurredAt: input.occurred_at === undefined ? undefined : (input.occurred_at as string | null),
    outcome: input.outcome as CommunicationOutcome | undefined
  });

  const communication = await getCommunication(guard.db, existing.id);
  return Response.json({ communication });
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const guard = requireAdmin(locals.user, platform);
  if ('response' in guard) return guard.response;

  const existing = await getCommunication(guard.db, params.id);
  if (!existing) return notFound('That communication does not exist.');

  await deleteCommunication(guard.db, existing.id);
  return Response.json({ ok: true, deleted: existing.id });
};
