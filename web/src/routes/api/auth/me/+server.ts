import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ locals }) => {
  return Response.json({ user: locals.user });
};
