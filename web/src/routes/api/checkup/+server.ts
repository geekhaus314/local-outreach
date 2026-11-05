import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getDatabase, recordBooking } from '$lib/server/db';
import { readLeadEmailConfig, sendLeadEmail } from '$lib/server/leadEmail';
import { createRateLimiter } from '$lib/server/rateLimit';
import type { RequestHandler } from './$types';

export const prerender = false;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHECKUP_WEBSITE_MAX = 200;
const CHECKUP_MESSAGE_MAX = 2000;
const CHECKUP_TO = 'hello@webrehabstl.com';

const rateLimited = createRateLimiter({ windowMs: 60 * 60 * 1000, limit: 5 });

export const POST: RequestHandler = async ({ request, platform, getClientAddress }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Please send the request as JSON.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return json({ error: 'Please complete the form.' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const text = (value: unknown, maxLength: number): string =>
    typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

  const name = text(input.name, 120);
  const email = text(input.email, 200);
  const website = text(input.website, CHECKUP_WEBSITE_MAX);
  const message = text(input.message, CHECKUP_MESSAGE_MAX);
  const source = text(input.source, 80);
  const page = text(input.page, 300);
  const consent = input.consent === true;
  const honeypot = text(input.company, 120);

  if (rateLimited(getClientAddress())) {
    return json(
      { error: 'Too many checkup requests from this address. Email hello@webrehabstl.com instead.' },
      { status: 429 }
    );
  }

  if (!name || !email || !website) {
    return json(
      { error: 'Please add your name, email, and the website address to check.' },
      { status: 400 }
    );
  }

  if (!EMAIL_PATTERN.test(email)) {
    return json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  if (!consent) {
    return json(
      { error: 'Please confirm that we may email the checkup report to you.' },
      { status: 400 }
    );
  }

  if (honeypot) {
    return json({ message: 'Your checkup request is in. We will email the report when it is ready.' });
  }

  const requestId = crypto.randomUUID();
  const db = getDatabase(platform);
  const notes = [
    website ? `Website: ${website}` : '',
    message ? `Notes: ${message}` : '',
    source ? `Source: ${source}` : '',
    page ? `Page: ${page}` : ''
  ]
    .filter(Boolean)
    .join('\n');

  if (db) {
    try {
      await recordBooking(db, {
        id: requestId,
        businessId: null,
        businessSlug: 'site-checkup',
        name,
        email,
        phone: '',
        service: 'free-website-checkup',
        message: notes,
        consent,
        idempotencyKey: requestId
      });
    } catch (error) {
      console.error('Could not persist checkup request', { requestId, error });
      return json({ error: 'We could not record your request. Please try again.' }, { status: 500 });
    }
  }

  const config = readLeadEmailConfig(env as Record<string, string | undefined>);
  const recipient =
    (env as Record<string, string | undefined>).LEAD_NOTIFY_EMAIL || CHECKUP_TO;
  const saved = Boolean(db);

  if (!config) {
    console.error('Resend is not configured for checkup requests', { requestId, saved });
    return json(
      {
        saved,
        emailSent: false,
        requestId,
        message: saved
          ? 'Your request is saved. Email delivery is being configured, so please also call or text (636) 448-3574 if you need a reply quickly.'
          : 'Email delivery is temporarily unavailable. Please call or text (636) 448-3574 directly.'
      },
      { status: saved ? 202 : 503 }
    );
  }

  const emailLines = [`Name: ${name}`, `Email: ${email}`, `Website: ${website}`];
  if (message) emailLines.push('', `Notes: ${message}`);
  if (source) emailLines.push(`Source: ${source}`);
  if (page) emailLines.push(`Page: ${page}`);
  emailLines.push('', `Request id: ${requestId}`);

  const result = await sendLeadEmail(config, {
    to: recipient,
    subject: `New site checkup request — ${website}`,
    replyTo: email,
    lines: emailLines
  });

  if (!result.sent) {
    console.error('Resend rejected the checkup notification', { requestId, error: result.error });
    return json(
      {
        saved,
        emailSent: false,
        requestId,
        message: saved
          ? 'Your request is saved, but the notification email failed. Please call or text (636) 448-3574 directly so nothing is lost.'
          : 'The notification email failed. Please call or text (636) 448-3574 directly.'
      },
      { status: saved ? 202 : 502 }
    );
  }

  return json({
    saved,
    emailSent: true,
    requestId,
    message:
      'Checkup request received. We will email the report to your address — usually within two business days.'
  });
};
