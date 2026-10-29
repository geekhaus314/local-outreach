import {
  badRequest,
  notFound,
  requireAdmin,
  requireAuth
} from '$lib/server/admin';
import {
  getBusiness,
  lifecycleStatusIsValid,
  listLeads,
  upsertProspect,
  rowToAdminProspect
} from '$lib/server/db';
import {
  classifyIndustry,
  classifyProspectTheme,
  prospectHostnames,
  prospectSlug,
  recommendTemplate,
  type LocalOutreachProspect
} from '$lib/data/clinicContent';
import { isVerticalId, matchVertical } from '$lib/verticals/taxonomy';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const guard = requireAuth(locals.user, platform);
  if ('response' in guard) return guard.response;

  try {
    const leads = await listLeads(guard.db, {
      q: url.searchParams.get('q') ?? undefined,
      vertical: url.searchParams.get('vertical') ?? undefined,
      kind: url.searchParams.get('kind') ?? undefined,
      lifecycle: url.searchParams.get('lifecycle') ?? undefined,
      status: url.searchParams.get('status') ?? undefined
    });
    return Response.json({ leads });
  } catch (cause) {
    return badRequest(cause instanceof Error ? cause.message : 'Lead filter failed.');
  }
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const guard = requireAdmin(locals.user, platform);
  if ('response' in guard) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Send JSON with a lead object.');
  }

  if (!body || typeof body !== 'object' || !('lead' in body)) {
    return badRequest('Body must include a lead object.');
  }

  const input = body as {
    lead: LocalOutreachProspect;
    slug?: string;
    template?: string;
    theme?: string;
    vertical?: string;
    hostnames?: string[];
    indexable?: boolean;
    lifecycle_status?: string;
  };

  const lead = input.lead;
  if (!lead || typeof lead.name !== 'string' || !lead.name.trim()) {
    return badRequest('lead.name is required.');
  }
  if (
    input.lifecycle_status !== undefined &&
    !(typeof input.lifecycle_status === 'string' && lifecycleStatusIsValid(input.lifecycle_status))
  ) {
    return badRequest(
      'lifecycle_status must be one of: cold, contacted, audited, proposal_sent, converted, rejected.'
    );
  }

  const kind = classifyIndustry(lead);
  const slug = input.slug?.trim() || prospectSlug(lead);
  const existing = await getBusiness(guard.db, slug);
  if (existing) {
    return Response.json({ error: `A lead with slug ${slug} already exists.` }, { status: 409 });
  }

  const template = input.template || recommendTemplate(kind);
  const theme = input.theme || classifyProspectTheme(lead, kind);
  const hostnames = input.hostnames?.length ? input.hostnames : prospectHostnames(lead);
  const vertical = isVerticalId(input.vertical) ? input.vertical : matchVertical(lead);

  await upsertProspect(guard.db, lead, {
    id: slug,
    slug,
    template,
    theme,
    vertical,
    hostnames,
    indexable: input.indexable === true
  });

  if (input.lifecycle_status) {
    await guard.db
      .prepare(
        `UPDATE businesses SET lifecycle_status = ? WHERE slug = ?`
      )
      .bind(input.lifecycle_status, slug)
      .run();
  }

  const created = await getBusiness(guard.db, slug);
  if (!created) return notFound('Lead vanished after create.');
  return Response.json({ lead: rowToAdminProspect(created) }, { status: 201 });
};
