import { error } from '@sveltejs/kit';
import { isAgencyHost } from '$lib/data/agency';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
  if (locals.tenant) {
    return { mode: 'tenant' as const, tenant: locals.tenant };
  }

  if (!isAgencyHost(url.hostname)) {
    error(404, 'No prospect mockup is configured for this host.');
  }

  return { mode: 'agency' as const };
};
