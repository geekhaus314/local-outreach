import { countUsers } from '$lib/server/auth';
import { getDatabase } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  const db = getDatabase(platform);
  let needsSetup = false;
  if (db) {
    try {
      needsSetup = (await countUsers(db)) === 0;
    } catch {
      needsSetup = true;
    }
  }
  return {
    user: locals.user,
    configured: db !== null,
    needsSetup
  };
};
