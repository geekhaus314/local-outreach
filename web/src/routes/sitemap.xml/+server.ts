import { error } from '@sveltejs/kit';
import { isAgencyHost } from '$lib/data/agency';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = ({ locals, url }) => {
  if (!locals.tenant) {
    if (!isAgencyHost(url.hostname)) {
      error(404, 'No prospect mockup is configured for this host.');
    }
    const agencyPaths = ['', '/privacy'];
    const agencyUrls = agencyPaths.map(
      (path) => `  <url><loc>${escapeXml(`https://webrehabstl.com${path}`)}</loc></url>`
    );
    return xmlResponse(agencyUrls);
  }

  const tenant = locals.tenant;
  const paths = ['', '/privacy', ...tenant.offerings.map((treatment) => `/services/${treatment.id}`)];
  const urls = tenant.seo.noindex
    ? []
    : paths.map((path) => `  <url><loc>${escapeXml(`${tenant.siteUrl}${path}`)}</loc></url>`);

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>'
  ].join('\n');

  return xmlResponse(xml);
};

function xmlResponse(body: string | string[]): Response {
  const xml = Array.isArray(body)
    ? [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...body,
        '</urlset>'
      ].join('\n')
    : body;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
