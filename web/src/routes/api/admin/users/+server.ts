import { badRequest, notFound, requireOwner } from '$lib/server/admin';
import { findUserByEmail, insertUser } from '$lib/server/auth';
import { listUsers, userRoleIsValid } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ locals, platform }) => {
  const guard = requireOwner(locals.user, platform);
  if ('response' in guard) return guard.response;

  const users = await listUsers(guard.db);
  return Response.json({ users });
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const guard = requireOwner(locals.user, platform);
  if ('response' in guard) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Send JSON with email, name, password and role.');
  }

  const input = (body ?? {}) as {
    email?: unknown;
    name?: unknown;
    password?: unknown;
    role?: unknown;
  };

  if (typeof input.email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email.trim())) {
    return badRequest('A valid email is required.');
  }
  if (typeof input.password !== 'string' || input.password.length < 10) {
    return badRequest('Password must be at least 10 characters.');
  }
  if (typeof input.role !== 'string' || !userRoleIsValid(input.role)) {
    return badRequest('role must be one of: owner, admin, viewer.');
  }

  const email = input.email.trim().toLowerCase();
  const existing = await findUserByEmail(guard.db, email);
  if (existing) {
    return Response.json({ error: `A user with email ${email} already exists.` }, { status: 409 });
  }

  const row = await insertUser({
    db: guard.db,
    email,
    name: typeof input.name === 'string' ? input.name.trim() : '',
    password: input.password,
    role: input.role
  });

  if (!row) return notFound('User vanished after create.');
  return Response.json(
    {
      user: { id: row.id, email: row.email, name: row.name, role: row.role, disabled: row.disabled }
    },
    { status: 201 }
  );
};
