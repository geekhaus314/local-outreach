import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isAgencyHost } from '$lib/data/agency';

export const load: PageServerLoad = ({ locals, url }) => {
  if (locals.tenant) {
    return {
      isAgency: false as const,
      tenant: locals.tenant
    };
  }

  if (!isAgencyHost(url.hostname)) {
    error(404, 'No prospect mockup is configured for this host.');
  }

  return {
    isAgency: true as const,
    tenant: null
  };
};
