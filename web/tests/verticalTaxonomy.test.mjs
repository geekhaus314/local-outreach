import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { matchVerticalText, isVerticalId } from '../src/lib/verticals/taxonomy.ts';
import { VERTICAL_IDS } from '../src/lib/verticals/types.ts';

function readIndustries() {
  const csv = readFileSync(new URL('../../leads.csv', import.meta.url), 'utf8');
  const lines = csv.split('\n').filter((line) => line.trim().length > 0);
  const header = lines[0].split(',');
  const industryIndex = header.indexOf('Industry');
  return lines
    .slice(1)
    .map((line) => line.split(',')[industryIndex]?.trim())
    .filter((value) => value && value.length > 0);
}

test('declares exactly one id per vertical and no duplicates', () => {
  assert.equal(new Set(VERTICAL_IDS).size, VERTICAL_IDS.length);
  assert.ok(VERTICAL_IDS.includes('real-estate'));
  assert.ok(VERTICAL_IDS.includes('general'));
});

test('every raw industry in the lead list maps to a declared vertical', () => {
  const industries = [...new Set(readIndustries())];
  const unmapped = industries.filter((industry) => !isVerticalId(matchVerticalText(industry)));
  assert.deepEqual(unmapped, []);
});

test('name keywords beat a wrong industry label', () => {
  assert.equal(matchVerticalText('Diesel Barbershop Winghaven Restaurant'), 'salon');
  assert.equal(matchVerticalText('Hair Saloon Restaurant'), 'salon');
  assert.equal(matchVerticalText('Sparrow Plumbing and Drain Cleaning Plumbing'), 'plumbing');
  assert.equal(matchVerticalText('Classic Aire Care HVAC'), 'hvac');
  assert.equal(matchVerticalText('Arch Dentistry Dental'), 'dental');
  assert.equal(matchVerticalText('AE Landscape Borders Landscaping'), 'landscaping');
});

test('falls back to general for unknown local businesses', () => {
  assert.equal(matchVerticalText('Zzzz Unknown Holding Co'), 'general');
  assert.equal(matchVerticalText(''), 'general');
});

test('new verticals can be matched without a rebuild', () => {
  assert.equal(matchVerticalText('Redfin Real Estate Brokerage'), 'real-estate');
  assert.equal(matchVerticalText('Sunset Pool Service Pool'), 'pool');
  assert.equal(matchVerticalText('Family Vet Animal Hospital Veterinarian'), 'veterinary');
});
