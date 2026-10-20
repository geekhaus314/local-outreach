import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
  if (!locals.tenant) {
    error(404, 'No prospect mockup is configured for this host.');
  }

  return {
    tenant: locals.tenant
  };
};
