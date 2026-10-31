import { badRequest, notFound, requireOwner } from '$lib/server/admin';
import {
  countEnabledOwners,
  deleteUser,
  getUser,
  updateUser,
  userRoleIsValid
} from '$lib/server/db';
import { hashPassword } from '$lib/server/auth';
import type { RequestHandler } from './$types';
import type { UserRole } from '$lib/server/db';

export const prerender = false;

export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
  const guard = requireOwner(locals.user, platform);
  if ('response' in guard) return guard.response;

  const existing = await getUser(guard.db, params.id);
  if (!existing) return notFound('That user does not exist.');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Send JSON with the fields to update.');
  }

  const input = (body ?? {}) as {
    role?: unknown;
    name?: unknown;
    disabled?: unknown;
    password?: unknown;
  };

  if (input.role !== undefined) {
    if (typeof input.role !== 'string' || !userRoleIsValid(input.role)) {
      return badRequest('role must be one of: owner, admin, viewer.');
    }
    const demotingSelf = guard.user.id === existing.id && guard.user.role === 'owner' && input.role !== 'owner';
    if (demotingSelf && (await countEnabledOwners(guard.db, existing.id)) === 0) {
      return badRequest('Transfer ownership first: there is no other enabled owner.');
    }
  }

  if (input.disabled !== undefined) {
    if (typeof input.disabled !== 'boolean') return badRequest('disabled must be a boolean.');
    const lockingSelf = guard.user.id === existing.id && input.disabled;
    if (lockingSelf) {
      return badRequest('Disable your own account from a different owner session.');
    }
    if (input.disabled && existing.role === 'owner' && (await countEnabledOwners(guard.db, existing.id)) === 0) {
      return badRequest('Transfer ownership first: there is no other enabled owner.');
    }
  }

  if (input.password !== undefined) {
    if (typeof input.password !== 'string' || input.password.length < 10) {
      return badRequest('Password must be at least 10 characters.');
    }
  }
  if (input.name !== undefined && typeof input.name !== 'string') {
    return badRequest('name must be a string.');
  }

  await updateUser(guard.db, existing.id, {
    role: input.role as UserRole | undefined,
    name: input.name as string | undefined,
    disabled: input.disabled as boolean | undefined,
    passwordHash:
      typeof input.password === 'string' ? await hashPassword(input.password) : undefined
  });

  const updated = await getUser(guard.db, existing.id);
  if (!updated) return notFound('User vanished after update.');
  return Response.json({
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      disabled: updated.disabled,
      lastSeenAt: updated.last_seen_at
    }
  });
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const guard = requireOwner(locals.user, platform);
  if ('response' in guard) return guard.response;

  const existing = await getUser(guard.db, params.id);
  if (!existing) return notFound('That user does not exist.');

  if (guard.user.id === existing.id) {
    return badRequest('Delete your own account from a different owner session.');
  }
  if (existing.role === 'owner' && existing.disabled === 0 && (await countEnabledOwners(guard.db, existing.id)) === 0) {
    return badRequest('Transfer ownership first: there is no other enabled owner.');
  }

  await deleteUser(guard.db, existing.id);
  return Response.json({ ok: true, deleted: existing.id });
};
