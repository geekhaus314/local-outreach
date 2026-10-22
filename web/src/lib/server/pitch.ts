import type { LocalOutreachProspect } from '$lib/content/types';

export type PitchChannel = 'email' | 'sms';

export interface PitchDraft {
  channel: PitchChannel;
  subject: string;
  body: string;
  facts: string[];
}

function shortName(name: string): string {
  const cleaned = name
    .replace(/\b(?:llc|l\.l\.c\.|inc\.?|incorporated|corp\.?|corporation|co\.?|company|ltd\.?|limited)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s,.-]+$/g, '')
    .trim();
  return cleaned || name;
}

function unique(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const fact = (value ?? '').trim();
    if (!fact) continue;
    const key = fact.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(fact);
  }
  return out;
}

export function buildPitch(
  prospect: LocalOutreachProspect,
  options: { channel?: PitchChannel; auditSummary?: string | null } = {}
): PitchDraft | null {
  const name = prospect.name?.trim();
  if (!name) return null;

  const facts = unique([
    ...(prospect.pitch_facts ?? []),
    ...(options.auditSummary ? [options.auditSummary] : [])
  ]);
  if (facts.length === 0) return null;

  const channel = options.channel ?? 'email';
  const cleanName = shortName(name);
  const subject = `${name}: your website`;
  const lead = facts[0].replace(/[.!?\s]+$/, '');

  if (channel === 'sms') {
    const body =
      `Hi ${cleanName} team -- I checked the site listed for ${name} and found that ${lead}. ` +
      `Worth a 10-minute look? Reply here and I'll walk you through it.`;
    return { channel, subject, body, facts };
  }

  const lines = facts.slice(0, 3).map((fact) => `- ${fact.replace(/[.!?\s]+$/, '')}`);
  const body =
    `Hi ${cleanName} team,\n\n` +
    `I was checking the site listed for ${name} and a few things stood out:\n\n` +
    `${lines.join('\n')}\n\n` +
    `I can walk through exactly what I found and what a fixed version would look like. It takes about ten minutes, and there is no pressure either way.\n\n` +
    `If this isn't relevant, just reply and I will leave you alone.\n`;

  return { channel, subject, body, facts };
}
