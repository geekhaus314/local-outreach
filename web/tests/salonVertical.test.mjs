import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { generateSiteContent } from '../src/lib/content/engine.ts';
import { VERTICAL_METAS } from '../src/lib/verticals/meta.ts';
import { matchVertical } from '../src/lib/verticals/taxonomy.ts';

const envelope = JSON.parse(
  readFileSync(new URL('../prospects/royal-kutz.json', import.meta.url), 'utf8')
);
const royalKutz = envelope.prospect;

test('the only real prospect matches the salon vertical', () => {
  assert.equal(matchVertical(royalKutz), 'salon');
  assert.equal(matchVertical({ name: 'Diesel Barbershop Winghaven', industry: 'Restaurant' }), 'salon');
});

test('salon is a declared vertical with its own meta and fallback', () => {
  const meta = VERTICAL_METAS.find((item) => item.id === 'salon');
  assert.ok(meta, 'salon meta is missing');
  assert.equal(meta.theme, 'modern-wellness');
  assert.equal(meta.legacyTemplate, 'editorial');
});

test('the generated salon content carries every link target and no invented price', () => {
  const content = generateSiteContent(royalKutz, { hostnames: envelope.hostnames });

  assert.equal(content.vertical, 'salon');
  assert.equal(content.industryKind, 'salon');
  assert.deepEqual(
    content.offerings.map((offering) => offering.id),
    ['cut', 'color', 'styling', 'scalp-care']
  );

  const serviceIds = new Set(content.offerings.map((offering) => offering.id));
  assert.equal(serviceIds.size, content.offerings.length);
  assert.ok(content.offerings.every((offering) => offering.priceFrom === undefined));
  assert.ok(content.offerings.every((offering) => offering.pricing === undefined));
  assert.ok(content.offerings.every((offering) => offering.image.startsWith('/media/')));

  for (const item of content.nav) {
    assert.ok(item.href.startsWith('/') || item.href.startsWith('#'), `bad nav href: ${item.href}`);
  }

  assert.equal(content.booking.endpoint, '/api/booking');
  assert.ok(content.booking.fields.some((field) => field.name === 'treatment'));
  assert.equal(JSON.stringify(content).includes('Brian'), false);
  assert.equal(JSON.stringify(content).toLowerCase().includes('myhairloss'), false);
});
