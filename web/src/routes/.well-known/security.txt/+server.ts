import { error } from '@sveltejs/kit';
import { isAgencyHost } from '$lib/data/agency';
import type { RequestHandler } from './$types';

export const prerender = false;

const EXPIRES = '2027-10-31T00:00:00Z';

export const GET: RequestHandler = ({ locals, url }) => {
  if (locals.tenant || !isAgencyHost(url.hostname)) {
    error(404, 'Not found.');
  }

  const lines = [
    'Contact: mailto:hello@webrehabstl.com',
    `Expires: ${EXPIRES}`,
    'Preferred-Languages: en',
    'Canonical: https://webrehabstl.com/.well-known/security.txt'
  ];

  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400'
    }
  });
};
