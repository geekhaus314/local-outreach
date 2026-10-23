import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_THEME,
  isThemeName,
  resolveTheme,
  themeList,
  themes
} from '../src/lib/data/themes.ts';

const THEME_NAMES = themeList.map((t) => t.name);

test('every declared theme has a complete definition', () => {
  assert.equal(themeList.length, THEME_NAMES.length);
  for (const name of THEME_NAMES) {
    const theme = themes[name];
    assert.equal(theme.name, name);
    assert.ok(theme.label.length > 0);
    assert.ok(theme.tokens.background.startsWith('#'));
    assert.ok(theme.tokens.text.startsWith('#'));
    assert.ok(theme.tokens.fontBody.length > 0);
  }
});

test('isThemeName accepts only registered themes', () => {
  for (const name of THEME_NAMES) assert.equal(isThemeName(name), true);
  assert.equal(isThemeName('myhairloss'), false);
  assert.equal(isThemeName(null), false);
  assert.equal(isThemeName(undefined), false);
});

test('resolveTheme falls back for unknown values', () => {
  assert.equal(resolveTheme('salon-wellness'), 'salon-wellness');
  assert.equal(resolveTheme('not-a-theme'), DEFAULT_THEME);
  assert.equal(resolveTheme(null, 'general-honest'), 'general-honest');
});
