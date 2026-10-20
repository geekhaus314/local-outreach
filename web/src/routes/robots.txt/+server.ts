import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = ({ locals }) => {
  if (!locals.tenant) {
    error(404, 'No prospect mockup is configured for this host.');
  }

  const lines = locals.tenant.isPreview
    ? ['User-agent: *', 'Disallow: /']
    : ['User-agent: *', 'Allow: /', '', `Sitemap: ${locals.tenant.siteUrl}/sitemap.xml`];

  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
