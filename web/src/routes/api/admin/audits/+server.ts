import { badRequest, guardAdmin, notFound } from '$lib/server/admin';
import { getBusiness, insertAudit, listAudits } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const businessId = url.searchParams.get('business_id') ?? undefined;
  const audits = await listAudits(guard.db, businessId);
  return Response.json({ audits });
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return badRequest('Please send the audit as JSON.');
  }

  const businessId = typeof body.businessId === 'string' ? body.businessId : '';
  const summary = typeof body.summary === 'string' ? body.summary : '';
  const findings = Array.isArray(body.findings)
    ? body.findings.filter((item): item is string => typeof item === 'string')
    : [];
  const siteHealth = typeof body.siteHealth === 'number' ? body.siteHealth : null;

  if (!businessId || !summary.trim()) {
    return badRequest('businessId and summary are required.');
  }

  const business = await getBusiness(guard.db, businessId);
  if (!business) return notFound('That prospect does not exist.');

  const id = crypto.randomUUID();
  await insertAudit(guard.db, { id, businessId, summary: summary.trim(), findings, siteHealth });
  return Response.json({ audit: { id, businessId, summary: summary.trim(), findings, siteHealth } }, { status: 201 });
};
