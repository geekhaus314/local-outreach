import { badRequest, guardAdmin } from '$lib/server/admin';
import { upsertProspect } from '$lib/server/db';
import { csvToProspect, parseCsv, readLeadsCsv } from '$lib/server/csvLeads';
import {
  classifyIndustry,
  prospectSlug,
  recommendTemplate
} from '$lib/data/clinicContent';
import { matchVertical } from '$lib/verticals/taxonomy';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 500);
  try {
    const csv = readLeadsCsv();
    const rows = parseCsv(csv);
    return Response.json({ total: rows.length, preview: rows.slice(0, limit).map((r) => ({ name: r['Business Name'], industry: r.Industry, classification: r.Classification, opportunity: r['Opportunity Score'] })) });
  } catch (cause) {
    return badRequest(`Could not read leads.csv: ${cause instanceof Error ? cause.message : String(cause)}`);
  }
};

export const POST: RequestHandler = async ({ locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  let csv: string;
  try {
    csv = readLeadsCsv();
  } catch (cause) {
    return badRequest(`Could not read leads.csv: ${cause instanceof Error ? cause.message : String(cause)}`);
  }

  const rows = parseCsv(csv);
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const name = row['Business Name']?.trim();
    if (!name) {
      skipped++;
      continue;
    }

    try {
      const prospect = csvToProspect(row);
      const slug = prospectSlug(prospect);
      const kind = classifyIndustry(prospect);
      await upsertProspect(guard.db, prospect, {
        id: slug,
        slug,
        template: recommendTemplate(kind),
        theme: '', // let engine auto-classify
        vertical: matchVertical(prospect),
        hostnames: [], // let engine derive
        indexable: false
      });
      imported++;
    } catch (cause) {
      skipped++;
      errors.push(`${name}: ${cause instanceof Error ? cause.message : String(cause)}`);
    }
  }

  return Response.json({ imported, skipped, total: rows.length, errors: errors.slice(0, 10) });
};
