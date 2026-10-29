import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { DEFAULT_THEME, THEME_COOKIE, resolveTheme, themes } from '$lib/data/themes';
import { resolveTenant } from '$lib/server/prospects';
import { SESSION_COOKIE, resolveSession } from '$lib/server/auth';

const INSECURE_BINDING = 'DB is not bound. Run: npm run db:migrate:local';

export const handle: Handle = async ({ event, resolve }) => {
  const tenant = await resolveTenant(event.url, event.platform);
  const cookieTheme = resolveTheme(event.cookies.get(THEME_COOKIE));
  const theme = tenant?.theme ?? cookieTheme;
  const themeColor = themes[theme].tokens.chromeColor;

  // DB-backed session auth. The portal is unusable without a bound D1 instance,
  // so keep a hard signal when the binding is missing instead of faking a user.
  const db = event.platform?.env?.DB ?? null;
  let user: App.Locals['user'] = null;
  if (db) {
    const token = event.cookies.get(SESSION_COOKIE) ?? undefined;
    user = await resolveSession(db, token);
    event.locals.sessionCookieToken = token ?? null;
  } else if (!event.url.pathname.startsWith('/api/')) {
    console.warn(INSECURE_BINDING);
  }

  event.locals.user = user;
  event.locals.tenant = tenant;
  event.locals.theme = theme;
  event.locals.themeColor = themeColor;

  const response = await resolve(event, {
    transformPageChunk: ({ html }) =>
      html
        .replaceAll('%slag.theme%', theme)
        .replaceAll('%slag.themeColor%', themeColor)
  });

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  void dev;
  return response;
};
