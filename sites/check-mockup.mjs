#!/usr/bin/env node
/**
 * Page guard for everything under sites/.
 *
 * A pitch mock-up has one dangerous failure mode, and it is not a broken
 * layout. It is invented content that reads as fact. The first St Charles
 * mock-up carried "15 years in business", "98% same-day" and a camera-inspection
 * service, none of which anybody had verified, on a page that existed
 * specifically to be believed. The recipient cannot tell which numbers are real
 * and which were filler, and he will not ask.
 *
 * So this check is deliberately unfashionable. It fails the build when:
 *
 *   1. a brand name or phone number is hardcoded in markup instead of coming
 *      from the config -- that is the genotype/phenotype gap, where the config
 *      looks like the per-client delta but editing a client means editing the
 *      template anyway
 *   2. a page has numbers presented as stats with no blank and no config value
 *      behind them
 *   3. a page reaches the network, writes to storage, or posts a form
 *   4. a mock-up forgets its demo guard, or forgets noindex
 *   5. a theme is referenced that does not exist
 *
 * Rule 2 is the one that matters. It is the reason `sample:` exists as a
 * separate key in site.config.js: invented content has to be declared, and
 * `check-mockup.mjs` is what makes declaring it cheaper than lying by
 * omission.
 *
 * Two kinds of page live under sites/, and they are held to opposite rules:
 *
 *   mockup   a pitch artefact for a client's business. Unpublishable, sealed
 *            from the network, invented content declared and marked.
 *   studio   a real, public site -- currently site-rehab-stl, the destination
 *            every cold message links to. Indexable, free to link outward, and
 *            with nothing invented on it anywhere.
 *
 * A page declares which with `kind:` in its config. The distinction is enforced
 * rather than assumed, because the mock-up rules are actively wrong for a live
 * page: noindex on the studio site would suppress the only part of the pitch
 * that works, and a demo bar on it would be a lie.
 *
 *   node sites/check-mockup.mjs            # every page under sites/
 *   node sites/check-mockup.mjs --quiet
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITES = dirname(fileURLToPath(import.meta.url));
const quiet = process.argv.includes('--quiet');

const RED = '\x1b[31m', GRN = '\x1b[32m', YEL = '\x1b[33m', DIM = '\x1b[2m', OFF = '\x1b[0m';

/** Page dirs are the ones holding an index.html. core/ and themes/ are not. */
function pageDirs() {
  return readdirSync(SITES)
    .map((n) => join(SITES, n))
    .filter((p) => statSync(p).isDirectory())
    .filter((p) => existsSync(join(p, 'index.html')))
    .filter((p) => !['core', 'themes', 'node_modules'].includes(relative(SITES, p)));
}

let failures = 0;
let warnings = 0;

/* Both pages discuss these directives in their own comments -- the studio page
 * explains at length why it has no noindex, and the mock-up explains why it has
 * one. A substring search for the word therefore reports the reasoning instead
 * of the behaviour, which is how the first version of this file failed a page
 * for documenting the rule it was correctly following. Match the directive, not
 * the discussion of it. */
const hasNoindex = (html) => /<meta\b[^>]*\bnoindex\b/i.test(html);
const hasDemobar = (html) => /class="[^"]*\bdemobar\b/.test(html);
const hasAttr = (html, name) => new RegExp(`\\b${name}="`).test(html);

function check(page, name, ok, detail = '', { warn = false } = {}) {
  if (ok) {
    if (!quiet) console.log(`  ${GRN}pass${OFF}  ${name}`);
    return;
  }
  if (warn) {
    warnings++;
    console.log(`  ${YEL}warn${OFF}  ${name}${detail ? '  — ' + detail : ''}`);
  } else {
    failures++;
    console.log(`  ${RED}FAIL${OFF}  ${name}${detail ? '  — ' + detail : ''}`);
  }
}

