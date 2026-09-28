#!/usr/bin/env node
/**
 * Flatten one page under sites/ into a self-contained directory.
 *
 * Why this exists
 * ---------------
 * A client mock-up is a kit with shared parts: `sites/core/`, `sites/themes/`.
 * That is right for a pitch folder you hand someone in a zip, and wrong for a
 * site you intend to run. The studio page is a *different project* from the
 * mock-up kit -- different purpose, different domain, different audience, and it
 * must not carry the mock-up kit's assumptions (noindex, demo bar, a config with
 * a `sample:` block) just because they happen to share a token system.
 *
 * Deploying it in place would mean pointing one Pages project's root at `sites/`,
 * which puts every client mock-up on the same hostname as the pitch. That is the
 * exact coupling this script removes.
 *
 * So this copies the page and only the files it actually references, flattens
 * the `../core/` paths, and writes the result. The output has no reference to
 * anything outside its own directory.
 *
 *   node sites/build-standalone.mjs                        # the studio page
 *   node sites/build-standalone.mjs st-charles-plumbing    # one mock-up
 *   node sites/build-standalone.mjs --out ../public
 *
 * Deliberately not a bundler. There is nothing to bundle -- no framework, no
 * imports, no node_modules -- and a build step that can fail on a page that
 * already works in a browser is a build step that will eventually stop the
 * deploy. This one only rewrites paths and copies bytes, and it verifies that
 * every reference resolved before it writes anything.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve, relative, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SITES = dirname(fileURLToPath(import.meta.url));
export const REPO = resolve(SITES, '..');

/**
 * Copy one page plus everything it references into `outRoot/<target>/`,
 * rewriting `../core/x.css` to `assets/x.css`.
 *
 * Throws before writing anything if a reference does not resolve, so a failed
 * build never leaves a half-populated output directory behind.
 */
export function flattenPage(target, outRoot = join(REPO, 'dist')) {
  const srcDir = join(SITES, target);
  if (!existsSync(join(srcDir, 'index.html'))) {
    throw new Error(`no index.html in sites/${target}`);
  }

  const html = readFileSync(join(srcDir, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:href|src)="([^"#:][^"]*)"/g)]
    .map((m) => m[1])
    .filter((r) => !/^(https?:|mailto:|tel:|#)/.test(r));

  const plan = [];
  for (const ref of [...new Set(refs)]) {
    const abs = resolve(srcDir, ref);
    if (!abs.startsWith(SITES)) {
      throw new Error(`refusing to copy out of sites/: ${ref}`);
    }
    if (!existsSync(abs) || !statSync(abs).isFile()) {
      throw new Error(`unresolved reference: ${ref}`);
    }
    // Flat: every dependency lands under assets/ by basename. The names do not
    // collide today; if one ever does, this throws rather than silently
    // shipping the wrong file.
    const name = basename(ref);
    const clash = plan.find((p) => p.name === name);
    if (clash) {
      throw new Error(
        `name collision in assets/: ${clash.ref} and ${ref} both want ${name}`
      );
    }
    plan.push({ ref, abs, name });
  }

  const outDir = join(outRoot, target);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(join(outDir, 'assets'), { recursive: true });

  for (const { abs, name } of plan) {
    writeFileSync(join(outDir, 'assets', name), readFileSync(abs));
  }

  // Rewritten per-reference rather than with a blanket regex, because a blanket
  // one also matches href="#price" and src="site.config.js", and both of those
  // mistakes are silent.
  let out = html;
  for (const { ref, name } of plan) {
    out = out.split(`"${ref}"`).join(`"assets/${name}"`);
  }
  writeFileSync(join(outDir, 'index.html'), out);

  const cfg = existsSync(join(srcDir, 'site.config.js'))
    ? readFileSync(join(srcDir, 'site.config.js'), 'utf8')
    : '';
  const kind = /kind:\s*'studio'/.test(cfg) ? 'studio' : 'mockup';

  return { outDir, kind, plan };
}

/* ---- CLI ---------------------------------------------------------------- */
const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  const argv = process.argv.slice(2);
  const outFlag = argv.indexOf('--out');
  const outRoot =
    outFlag === -1 ? join(REPO, 'dist') : resolve(process.cwd(), argv[outFlag + 1]);
  const target =
    argv.find((a, i) => !a.startsWith('--') && i !== outFlag + 1) || 'site-rehab-stl';

  try {
    const { outDir, kind, plan } = flattenPage(target, outRoot);
    console.log(`built sites/${target} -> ${relative(process.cwd(), outDir)}`);
    console.log(`  kind      ${kind}`);
    for (const { ref, name } of plan) {
      console.log(`  ${ref.padEnd(28)} -> assets/${name}`);
    }
    if (kind === 'mockup') {
      console.log(
        '  note: the trade switcher fetches ../themes/*.css, which a flattened\n' +
        '        copy does not carry. Use build-all.mjs for a working mock-up host.'
      );
    }
  } catch (e) {
    console.error(String(e.message || e));
    process.exit(1);
  }
}
