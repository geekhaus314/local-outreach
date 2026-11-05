import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isAgencyHost } from '$lib/data/agency';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = ({ locals, url, platform }) => {
  if (!locals.tenant) {
    if (isAgencyHost(url.hostname)) {
      const privateEnv = env as Record<string, string | undefined>;
      return json(
        {
          status: 'ok',
          service: 'webrehabstl',
          db: Boolean(platform?.env?.DB),
          emailConfigured: Boolean(privateEnv.RESEND_API_KEY && privateEnv.BOOKING_FROM_EMAIL),
          checkedAt: new Date().toISOString()
        },
        {
          headers: {
            'Cache-Control': 'no-store'
          }
        }
      );
    }

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
