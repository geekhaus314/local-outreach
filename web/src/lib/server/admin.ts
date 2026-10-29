import { json } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import type { Role, SessionUser } from '$lib/server/auth';

// RBAC model:
//   viewer — read-only access to pipeline data
//   admin  — full pipeline CRUD (leads, audits, pitches, mockups, bookings, comms)
//   owner  — everything admin can do, plus user management and lifecycle of users
const WRITE_ROLES: Role[] = ['owner', 'admin'];
const OWNER_ROLES: Role[] = ['owner'];

export function isAdmin(user: SessionUser | null): boolean {
  return user !== null;
}

export function canWrite(user: SessionUser | null): boolean {
  return user !== null && WRITE_ROLES.includes(user.role);
}

export function isOwner(user: SessionUser | null): boolean {
  return user !== null && OWNER_ROLES.includes(user.role);
}

export function unauthorized(): Response {
  return json({ error: 'Sign in at /admin/login to continue.' }, { status: 401 });
}

export function forbidden(message = 'Your role does not allow this action.'): Response {
  return json({ error: message }, { status: 403 });
}

export function dbUnavailable(): Response {
  return json({ error: 'The database binding is not configured.' }, { status: 503 });
}

export function badRequest(message: string): Response {
  return json({ error: message }, { status: 400 });
}

export function notFound(message = 'Not found.'): Response {
  return json({ error: message }, { status: 404 });
}

/**
 * requireAuth: resolves the DB binding and asserts the caller has a session.
 * Every /api/admin/** route starts with one of the require* guards.
 */
export function requireAuth(
  user: SessionUser | null,
  platform: App.Platform | undefined
): { db: D1Database; user: SessionUser } | { response: Response } {
  if (!isAdmin(user)) return { response: unauthorized() };
  if (!user) return { response: unauthorized() };
  const db = platform?.env?.DB ?? null;
  if (!db) return { response: dbUnavailable() };
  return { db, user };
}

/**
 * requireAdmin: session plus a write-capable role. Mutation endpoints use this.
 */
export function requireAdmin(
  user: SessionUser | null,
  platform: App.Platform | undefined
): { db: D1Database; user: SessionUser } | { response: Response } {
  const auth = requireAuth(user, platform);
  if ('response' in auth) return auth;
  if (!canWrite(auth.user)) return { response: forbidden('Viewers cannot modify pipeline data.') };
  return auth;
}

/** requireOwner: session plus the owner role. User management only. */
export function requireOwner(
  user: SessionUser | null,
  platform: App.Platform | undefined
): { db: D1Database; user: SessionUser } | { response: Response } {
  const auth = requireAuth(user, platform);
  if ('response' in auth) return auth;
  if (!isOwner(auth.user)) return { response: forbidden('Only the owner can manage users.') };
  return auth;
}

/**
 * Legacy guard kept for the remaining pipeline endpoints: same contract as
 * requireAdmin (write-capable roles), resolved from Locals.
 */
export function guardAdmin(
  locals: App.Locals,
  platform: App.Platform | undefined
): { db: D1Database; user: SessionUser } | { response: Response } {
  return requireAdmin(locals.user, platform);
}

export { notFound as notFoundJson, dbUnavailable as dbUnavailableJson };
