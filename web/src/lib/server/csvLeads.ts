import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LocalOutreachProspect } from '$lib/content/types';

const ROOT = join(process.cwd(), '..');
export const CSV_PATH = join(ROOT, 'leads.csv');

export interface CsvLead {
  'Business Name': string;
  Industry: string;
  Phone: string;
  Address: string;
  Website: string;
  'Traffic Tier': string;
  'Decision Maker': string;
  Classification: string;
  'Opportunity Score': string;
  'Need Score': string;
  'Value Score': string;
  'Site Health': string;
  Rating: string;
  'Review Count': string;
  'Audit Summary': string;
  'Pitch Facts': string;
  Sources: string;
  'Source IDs': string;
  'Low Confidence': string;
  'Maps URL': string;
  'Persona Read': string;
}

export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export function parseCsv(csv: string): CsvLead[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows: CsvLead[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = (values[j] ?? '').replace(/^"|"$/, '').trim();
    }
    rows.push(row as unknown as CsvLead);
  }

  return rows;
}

export function readLeadsCsv(): string {
  return readFileSync(CSV_PATH, 'utf-8');
}

export function csvToProspect(row: CsvLead): LocalOutreachProspect {
  const pitchFacts = (row['Pitch Facts'] || '')
    .split(' | ')
    .map((f) => f.trim())
    .filter(Boolean);
  const sources = (row.Sources || 'gmaps')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const siteHealth = row['Site Health'] ? Number(row['Site Health']) : null;
  const rating = row.Rating ? Number(row.Rating) : null;
  const reviewCount = row['Review Count'] ? Number(row['Review Count']) : null;

  return {
    name: row['Business Name'],
    industry: row.Industry,
    phone: row.Phone,
    address: row.Address,
    website: row.Website,
    email: '',
    traffic_tier: row['Traffic Tier'],
    decision_maker: row['Decision Maker'],
    classification: row.Classification as LocalOutreachProspect['classification'],
    opportunity: Number(row['Opportunity Score']) || 50,
    need_score: Number(row['Need Score']) || 50,
    value_score: Number(row['Value Score']) || 50,
    site_health: siteHealth,
    rating,
    review_count: reviewCount,
    audit_summary: row['Audit Summary'],
    pitch_facts: pitchFacts,
    sources,
    source_ids: row['Source IDs'],
    low_confidence: row['Low Confidence']?.toLowerCase() === 'yes',
    maps_url: row['Maps URL'],
    last_audited: '',
    persona: row['Persona Read']
  };
}
