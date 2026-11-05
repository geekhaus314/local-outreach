import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getDatabase, recordBooking } from '$lib/server/db';
import { readLeadEmailConfig, sendLeadEmail } from '$lib/server/leadEmail';
import { createRateLimiter } from '$lib/server/rateLimit';
import type { RequestHandler } from './$types';

export const prerender = false;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const QUOTE_TO = 'hello@webrehabstl.com';

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
  const phone = text(input.phone, 40);
  const packageName = text(input.package, 120);
  const message = text(input.message, 2000);
  const source = text(input.source, 80);
  const page = text(input.page, 300);
  const consent = input.consent === true;
  const honeypot = text(input.company, 120);

  if (rateLimited(getClientAddress())) {
    return json(
      { error: 'Too many quote requests from this address. Email hello@webrehabstl.com instead.' },
      { status: 429 }
    );
  }

  if (!name || !email || !packageName) {
    return json(
      { error: 'Please add your name, email, and the package you are interested in.' },
      { status: 400 }
    );
  }

  if (!EMAIL_PATTERN.test(email)) {
    return json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  if (!consent) {
    return json(
      { error: 'Please confirm that we may contact you about this request.' },
      { status: 400 }
    );
  }

  if (honeypot) {
    return json({ message: 'Your quote request is in. I will reply with a scope and a fixed number.' });
  }

  const requestId = crypto.randomUUID();
  const db = getDatabase(platform);
  const notes = [
    `Package: ${packageName}`,
    phone ? `Phone: ${phone}` : '',
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
        businessSlug: 'agency-quote',
        name,
        email,
        phone,
        service: `designs-quote:${packageName}`,
        message: notes,
        consent,
        idempotencyKey: requestId
      });
    } catch (error) {
      console.error('Could not persist quote request', { requestId, error });
      return json({ error: 'We could not record your request. Please try again.' }, { status: 500 });
    }
  }

  const config = readLeadEmailConfig(env as Record<string, string | undefined>);
  const recipient = (env as Record<string, string | undefined>).LEAD_NOTIFY_EMAIL || QUOTE_TO;
  const saved = Boolean(db);

  if (!config) {
    console.error('Resend is not configured for quote requests', { requestId, saved });
    return json(
      {
        saved,
        emailSent: false,
        requestId,
        message: saved
          ? 'Your quote request is saved. Email delivery is being configured, so please also call or text (636) 448-3574 if you need a reply quickly.'
          : 'Email delivery is temporarily unavailable. Please call or text (636) 448-3574 directly.'
      },
      { status: saved ? 202 : 503 }
    );
  }

  const emailLines = [
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : 'Phone: not provided',
    `Package: ${packageName}`
  ];
  if (message) emailLines.push('', `Notes: ${message}`);
  if (source) emailLines.push(`Source: ${source}`);
  if (page) emailLines.push(`Page: ${page}`);
  emailLines.push('', `Request id: ${requestId}`);

  const result = await sendLeadEmail(config, {
    to: recipient,
    subject: `New design quote request — ${packageName}`,
    replyTo: email,
    lines: emailLines
  });

  if (!result.sent) {
    console.error('Resend rejected the quote notification', { requestId, error: result.error });
    return json(
      {
        saved,
        emailSent: false,
        requestId,
        message: saved
          ? 'Your quote request is saved, but the notification email failed. Please call or text (636) 448-3574 directly so nothing is lost.'
          : 'The notification email failed. Please call or text (636) 448-3574 directly.'
      },
      { status: saved ? 202 : 502 }
    );
  }

  return json({
    saved,
    emailSent: true,
    requestId,
    message: 'Quote request received. I will reply with a scope and a fixed number, usually within two business days.'
  });
};
