import { browser } from '$app/environment';
import { getContext, setContext } from 'svelte';
import {
  DEFAULT_THEME,
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE,
  THEME_STORAGE_KEY,
  resolveTheme,
  themes,
  type ThemeDefinition,
  type ThemeName
} from '$lib/data/themes';

const THEME_CONTEXT = Symbol('slag-theme');

export class ThemeState {
  theme = $state<ThemeName>(DEFAULT_THEME);

  constructor(initial: ThemeName = DEFAULT_THEME) {
    this.theme = resolveTheme(initial, DEFAULT_THEME);
  }

  get definition(): ThemeDefinition {
    return themes[this.theme];
  }

  set(theme: ThemeName): void {
    this.theme = resolveTheme(theme, DEFAULT_THEME);
    this.persist(this.theme);
  }

  cycle(): void {
    const names = Object.keys(themes) as ThemeName[];
    const index = names.indexOf(this.theme);
    this.set(names[(index + 1) % names.length]);
  }

  private persist(theme: ThemeName): void {
    if (!browser) return;

    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = 'light';

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage can be blocked by privacy settings; the cookie remains the fallback.
    }

    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${THEME_COOKIE}=${theme}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;

    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = themes[theme].tokens.chromeColor;
  }
}

export function setThemeContext(initial: ThemeName): ThemeState {
  const state = new ThemeState(initial);
  setContext(THEME_CONTEXT, state);
  return state;
}

export function getTheme(): ThemeState {
  const state = getContext<ThemeState | undefined>(THEME_CONTEXT);
  if (!state) {
    throw new Error('Theme context is unavailable. Render the component inside the root layout.');
  }
  return state;
}
