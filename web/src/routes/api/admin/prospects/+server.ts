import {
  classifyIndustry,
  classifyProspectTheme,
  prospectHostnames,
  prospectSlug,
  recommendTemplate,
  type LocalOutreachProspect
} from '$lib/data/clinicContent';
import { badRequest, guardAdmin } from '$lib/server/admin';
import { listBusinessSummaries, upsertProspect } from '$lib/server/db';
import { isVerticalId, matchVertical } from '$lib/verticals/taxonomy';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const prospects = await listBusinessSummaries(guard.db, {
    q: url.searchParams.get('q') ?? undefined,
    vertical: url.searchParams.get('vertical') ?? undefined,
    kind: url.searchParams.get('kind') ?? undefined,
    status: url.searchParams.get('status') ?? undefined,
    lifecycle: url.searchParams.get('lifecycle') ?? undefined
  });
  return Response.json({ prospects });
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Please send the prospect as JSON.');
  }

  if (!body || typeof body !== 'object' || !('prospect' in body)) {
    return badRequest('Body must include a prospect object.');
  }

  const input = body as {
    prospect: LocalOutreachProspect;
    slug?: string;
    template?: string;
    theme?: string;
    vertical?: string;
    hostnames?: string[];
    indexable?: boolean;
  };

  const prospect = input.prospect;
  if (!prospect || typeof prospect.name !== 'string' || !prospect.name.trim()) {
    return badRequest('prospect.name is required.');
  }

  const kind = classifyIndustry(prospect);
  const slug = input.slug?.trim() || prospectSlug(prospect);
  const template = input.template || recommendTemplate(kind);
  const theme = input.theme || classifyProspectTheme(prospect, kind);
  const hostnames = input.hostnames?.length ? input.hostnames : prospectHostnames(prospect);
  const vertical = isVerticalId(input.vertical) ? input.vertical : matchVertical(prospect);

  await upsertProspect(guard.db, prospect, {
    id: slug,
    slug,
    template,
    theme,
    vertical,
    hostnames,
    indexable: input.indexable === true
  });

  return Response.json({ ok: true, slug, template, theme, vertical, hostnames }, { status: 201 });
};
