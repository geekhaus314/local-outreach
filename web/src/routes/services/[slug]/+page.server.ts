import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, params }) => {
  if (!locals.tenant) {
    error(404, 'No prospect mockup is configured for this host.');
  }

  const treatment = locals.tenant.offerings.find((item) => item.id === params.slug);
  if (!treatment) {
    error(404, 'That service page is not part of this mockup.');
  }

  return {
    tenant: locals.tenant,
    treatment
  };
};
