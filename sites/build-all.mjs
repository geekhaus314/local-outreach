#!/usr/bin/env node
/**
 * Build the client mock-up host. The public studio site is now built from the
 * Next.js app in site-rehab-stl, not from the historical static snapshot here.
 *
 *   dist/mockups/          the pitch host. Every client mock-up plus the shared
 *                           kit, served together so the trade switcher works and
 *                           so you can hand someone a link into one mock-up and
 *                           navigate between the others.
 *
 * Deploy it separately from the public studio site, which is built in the
 * site-rehab-stl repository. The split is not cosmetic, it is the whole point
 * of `kind:` in the page config. Combining the projects would put mock-ups of
 * real businesses on the same hostname as the studio's public site.
 *
 *   npx wrangler pages deploy dist/mockups --project-name local-outreach
 */

import {
  readdirSync, readFileSync, cpSync, mkdirSync, rmSync, existsSync,
} from 'node:fs';
import { join, relative } from 'node:path';

import { SITES, REPO } from './build-standalone.mjs';

const DIST = join(REPO, 'dist');
const LEGACY_STUDIO_OUTPUT = join(DIST, 'site-rehab-stl');

// Do not leave an old static export available to deploy in place of the
// canonical Next.js site.
if (existsSync(LEGACY_STUDIO_OUTPUT)) {
  rmSync(LEGACY_STUDIO_OUTPUT, { recursive: true, force: true });
  console.log('  removed obsolete dist/site-rehab-stl export');
}

/* ---- the mock-up host, copied whole --------------------------------------- */
const MOCKUP_HOST = join(DIST, 'mockups');
rmSync(MOCKUP_HOST, { recursive: true, force: true });
mkdirSync(MOCKUP_HOST, { recursive: true });

// Which directories are pages at all, and of what kind.
const pageDirs = readdirSync(SITES)
  .filter((n) => existsSync(join(SITES, n, 'index.html')))
  .map((n) => {
    const cfgPath = join(SITES, n, 'site.config.js');
    const cfg = existsSync(cfgPath) ? readFileSync(cfgPath, 'utf8') : '';
    return { name: n, kind: /kind:\s*'studio'/.test(cfg) ? 'studio' : 'mockup' };
  });
const studioDirs = pageDirs.filter((p) => p.kind === 'studio').map((p) => p.name);
const mockupDirs = pageDirs.filter((p) => p.kind === 'mockup').map((p) => p.name);

// Everything under sites/ is part of the kit and has to travel together: the
// pages reference ../core/ and ../themes/ by relative path, and the trade
// switcher fetches ../themes/*.css at runtime. Copying selectively was the
// obvious optimisation and it is why a flattened mock-up cannot switch themes.
const SKIP_DIRS = new Set(['__pycache__', 'node_modules', '.git']);

// Studio pages are excluded. The service site is the thing being sold; having
// it also served from the mock-up hostname means a prospect who lands on a
// client mock-up is one click from your own homepage, and the reverse -- a
// visitor to your homepage could wander into a directory of other real
// businesses' pitches. Two projects, two hostnames, and each holds only its own
// kind of page.
const SKIP_DIRS_HERE = new Set([...SKIP_DIRS, ...studioDirs]);

function copyTree(from, to) {
  cpSync(from, to, {
    recursive: true,
    filter: (src) => {
      const rel = relative(from, src);
      if (!rel) return true;
      const top = rel.split('/')[0];
      if (SKIP_DIRS_HERE.has(top)) return false;
      // The build scripts are dev tooling. Harmless to ship, but they are not
      // part of what a prospect should be able to read, and check-mockup.mjs in
      // particular documents every rule the mock-ups are meant to satisfy.
      if (top.endsWith('.mjs')) return false;
      return true;
    },
  });
}

copyTree(SITES, MOCKUP_HOST);

console.log(`  mockup host   dist/mockups`);
console.log(`    mock-ups: ${mockupDirs.length}`);
for (const n of mockupDirs) console.log(`      ${n}`);
if (studioDirs.length) {
  console.log(`    excluded (kind: studio): ${studioDirs.join(', ')}`);
}

console.log(
  '\n  deploy the mock-up host separately:\n' +
    '    npx wrangler pages deploy dist/mockups --project-name local-outreach'
);
