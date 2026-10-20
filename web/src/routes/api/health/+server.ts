import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = ({ locals }) => {
  if (!locals.tenant) {
    return json({ status: 'no-tenant', service: 'clinic-engine' }, { status: 404 });
  }

  return json(
    {
      status: 'ok',
      service: 'clinic-engine',
      tenant: locals.tenant.id,
      theme: locals.theme,
      preview: locals.tenant.isPreview,
      checkedAt: new Date().toISOString()
    },
    {
      headers: {
        'Cache-Control': 'no-store'
      }
    }
  );
};
