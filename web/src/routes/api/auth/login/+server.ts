import { dev } from '$app/environment';
import { badRequest } from '$lib/server/admin';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSession,
  findUserByEmail,
  loginResultFor,
  sessionCookieOptions,
  verifyPassword
} from '$lib/server/auth';
import { getDatabase } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
  const db = getDatabase(platform);
  if (!db) return badRequest('The database binding is not configured.');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Send JSON with email and password.');
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };
  if (typeof email !== 'string' || email.trim().length === 0) {
    return badRequest('Email is required.');
  }
  if (typeof password !== 'string' || password.length === 0) {
    return badRequest('Password is required.');
  }

  const row = await findUserByEmail(db, email);
  const passwordOk = row ? await verifyPassword(password, row.password_hash) : false;
  // Always do the argument work so timing does not reveal whether the email exists.
  if (!row || !passwordOk) {
    return Response.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  }

  const user = loginResultFor(row, passwordOk);
  if (!user) {
    return Response.json({ error: 'This account is disabled.' }, { status: 403 });
  }

  const session = await createSession({
    db,
    userId: user.id,
    userAgent: request.headers.get('user-agent') ?? ''
  });

  cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(!dev));

  return Response.json({ user });
};
