import assert from 'node:assert/strict';
import test from 'node:test';

import { createRateLimiter } from '../src/lib/server/rateLimit.ts';

test('rate limiter allows up to the limit, then blocks', () => {
  const limited = createRateLimiter({ windowMs: 60_000, limit: 2 });
  assert.equal(limited('1.2.3.4'), false);
  assert.equal(limited('1.2.3.4'), false);
  assert.equal(limited('1.2.3.4'), true);
});

test('rate limiter tracks addresses separately', () => {
  const limited = createRateLimiter({ windowMs: 60_000, limit: 1 });
  assert.equal(limited('a'), false);
  assert.equal(limited('b'), false);
  assert.equal(limited('a'), true);
  assert.equal(limited('b'), true);
});
