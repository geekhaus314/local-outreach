import { error } from '@sveltejs/kit';
import { isAgencyHost } from '$lib/data/agency';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
  if (locals.tenant) {
    error(404, 'The agency service index is only published on the agency site.');
  }
  if (!isAgencyHost(url.hostname)) {
    error(404, 'No page is configured for this host.');
  }
  return {};
};
