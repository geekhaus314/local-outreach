import { dev } from '$app/environment';

const AGENCY_HOSTNAMES = new Set(['webrehabstl.com', 'www.webrehabstl.com']);

export const AGENCY_HOST_LIST: string[] = ['webrehabstl.com', 'www.webrehabstl.com'];

export function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/\.+$/, '');
}

/**
 * The agency landing lives on the owned marketing host. Every other host in
 * the app is either a tenant preview or the admin console; those keep their
 * existing behavior. In dev (localhost) the landing is also served so it can
 * be developed and smoke-tested without touching DNS.
 */
export function isAgencyHost(hostname: string): boolean {
  const normalized = normalizeHost(hostname);
  if (AGENCY_HOSTNAMES.has(normalized)) return true;
  return dev && (normalized === 'localhost' || normalized === '127.0.0.1');
}
