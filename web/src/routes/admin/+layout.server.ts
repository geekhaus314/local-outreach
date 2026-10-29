import { redirect } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform, url }) => {
  if (!locals.user && url.pathname !== '/admin/login') {
    redirect(307, '/admin/login');
  }

  const db = getDatabase(platform);
  return {
    user: locals.user,
    configured: db !== null,
    currentPath: url.pathname
  };
};
