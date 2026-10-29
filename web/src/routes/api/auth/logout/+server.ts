import { dev } from '$app/environment';
import { badRequest } from '$lib/server/admin';
import { SESSION_COOKIE, sessionCookieOptions, revokeSession } from '$lib/server/auth';
import { getDatabase } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const POST: RequestHandler = async ({ cookies, platform }) => {
  const db = getDatabase(platform);
  if (!db) return badRequest('The database binding is not configured.');

  const token = cookies.get(SESSION_COOKIE);
  if (token) {
    await revokeSession(db, token);
  }
  cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(!dev), maxAge: 0 });
  return Response.json({ ok: true });
};
