import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { isAgencyHost } from '$lib/data/agency';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.tenant) {
    return { isAgency: false };
  }
  if (!isAgencyHost(url.hostname)) {
    throw redirect(302, '/admin');
  }
  return { isAgency: true };
};
