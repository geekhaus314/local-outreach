import { json } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';

export function isAdmin(locals: App.Locals): boolean {
  return typeof locals.adminEmail === 'string' && locals.adminEmail.length > 0;
}

export function unauthorized(): Response {
  return json({ error: 'Not authorized.' }, { status: 403 });
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

export function guardAdmin(
  locals: App.Locals,
  platform: App.Platform | undefined
): { db: D1Database } | { response: Response } {
  if (!isAdmin(locals)) return { response: unauthorized() };
  const db = platform?.env?.DB ?? null;
  if (!db) return { response: dbUnavailable() };
  return { db };
}
