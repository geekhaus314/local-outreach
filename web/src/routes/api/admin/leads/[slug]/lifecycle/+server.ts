import { badRequest, notFound, requireAdmin } from '$lib/server/admin';
import {
  getBusiness,
  lifecycleStatusIsValid,
  recordLifecycleTransition
} from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

/**
 * Lead lifecycle transition: cold → contacted → audited → proposal_sent →
 * converted (or rejected). Moves are recorded in lifecycle_events with the
 * acting user, so the analytics funnel and monthly outreach performance come
 * from real history rather than the current column value alone.
 */
export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
  const guard = requireAdmin(locals.user, platform);
  if ('response' in guard) return guard.response;

  const row = await getBusiness(guard.db, params.slug);
  if (!row) return notFound('That lead does not exist.');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Send JSON with a lifecycle_status.');
  }

  const { lifecycle_status: toStatus, note } = (body ?? {}) as {
    lifecycle_status?: unknown;
    note?: unknown;
  };

  if (typeof toStatus !== 'string' || !lifecycleStatusIsValid(toStatus)) {
    return badRequest(
      'lifecycle_status must be one of: cold, contacted, audited, proposal_sent, converted, rejected.'
    );
  }
  if (note !== undefined && typeof note !== 'string') {
    return badRequest('note must be a string.');
  }

  const fromStatus = await recordLifecycleTransition(guard.db, {
    businessId: row.id,
    toStatus,
    actorId: guard.user.id,
    note: (note ?? '').slice(0, 2000)
  });

  return Response.json({
    from: fromStatus,
    to: toStatus,
    lead: { slug: row.slug, name: row.name, lifecycle_status: toStatus }
  });
};
