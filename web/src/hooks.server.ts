import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { DEFAULT_THEME, THEME_COOKIE, resolveTheme, themes } from '$lib/data/themes';
import { resolveTenant } from '$lib/server/prospects';

export const handle: Handle = async ({ event, resolve }) => {
  const tenant = await resolveTenant(event.url, event.platform);
  const theme = resolveTheme(event.cookies.get(THEME_COOKIE), tenant?.theme ?? DEFAULT_THEME);
  const themeColor = themes[theme].tokens.chromeColor;

  const accessEmail = event.request.headers.get('cf-access-authenticated-user-email');
  const allowed = (event.platform?.env?.ADMIN_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const email = accessEmail?.trim().toLowerCase() ?? '';
  const isAllowed = email.length > 0 && (allowed.length === 0 || allowed.includes(email));

  event.locals.adminEmail = isAllowed ? email : dev ? 'dev@localhost' : null;
  event.locals.tenant = tenant;
  event.locals.theme = theme;
  event.locals.themeColor = themeColor;

  const response = await resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replaceAll('%slag.theme%', theme).replaceAll('%slag.themeColor%', themeColor)
  });

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  return response;
};
