import { dev } from '$app/environment';
import { badRequest, forbidden } from '$lib/server/admin';
import {
  SESSION_COOKIE,
  countUsers,
  createSession,
  insertUser,
  sessionCookieOptions
} from '$lib/server/auth';
import { getDatabase } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

/**
 * Creates the first owner account. Only callable while the users table is
 * empty, so ownership of the deployment transfers exactly once.
 */
export const POST: RequestHandler = async ({ request, cookies, platform }) => {
  const db = getDatabase(platform);
  if (!db) return badRequest('The database binding is not configured.');

  const count = await countUsers(db);
  if (count > 0) {
    return forbidden('Setup is complete. Sign in at /admin/login.');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Send JSON with email, name, password.');
  }

  const { email, name, password } = (body ?? {}) as { email?: unknown; name?: unknown; password?: unknown };
  if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    return badRequest('A valid email is required.');
  }
  if (typeof password !== 'string' || password.length < 10) {
    return badRequest('Password must be at least 10 characters.');
  }
  const safeName = typeof name === 'string' && name.trim() ? name.trim() : '';

  const row = await insertUser({ db, email, name: safeName, password, role: 'owner' });

  const session = await createSession({
    db,
    userId: row.id,
    userAgent: request.headers.get('user-agent') ?? ''
  });
  cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(!dev));

  return Response.json(
    {
      user: { id: row.id, email: row.email, name: row.name, role: row.role }
    },
    { status: 201 }
  );
};

/** Reachability probe used by the login page: is first-time setup still open? */
export const GET: RequestHandler = async ({ platform }) => {
  const db = getDatabase(platform);
  if (!db) return Response.json({ enabled: false, missingBinding: true });
  const count = await countUsers(db);
  return Response.json({ enabled: count === 0 });
};
