import { error } from '@sveltejs/kit';
import { isAgencyHost } from '$lib/data/agency';
import { findAgencyService } from '$lib/data/agency-content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, params, url }) => {
  if (locals.tenant) {
    const treatment = locals.tenant.offerings.find((item) => item.id === params.slug);
    if (!treatment) {
      error(404, 'That service page is not part of this mockup.');
    }
    return { mode: 'tenant' as const, tenant: locals.tenant, treatment };
  }

  if (!isAgencyHost(url.hostname)) {
    error(404, 'No prospect mockup is configured for this host.');
  }

  const service = findAgencyService(params.slug);
  if (!service) {
    error(404, 'That service page does not exist.');
  }

  return { mode: 'agency' as const, service };
};
