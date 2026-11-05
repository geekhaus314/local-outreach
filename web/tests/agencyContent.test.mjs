import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AGENCY_CONTACT,
  AUDIT_HIGHLIGHTS,
  agencyDesigns,
  agencyFaqs,
  agencyJsonLd,
  agencyPackages,
  agencyServices,
  agencyWork,
  serviceJsonLd
} from '../src/lib/data/agency-content.ts';

test('agency services have unique slugs and complete copy', () => {
  const slugs = new Set();
  for (const service of agencyServices) {
    assert.match(service.slug, /^[a-z0-9-]+$/);
    assert.ok(!slugs.has(service.slug), `duplicate service slug: ${service.slug}`);
    slugs.add(service.slug);
    assert.ok(service.name.length > 3, `${service.slug} needs a name`);
    assert.ok(service.summary.length > 20, `${service.slug} needs a summary`);
    assert.ok(service.deliverables.length >= 3, `${service.slug} needs deliverables`);
    assert.ok(service.outcomes.length >= 1, `${service.slug} needs an outcome`);
  }
});

test('every service has a matching /services/[slug] route payload', () => {
  for (const service of agencyServices) {
    const schema = serviceJsonLd(service);
    assert.equal(schema['@type'], 'Service');
    assert.equal(schema.url, `${AGENCY_CONTACT.url}/services/${service.slug}`);
    assert.equal(schema.provider.telephone, AGENCY_CONTACT.phone);
  }
});

test('work page only links https client sites', () => {
  assert.ok(agencyWork.length >= 3);
  for (const project of agencyWork) {
    assert.match(project.url, /^https:\/\//, `${project.slug} must use https`);
    assert.ok(project.image.startsWith('/work/'), `${project.slug} needs a local image`);
    assert.ok(project.detail.length >= 2, `${project.slug} needs project detail`);
    assert.ok(project.stack.length >= 2, `${project.slug} needs a stack`);
  }
});

test('design directions and package tiers are complete', () => {
  assert.equal(agencyDesigns.length, 4);
  assert.equal(agencyPackages.length, 4);
  for (const design of agencyDesigns) {
    assert.equal(design.swatches.length, 3);
  }
  for (const pkg of agencyPackages) {
    assert.ok(pkg.bestFor.length > 10);
    assert.ok(pkg.includes.length >= 3);
  }
});

test('the public phone and email are the confirmed ones', () => {
  assert.equal(AGENCY_CONTACT.phone, '+16364483574');
  assert.equal(AGENCY_CONTACT.phoneDisplay, '(636) 448-3574');
  assert.equal(AGENCY_CONTACT.email, 'hello@webrehabstl.com');
});

test('structured data carries the business facts and service offers', () => {
  const schema = agencyJsonLd();
  assert.equal(schema['@type'], 'ProfessionalService');
  assert.equal(schema.telephone, AGENCY_CONTACT.phone);
  assert.equal(schema.address.addressLocality, 'St. Louis');
  assert.equal(schema.address.addressRegion, 'MO');
  assert.equal(schema.makesOffer.length, agencyServices.length);
  for (const offer of schema.makesOffer) {
    assert.match(offer.itemOffered.url, /^https:\/\/webrehabstl\.com\/services\//);
  }
});

test('FAQ and audit highlight copy is present', () => {
  assert.ok(agencyFaqs.length >= 5);
  for (const faq of agencyFaqs) {
    assert.ok(faq.question.endsWith('?'));
    assert.ok(faq.answer.length > 30);
  }
  assert.ok(AUDIT_HIGHLIGHTS.length >= 8);
  for (const item of AUDIT_HIGHLIGHTS) {
    assert.ok(item.label.length > 5);
    assert.ok(item.note.length > 5);
  }
});
