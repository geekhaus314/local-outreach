import { json } from '@sveltejs/kit';
import {
  classifyIndustry,
  classifyProspectTheme,
  prospectHostnames,
  prospectSlug,
  recommendTemplate,
  type LocalOutreachProspect
} from '$lib/data/clinicContent';
import { getDatabase, listBusinessSummaries, upsertProspect } from '$lib/server/db';
import { isVerticalId, matchVertical } from '$lib/verticals/taxonomy';
import type { RequestHandler } from './$types';

export const prerender = false;

function requireAdmin(locals: App.Locals): boolean {
  return typeof locals.adminEmail === 'string' && locals.adminEmail.length > 0;
}

export const GET: RequestHandler = async ({ locals, platform }) => {
  if (!requireAdmin(locals)) {
    return json({ error: 'Not authorized.' }, { status: 403 });
  }

  const db = getDatabase(platform);
  if (!db) {
    return json({ error: 'The database binding is not configured.' }, { status: 503 });
  }

  const prospects = await listBusinessSummaries(db);
  return json({ prospects });
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  if (!requireAdmin(locals)) {
    return json({ error: 'Not authorized.' }, { status: 403 });
  }

  const db = getDatabase(platform);
  if (!db) {
    return json({ error: 'The database binding is not configured.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Please send the prospect as JSON.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || !('prospect' in body)) {
    return json({ error: 'Body must include a prospect object.' }, { status: 400 });
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
    return json({ error: 'prospect.name is required.' }, { status: 400 });
  }

  const kind = classifyIndustry(prospect);
  const slug = input.slug?.trim() || prospectSlug(prospect);
  const template = input.template || recommendTemplate(kind);
  const theme = input.theme || classifyProspectTheme(prospect, kind);
  const hostnames = input.hostnames?.length ? input.hostnames : prospectHostnames(prospect);
  const vertical = isVerticalId(input.vertical) ? input.vertical : matchVertical(prospect);

  await upsertProspect(db, prospect, {
    id: slug,
    slug,
    template,
    theme,
    vertical,
    hostnames,
    indexable: input.indexable === true
  });

  return json({ ok: true, slug, template, theme, vertical, hostnames }, { status: 201 });
};
