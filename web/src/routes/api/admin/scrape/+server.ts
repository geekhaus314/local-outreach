import { badRequest, guardAdmin } from '$lib/server/admin';
import type { RequestHandler } from './$types';
import { execFile } from 'node:child_process';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..');
const SCRAPER = join(ROOT, 'run_scraper.py');

export const POST: RequestHandler = async ({ locals, platform, request }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  let body: { market?: string; trade?: string; noAudit?: boolean; maxQueries?: number } = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // no body is fine
  }

  const args: string[] = [];
  if (body.market) args.push('--market', body.market);
  if (body.trade) args.push('--trade', body.trade);
  if (body.noAudit) args.push('--no-audit');
  if (body.maxQueries) args.push('--max-queries', String(body.maxQueries));
  args.push('--dry-run'); // never write by default from the UI; user confirms separately

  return new Promise((resolve) => {
    execFile('python3', [SCRAPER, ...args], { cwd: ROOT, timeout: 300000 }, (error, stdout, stderr) => {
      const output = `${stdout}\n${stderr}`.trim();
      if (error) {
        resolve(
          Response.json(
            { ok: false, error: error.message, output },
            { status: 500 }
          )
        );
        return;
      }
      resolve(Response.json({ ok: true, output }));
    });
  });
};
