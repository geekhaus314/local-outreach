import { error } from '@sveltejs/kit';
import { getDatabase, listUsers } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (!locals.user) error(404, 'Not found');
  if (locals.user.role !== 'owner') {
    return { users: [], configured: true, role: locals.user.role };
  }

  const db = getDatabase(platform);
  if (!db) return { users: [], configured: false, role: locals.user.role };

  const users = await listUsers(db);
  return { users, configured: true, role: locals.user.role };
};
