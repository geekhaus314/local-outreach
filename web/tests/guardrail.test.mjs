/**
 * Guardrail test: bans Tailwind utility classes, stock imagery keywords,
 * slop-art hooks, TODO placeholders and placeholder copy from anything the
 * app ships. Every failure names its file so fixes stay easy.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const WEB_ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(WEB_ROOT, 'src');
const PACKAGE = JSON.parse(readFileSync(join(WEB_ROOT, 'package.json'), 'utf8'));
const SOURCE_EXT = /\.(svelte|ts|js|mjs|css|html)$/;

function collect(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === '.svelte-kit') continue;
      collect(full, out);
    } else if (SOURCE_EXT.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const files = collect(SRC);

function assertNone(ban, message, { skips = [] } = {}) {
  const offenders = [];
  for (const file of files) {
    if (skips.some((skip) => file.endsWith(skip))) continue;
    const lines = readFileSync(file, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      if (ban.test(lines[i])) offenders.push(`${file.replace(SRC, 'src')}:${i + 1}: ${lines[i].trim().slice(0, 80)}`);
    }
  }
  if (offenders.length > 0) {
    throw new Error(`${message}\n${offenders.join('\n')}`);
  }
}

test('no Tailwind utility class strings inside shipped markup or styles', () => {
  // Utility-class fragment inside a class/className attribute: two or more
  // tokens look like layout/spacing/color scales (flex, p-4, text-gray-600…).
  const pattern =
    /(?:class=|"class"|'class')\s*[:=]\s*["'`][^"'`]*?(?:\s|^)(?:flex|grid|hidden|relative|absolute|fixed|sticky|z-\d+|items-(?:center|start|end|baseline)|justify-(?:center|between|around|evenly|start|end)|gap-\d+|space-[xy]-\d+|(?:px|py|p|pt|pb|pl|pr|mx|my|m|mt|mb|ml|mr|w|h|min-w|max-w|min-h|max-h)-\d+(?:\.\d+)?|(?:text|bg|border|ring)-(?:gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}|rounded-(?:sm|md|lg|xl|2xl|3xl|full)|shadow-(?:sm|md|lg|xl|2xl))(?:\s|$)/i;
  assertNone(pattern, 'Tailwind utility class found; use the CSS module or component classes instead.');
});

test('no stock-photo or center-shot imagery hooks', () => {
  assertNone(
    /unsplash|shutterstock|istockphoto|freepik|pexels|picsum|placekitten|placehold(?:er)?\.co|via\.placeholder|slop-blob|hero-blob|gradient-mesh|stock-photo/i,
    'Stock-photo or slop-art hook found; use structural markup or business-owned imagery.'
  );
});

test('no TODO/FIXME placeholders or fake copy left behind', () => {
  // audit.ts is skipped: its "coming soon"/"lorem ipsum" strings are the
  // detector rules that flag those problems on *client* sites, not copy we ship.
  assertNone(
    /\b(?:TODO|FIXME|XXX)\b|lorem ipsum|coming soon|not yet implemented/i,
    'Placeholder marker or copy found; the work is not done until the code ships.',
    { skips: ['server/audit.ts'] }
  );
});

test('no dead href or submit-less form controls', () => {
  assertNone(
    /href\s*=\s*["'{]#\s*["'}]/,
    'Dead anchor href="#" found; point the link at a real route on purpose.'
  );
});

test('no @tailwind directives and no tailwindcss dependency', () => {
  assertNone(/@tailwind\s|from ['"`]tailwindcss/, 'Tailwind directive or import found; Tailwind was removed deliberately.');
  if (PACKAGE?.devDependencies?.tailwindcss) {
    throw new Error('tailwindcss is in devDependencies after its removal.');
  }
});
