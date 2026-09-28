#!/usr/bin/env node
/**
 * Build both deployables, separately, because they are separate things.
 *
 *   dist/mockups/          the pitch host. Every client mock-up plus the shared
 *                           kit, served together so the trade switcher works and
 *                           so you can hand someone a link into one mock-up and
 *                           navigate between the others.
 *
 *   dist/site-rehab-stl/   your own service site. Self-contained, no demo bar, no
 *                           noindex, no client content, no link out to anything
 *                           that is not yours.
 *
 * The split is not cosmetic, it is the whole point of `kind:` in the page config.
 * Deploying both from one directory would put every client mock-up on the same
 * hostname as the thing you are selling -- a prospect browsing a mock-up of
 * SMP Plumbing would be one click from a directory of other clients' mock-ups,
 * and one of them is a real business that has not agreed to be a case study.
 * It also puts `noindex` pages and an indexable service site under one roof,
 * which is the sort of thing search engines punish and you cannot un-do.
 *
 * So: two Pages projects, two hostnames, two builds. Wire them up as:
 *
 *   npx wrangler pages deploy dist/mockups        --project-name local-outreach
 *   npx wrangler pages deploy dist/site-rehab-stl --project-name webrehabstl
 *
 * The studio page also has a flattened `assets/` copy of only the files it
 * references, which is what makes it deployable at a domain root with no
 * kit-relative paths to resolve.
 */

import {
  readdirSync, readFileSync, statSync, cpSync, mkdirSync, rmSync, existsSync,
} from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { flattenPage, SITES, REPO } from './build-standalone.mjs';

const DIST = join(REPO, 'dist');

/* ---- 1. the studio site, flattened ---------------------------------------- */
let studio;
try {
  studio = flattenPage('site-rehab-stl', DIST);
} catch (e) {
  console.error(`mockup host not built -- studio site failed: ${e.message || e}`);
  process.exit(1);
}
if (studio.kind !== 'studio') {
  console.error(
    `sites/site-rehab-stl declares kind "${studio.kind}", not "studio". Refusing to ` +
    'build the service site from a page that carries mock-up guards -- a noindex ' +
    'or a demo bar in the output would be a silent failure that only shows up in ' +
    'production.'
  );
  process.exit(1);
}
console.log(`  studio site   dist/${relative(DIST, studio.outDir)}  (${studio.plan.length} files)`);

/* ---- 2. the mock-up host, copied whole ------------------------------------ */
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
  '\n  deploy as two separate Pages projects:\n' +
    '    npx wrangler pages deploy dist/mockups        --project-name <mockup-host>\n' +
    '    npx wrangler pages deploy dist/site-rehab-stl --project-name webrehabstl'
);