/* ------------------------------------------------------------------------- *
 * Shared: true of every page under sites/, whatever kind it is.
 * ------------------------------------------------------------------------- */
function auditCommon(label, html, cfg, dir) {
  // ---- the config has to be the real source of the brand ---------------- //
  const configName = cfg.match(/name:\s*'([^']+)'/)?.[1];
  // A literal phone number in markup is the clearest tell: it has to be
  // repeated at every call site and it will drift from the config.
  const hardcodedTel = [...html.matchAll(/href="(tel:[^"]+)"/g)].map((m) => m[1]);
  const uniqueTel = [...new Set(hardcodedTel)];
  check(
    label, 'brand phone comes from config, not markup',
    uniqueTel.length <= 1,
    `${uniqueTel.length} distinct tel: hrefs in markup: ${uniqueTel.join(', ')}`
  );
  check(label, 'config declares name', !!configName);
  check(label, 'markup binds facts via data-fact', /data-fact="name"/.test(html));

  // ---- nothing should be doing anything --------------------------------- //
  // A visitor's URL and their answers are not ours to keep. Every page here is
  // static, so nothing on any of them has a reason to open a connection or
  // write to storage.
  const netApis = [...html.matchAll(/\b(fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie|navigator\.send)\b/g)];
  check(label, 'no network or storage APIs', netApis.length === 0, netApis.map((m) => m[1]).join(', '));
  check(label, 'no form posts anywhere', !/<form[^>]*(action|method)=/i.test(html));

  // ---- wiring ------------------------------------------------------------ //
  for (const ref of [...html.matchAll(/(?:href|src)="([^"#:]+)"/g)].map((m) => m[1])) {
    check(label, `resolves: ${ref}`, existsSync(resolve(dir, ref)));
  }
  const js = readFileSync(join(SITES, 'core', 'site.js'), 'utf8');
  const themes = [...js.matchAll(/(\w+):\s*'\.\.\/themes\/(\w+)\.css'/g)].map((m) => m[2]);
  check(label, 'runtime references at least one theme', themes.length > 0);
  for (const t of themes) {
    check(label, `theme ${t}.css exists`, existsSync(join(SITES, 'themes', `${t}.css`)));
  }
}

/* ------------------------------------------------------------------------- *
 * mockup: a pitch artefact. Unpublishable, sealed, nothing invented undeclared.
 * ------------------------------------------------------------------------- */
function auditMockup(label, html, cfg) {
  check(label, 'declares kind: mockup',
    /kind:\s*'mockup'/.test(cfg) || !/\bkind:/.test(cfg),
    'expected kind: \'mockup\'');
  check(label, 'config splits facts from sample',
    /facts:\s*\{/.test(cfg) && /sample:\s*\{/.test(cfg),
    'expected top-level `facts` and `sample` objects');
  check(label, 'markup renders sample sections via data-sample', hasAttr(html, 'data-sample'));

  // ---- no undeclared numbers presented as facts ------------------------- //
  // A stat with a data-count and no config value is an invented number.
  const stats = [...html.matchAll(/<b\b[^>]*data-count="([^"]+)"[^>]*>/g)];
  check(label, 'no hardcoded data-count stats (use data-blank + config)',
    stats.length === 0,
    stats.length ? `${stats.length} found: ${stats.map((s) => s[1]).join(', ')}` : '');
  const blanks = [...html.matchAll(/data-blank="(\w+)"/g)].map((m) => m[1]);
  for (const b of blanks) {
    check(label, `blank "${b}" is declared in config`, new RegExp(`\\b${b}:`).test(cfg));
    check(label, `blank "${b}" is null (unknown), not a guess`,
      new RegExp(`\\b${b}:\\s*null`).test(cfg),
      'an unverified number belongs in the config as null so it renders empty');
  }
  check(label, 'unknown values are null, not invented',
    !/\b(yearsInBusiness|sameDayRate|rating|reviewCount):\s*'?[\d.]/.test(cfg),
    'config has a populated number where a null would be honest');

  // ---- it must not do anything ------------------------------------------ //
  const externals = [...html.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
  check(label, 'no external origins', externals.length === 0, externals.join(', '));
  check(label, 'form is marked as a demo', /data-demo-form/.test(html));

  // ---- the demo guard --------------------------------------------------- //
  check(label, 'demo bar present', hasDemobar(html));
  check(label, 'demo bar says it is a mock-up', /mock-up/i.test(html));
  check(label, 'noindex set', hasNoindex(html));
  check(label, 'sample stylesheet loaded', /core\/sample\.css/.test(html));
  check(label, 'mockup flag is set', /mockup:\s*true/.test(cfg));

  // The trade switcher must not ship in the markup. It is a live-demo aid; a
  // prospect reading their own mock-up does not need four buttons for other
  // trades, and a client receiving this folder can enable it themselves. The
  // flag is what turns it on, so the check is that the flag exists and the
  // buttons are absent from the HTML.
  check(label, 'trade switcher is off by default, or explicitly enabled',
    /showTradeSwitcher/.test(cfg),
    'no showTradeSwitcher key: a client cannot tell whether the picker is on');
  // Scoped to <button> on purpose. The page's own theme <link> carries
  // data-theme too, and that is load-bearing -- the first version of this check
  // matched it and failed a correct page.
  const inlinePicker = /<button[^>]*data-theme=/.test(html);
  check(label, 'no trade buttons hardcoded in the markup',
    !inlinePicker,
    inlinePicker ? 'buttons are in the HTML, so they render whether or not they are wanted' : '');
}

/* ------------------------------------------------------------------------- *
 * studio: a real site. The inverses, plus a live contact route.
 * ------------------------------------------------------------------------- */
function auditStudio(label, html, cfg) {
  check(label, 'declares kind: studio', /kind:\s*'studio'/.test(cfg));

  // ---- the inverses. Each of these is a mock-up rule, correctly refused. -- //
  check(label, 'NOT noindex - this is the live destination',
    !hasNoindex(html),
    'noindex would hide the one page every cold message links to');
  check(label, 'no demo bar on a real site',
    !hasDemobar(html),
    'a "nothing here works" bar on a working page is a lie');
  check(label, 'no sample block - nothing on this page is invented',
    !/^\s*sample:\s*\{/m.test(cfg),
    'the studio page has no sample channel, so an invented fact would ship unmarked');
  check(label, 'no data-blank slots',
    !hasAttr(html, 'data-blank'),
    'a blank slot implies a missing fact; here the fact is simply absent');
  check(label, 'no data-sample blocks', !hasAttr(html, 'data-sample'));

  // ---- it has to be reachable -------------------------------------------- //
  check(label, 'has a real contact route',
    /href="mailto:/.test(html) || /href="tel:/.test(html),
    'a public site with no way to make contact is a brochure');

  // ---- the estimator's restraint ---------------------------------------- //
  // The one guard specific to this page. estimator.js may quote a price,
  // because a price is something that can be defended. It may not quote the
  // visitor's revenue, because that number cannot be measured from the outside
  // and every version of it is invented. That is exactly the failure
  // parse_leads.py refuses to commit ("no conversion rate is assumed anywhere in
  // this file"), and it would be easy to add back later as a helpful extra, so
  // it is pinned here rather than left to judgement.
  const est = join(SITES, 'core', 'estimator.js');
  if (!existsSync(est)) return;
  const src = readFileSync(est, 'utf8');
  // Scan code, not prose. The first version of this check failed on its own
  // reasoning: estimator.js explains at length why it refuses to estimate
  // revenue, and the word "revenue" appeared in those comments, so a guard
  // meant to catch an invented number was flagging the decision not to invent
  // one. Comments and string literals are stripped before the scan, which
  // leaves exactly the thing worth policing -- a revenue-shaped identifier
  // holding a value. Prose in a caveat stays legal, and should be.
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1 ')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``');
  const banned = [...new Set(
    [...code.matchAll(/\b(revenue|roi|conversion|traffic|earnings|payback|profit)\b/gi)]
      .map((m) => m[1].toLowerCase())
  )];
  check(label, 'estimator computes no revenue or conversion figure',
    banned.length === 0,
    banned.length ? `identifiers holding such a value: ${banned.join(', ')}` : '');
  check(label, 'estimator is loaded by the page', /core\/estimator\.js/.test(html));
  check(label, 'estimator has a container', /data-estimator/.test(html));

  /* ---- the estimator's decisions, actually executed --------------------- *
   * Static checks cannot see a logic bug, and this file has already shipped one:
   * a visitor who answered "it works fine" to all five questions fell through
   * the line ordering and was quoted $1,200 for a new build. Nothing about that
   * is visible to grep -- the price table was correct, the wiring was correct,
   * and the page shipped a number the visitor had explicitly declined.
   *
   * So the scoring functions are run here against a stub DOM, and the answers a
   * real visitor can give are checked against what comes out. The stub is the
   * bare minimum estimator.js touches at load time; the scoring itself is pure.
   */
  const outcomes = runEstimatorScenarios(label, check);
  if (outcomes) {
    // Nobody should be quoted for a build they said they do not need.
    check(label, 'an all-clear answer is not quoted for a build',
      outcomes.allClear.line === 'none',
      `got "${outcomes.allClear.line}" at ${JSON.stringify(outcomes.allClear.price)}`);
    // A domain serving someone else's business is the strongest signal there
    // is, and it has to outrank everything else.
    check(label, 'a hijacked domain outranks every other line',
      outcomes.hijacked.line === 'rehab',
      `got "${outcomes.hijacked.line}"`);
    // Owning a working site must never produce a new-build quote.
    check(label, 'never quotes a new build to someone with a site',
      outcomes.hijacked.line !== 'launch' && outcomes.allClear.line !== 'launch',
      'launch and rehab are meant to be mutually exclusive');
    check(label, 'a build with no work quoted is not a build',
      outcomes.needsConversation.line === 'systems' &&
        outcomes.needsConversation.price === null,
      `got "${outcomes.needsConversation.line}" at ${JSON.stringify(outcomes.needsConversation.price)}`);
  }
}

/** Load estimator.js with a stub DOM and score one set of answers per scenario.
 *  Returns null (after a warning) if the module cannot be loaded at all. */
function runEstimatorScenarios(label, check) {
  const est = join(SITES, 'core', 'estimator.js');
  const stub = `
    const noop = () => {};
    const el = () => ({
      classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
      dataset: {}, style: { setProperty: noop },
      setAttribute: noop, appendChild: noop, insertBefore: noop,
      addEventListener: noop, querySelector: () => null, querySelectorAll: () => [],
      focus: noop, animate: noop, hidden: true, innerHTML: '', textContent: '',
    });
    globalThis.document = {
      documentElement: el(), readyState: 'complete',
      querySelectorAll: () => [], querySelector: () => null,
      addEventListener: noop, title: '',
    };
    globalThis.window = globalThis;
    globalThis.location = { origin: 'http://x', pathname: '/' };
    globalThis.FormData = class { get() { return null; } };
    globalThis.matchMedia = () => ({ matches: false, addEventListener: noop });
    globalThis.performance = { now: () => 0 };
    globalThis.requestAnimationFrame = noop;
  `;
  let E;
  try {
    // eslint-disable-next-line no-new-func
    E = new Function(`${stub}\n${readFileSync(est, 'utf8')}\nreturn globalThis.window.__ESTIMATOR__;`)();
  } catch (e) {
    check(label, 'estimator loads headlessly', false, String(e && e.message));
    return null;
  }
  check(label, 'estimator loads headlessly and exposes its scoring', !!E);
  if (!E) return null;

  const weightOf = (o) => Object.values(o.weight || {}).reduce((a, b) => a + b, 0);
  const questions = E.QUESTIONS;

  // "The most benign answer available", derived from the weights rather than
  // written as an index. The first version of this fixture took the last option
  // of each question, which is the benign answer for some of them and the worst
  // possible answer for others -- for "do you have a website?" the last option
  // is "No". An index-based fixture fails silently when a question is reordered
  // and fails loudly-looking-valid when it is not, which is worse.
  const benign = (q) => ({ [q.id]: q.options.reduce((b, o) => (weightOf(o) < weightOf(b) ? o : b)).label });

  // The strongest answer available for one line, again by weight.
  const strongest = (q, line) => {
    const cands = q.options.filter((o) => line in (o.weight || {}));
    if (!cands.length) return benign(q)[q.id];
    return cands.reduce((b, o) => (o.weight[line] > b.weight[line] ? o : b)).label;
  };

  // Questions are looked up by the `line` they carry rather than by position.
  // The first version of this fixture reached for questions[3] and questions[4]
  // directly, and when the estimator dropped from five questions to four it kept
  // passing -- two of the three scenarios had quietly stopped being tested,
  // because the override landed on `undefined` and was discarded.
  const withStrongest = (base, line) => {
    const q = questions.find((x) => x.line === line);
    return q ? Object.assign(base, { [q.id]: strongest(q, line) }) : base;
  };
  const without = (base) => {
    // The one question with no line is the one that decides rebuild-vs-new.
    const q = questions.find((x) => !x.line);
    return q ? Object.assign(base, { [q.id]: strongest(q, 'rehab') }) : base;
  };

  const run = (answers) => {
    const totals = E.score(answers);
    const line = E.primaryLine(totals);
    return { line, price: E.PRICE[line] ?? null, totals };
  };
  const allBenign = () => Object.assign({}, ...questions.map(benign));

  const allClear = run(allBenign());

  // "It is not really mine" plus "it takes people somewhere else entirely" --
  // the strongest possible statement that the domain is not doing its job.
  const hijacked = run(without(withStrongest(allBenign(), 'rehab')));

  // Bookings wanted, on a site that is otherwise fine. There is no price for
  // this and there should not be one.
  const needsConversation = run(withStrongest(allBenign(), 'systems'));

  // Every service line has to be reachable from some question, or the services
  // page is selling something the estimator can never quote.
  for (const line of Object.keys(E.LINES)) {
    if (line === 'none') continue;
    const reachable = questions.some((q) => q.options.some((o) => o.weight && o.weight[line]));
    check(label, `estimator can reach the "${line}" line`, reachable,
      'this service is listed on the page but no answer can select it');
  }

  return { allClear, hijacked, needsConversation };
}

function auditPage(dir) {
  const html = readFileSync(join(dir, 'index.html'), 'utf8');
  const cfgPath = join(dir, 'site.config.js');
  const cfg = existsSync(cfgPath) ? readFileSync(cfgPath, 'utf8') : '';
  const label = relative(SITES, dir);
  const kind = /kind:\s*'studio'/.test(cfg) ? 'studio' : 'mockup';

  console.log(`\n${DIM}${label}${OFF} ${DIM}(${kind})${OFF}`);
  auditCommon(label, html, cfg, dir);
  (kind === 'studio' ? auditStudio : auditMockup)(label, html, cfg);
}

const pages = pageDirs();
if (!pages.length) {
  console.log('no page directories found under sites/');
  process.exit(0);
}
console.log(`checking ${pages.length} page${pages.length === 1 ? '' : 's'}`);
pages.forEach(auditPage);

console.log(
  failures
    ? `\n${RED}${failures} failed${OFF}${warnings ? `, ${warnings} warnings` : ''}`
    : `\n${GRN}clean${OFF}${warnings ? `, ${warnings} warnings` : ''}`
);
process.exit(failures ? 1 : 0);
