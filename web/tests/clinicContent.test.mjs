import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  classifyProspectTheme,
  generateSiteContent,
  recommendTemplate,
  normalizeHostname,
  prospectHostnames,
  prospectSlug
} from '../src/lib/data/clinicContent.ts';

const envelope = JSON.parse(
  readFileSync(new URL('../prospects/royal-kutz.json', import.meta.url), 'utf8')
);
const royalKutz = envelope.prospect;
const hostnames = envelope.hostnames;

test('classifies hair, medical, and SMP prospects into distinct themes', () => {
  assert.equal(classifyProspectTheme({ ...royalKutz, industry: 'Hair Salon' }), 'salon-wellness');
  assert.equal(
    classifyProspectTheme({ ...royalKutz, name: 'Advanced Hair Restoration', industry: 'Hair Transplant Surgeon' }),
    'hair-restoration-clinical'
  );
  assert.equal(
    classifyProspectTheme({ ...royalKutz, name: 'Scalp Studio', industry: 'Scalp Micropigmentation' }),
    'smp-ink'
  );
});

test('normalizes hostnames without protocol, port, or www', () => {
  assert.equal(normalizeHostname('WWW.Example.com:443'), 'example.com');
  assert.equal(normalizeHostname('royal-kutz.preview.localhost'), 'royal-kutz.preview.localhost');
});

test('derives preview hostnames and excludes directory hosts', () => {
  const hosts = prospectHostnames(royalKutz);
  const slug = prospectSlug(royalKutz);
  assert.ok(hosts.includes(`${slug}.preview.localhost`));
  assert.ok(hosts.includes(`${slug}.localhost`));
  assert.ok(hosts.every((host) => !host.includes('zenoti.com')));
});

test('generates a complete mockup from a real prospect record', () => {
  const content = generateSiteContent(royalKutz, { hostnames });

  assert.equal(content.business.name, 'Royal Kutz Salon, Barber & Spa');
  assert.equal(content.theme, 'salon-wellness');
  assert.equal(content.isPreview, true);
  assert.equal(content.seo.noindex, true);
  assert.equal(content.proof.rating, 4.8);
  assert.equal(content.proof.reviewCount, 181);
  assert.equal(content.business.phone.dial, 'tel:+16362944856');
  assert.ok(content.offerings.length >= 3);
  assert.ok(content.offerings.every((offering) => offering.id && offering.name));
  assert.ok(content.offerings.every((offering) => !('priceFrom' in offering)));
  assert.equal(content.booking.notification.webhookEnv, 'BOOKING_WEBHOOK_URL');
  assert.equal(content.booking.notification.apiKeyEnv, 'BOOKING_API_KEY');
  assert.ok(!JSON.stringify(content).toLowerCase().includes('myhairloss'));
});

test('honors indexable and siteUrl overrides', () => {
  const content = generateSiteContent(royalKutz, {
    hostnames: ['example.com'],
    indexable: true,
    siteUrl: 'https://example.com'
  });

  assert.equal(content.isPreview, false);
  assert.equal(content.seo.noindex, false);
  assert.equal(content.siteUrl, 'https://example.com');
});

test('omits reputation proof when the prospect has no rating', () => {
  const content = generateSiteContent({ ...royalKutz, rating: null, review_count: null });
  assert.equal(content.proof, null);
  assert.ok(content.hero.trust.every((item) => !item.includes('★')));
});

test('rejects prospects without a name', () => {
  assert.throws(
    () => generateSiteContent({ ...royalKutz, name: '   ' }),
    /name is required/
  );
});

test('classifies a mislabeled barbershop by name before industry', () => {
  assert.equal(
    classifyProspectTheme({ ...royalKutz, name: 'Diesel Barbershop Winghaven', industry: 'Restaurant' }),
    'salon-wellness'
  );
  assert.equal(recommendTemplate('salon'), 'editorial');
  assert.equal(recommendTemplate('restaurant'), 'menu');
  assert.equal(recommendTemplate('automotive'), 'service');
  assert.equal(recommendTemplate('dental'), 'clinic');
  assert.equal(recommendTemplate('landscaping'), 'project');
  assert.equal(recommendTemplate('general'), 'general');
});
