import { generateSiteContent } from '$lib/content/engine';
import { badRequest, guardAdmin, notFound } from '$lib/server/admin';
import {
  getBusiness,
  insertMockup,
  listMockups,
  nextMockupVersion,
  parseArray,
  rowToProspect
} from '$lib/server/db';
import { isThemeName } from '$lib/data/themes';
import { isVerticalId } from '$lib/verticals/taxonomy';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const businessId = url.searchParams.get('business_id') ?? undefined;
  const mockups = await listMockups(guard.db, businessId);
  return Response.json({ mockups });
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return badRequest('Please send the mockup request as JSON.');
  }

  const businessId = typeof body.businessId === 'string' ? body.businessId : '';
  if (!businessId) return badRequest('businessId is required.');

  const business = await getBusiness(guard.db, businessId);
  if (!business) return notFound('That prospect does not exist.');

  const content = generateSiteContent(rowToProspect(business), {
    id: business.slug,
    vertical: isVerticalId(business.vertical) ? business.vertical : undefined,
    theme: isThemeName(business.theme) ? business.theme : undefined,
    hostnames: parseArray(business.hostnames),
    indexable: business.indexable === 1
  });
  const contentVersion = await nextMockupVersion(guard.db, business.id);
  const id = crypto.randomUUID();

  await insertMockup(guard.db, {
    id,
    businessId: business.id,
    template: content.template,
    theme: content.theme,
    contentVersion,
    previewHost: content.siteUrl,
    isIndexable: business.indexable === 1
  });

  return Response.json(
    { mockup: { id, businessId: business.id, template: content.template, theme: content.theme, contentVersion, previewHost: content.siteUrl, isIndexable: business.indexable === 1, createdAt: new Date().toISOString() } },
    { status: 201 }
  );
};
