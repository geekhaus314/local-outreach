import type { VerticalThemeId } from './vertical-themes.ts';
import { listVerticalThemes, verticalThemeFor, verticalThemeForKind } from './vertical-themes.ts';

export type ThemeName = VerticalThemeId;

export const DEFAULT_THEME: ThemeName = 'general-honest';
export const THEME_STORAGE_KEY = 'slag.theme';
export const THEME_COOKIE = 'slag-theme';
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface ThemeTokens {
  name: ThemeName;
  label: string;
  description: string;
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceStrong: string;
  surfaceInverted: string;
  text: string;
  textMuted: string;
  textInverted: string;
  brand: string;
  brandContrast: string;
  accent: string;
  accentContrast: string;
  border: string;
  borderStrong: string;
  focus: string;
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
  radius: string;
  radiusSm: string;
  radiusLg: string;
  shadow: string;
  shadowStrong: string;
  chromeColor: string;
  accent2: string;
  accent3: string;
}

export interface ThemeDefinition {
  name: ThemeName;
  label: string;
  description: string;
  tokens: ThemeTokens;
}

export const themes: Record<ThemeName, ThemeDefinition> = (() => {
  const record: Record<string, ThemeDefinition> = {};
  for (const theme of listVerticalThemes()) {
    record[theme.name] = {
      name: theme.name,
      label: theme.label,
      description: theme.description,
      tokens: theme
    };
  }
  return record as Record<ThemeName, ThemeDefinition>;
})();

export const themeList: ThemeDefinition[] = Object.values(themes);

export function isThemeName(value: string | null | undefined): value is ThemeName {
  return typeof value === 'string' && (Object.keys(themes) as readonly string[]).includes(value);
}

export function resolveTheme(value: string | null | undefined, fallback: ThemeName = DEFAULT_THEME): ThemeName {
  return isThemeName(value) ? value : fallback;
}

export { verticalThemeFor, verticalThemeForKind } from './vertical-themes.ts';
