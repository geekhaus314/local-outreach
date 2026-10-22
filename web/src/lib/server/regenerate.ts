import { generateSiteContent } from '$lib/content/engine';
import { isThemeName } from '$lib/data/themes';
import { isVerticalId } from '$lib/verticals/taxonomy';
import { auditSummaryLine, auditWebsite } from './audit';
import { buildPitch } from './pitch';
import {
  getBusiness,
  insertAudit,
  insertMockup,
  insertPitch,
  nextMockupVersion,
  parseArray,
  rowToProspect,
  updateBusiness
} from './db';

export type RegenerateKind = 'audit' | 'pitch' | 'mockup' | 'all';

export const REGENERATE_KINDS: readonly RegenerateKind[] = ['audit', 'pitch', 'mockup', 'all'];

export class RegenerateError extends Error {}

export interface RegenerateOutcome {
  kind: RegenerateKind;
  businessId: string;
  slug: string;
  audit?: { id: string; health: number; summary: string; needsRehab: boolean; findings: number };
  pitch?: { id: string; channel: string };
  mockup?: { id: string; contentVersion: number; previewHost: string };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function regenerateBusiness(
  db: import('@cloudflare/workers-types').D1Database,
  id: string,
  kind: RegenerateKind
): Promise<RegenerateOutcome> {
  const row = await getBusiness(db, id);
  if (!row) throw new RegenerateError('That prospect does not exist.');

  const outcome: RegenerateOutcome = { kind, businessId: id, slug: row.slug };
  let auditSummary = row.audit_summary;

  if (kind === 'audit' || kind === 'all') {
    if (!row.website.trim()) {
      throw new RegenerateError('No website is listed for this prospect, so there is nothing to audit.');
    }

    const result = await auditWebsite(row.website, row.name);
    auditSummary = auditSummaryLine(result);
    const auditId = crypto.randomUUID();

    await insertAudit(db, {
      id: auditId,
      businessId: id,
      summary: auditSummary,
      findings: result.findings.map((item) => item.label),
      siteHealth: result.health
    });
    await updateBusiness(db, id, {
      site_health: result.health,
      audit_summary: auditSummary,
      last_audited: today()
    });

    outcome.audit = {
      id: auditId,
      health: result.health,
      summary: auditSummary,
      needsRehab: result.needsRehab,
      findings: result.findings.length
    };
  }

  if (kind === 'pitch' || kind === 'all') {
    const prospect = rowToProspect(row);
    const draft = buildPitch(prospect, { channel: 'email', auditSummary });
    if (!draft) {
      throw new RegenerateError(
        'There are no verifiable facts stored for this prospect, so a pitch cannot be generated. Run an audit first or add pitch facts.'
      );
    }

    const pitchId = crypto.randomUUID();
    await insertPitch(db, { id: pitchId, businessId: id, channel: draft.channel, body: draft.body });
    outcome.pitch = { id: pitchId, channel: draft.channel };
  }

  if (kind === 'mockup' || kind === 'all') {
    const prospect = rowToProspect(row);
    const content = generateSiteContent(prospect, {
      id: row.slug,
      vertical: isVerticalId(row.vertical) ? row.vertical : undefined,
      theme: isThemeName(row.theme) ? row.theme : undefined,
      hostnames: parseArray(row.hostnames),
      indexable: row.indexable === 1
    });
    const contentVersion = await nextMockupVersion(db, id);
    const mockupId = crypto.randomUUID();

    await insertMockup(db, {
      id: mockupId,
      businessId: id,
      template: content.template,
      theme: content.theme,
      contentVersion,
      previewHost: content.siteUrl,
      isIndexable: row.indexable === 1
    });
    outcome.mockup = { id: mockupId, contentVersion, previewHost: content.siteUrl };
  }

  return outcome;
}
