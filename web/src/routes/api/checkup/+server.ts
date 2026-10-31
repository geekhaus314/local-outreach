import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { Resend } from 'resend';
import { getDatabase, recordBooking } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHECKUP_WEBSITE_MAX = 200;
const CHECKUP_MESSAGE_MAX = 2000;

const CHECKUP_TO = 'hello@webrehabstl.com';

export const POST: RequestHandler = async ({ request, platform }) => {
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
  const consent = input.consent === true;

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

  const requestId = crypto.randomUUID();
  const db = getDatabase(platform);

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
        message: `Website: ${website}${message ? `\n\nNotes: ${message}` : ''}`,
        consent,
        idempotencyKey: requestId
      });
    } catch (error) {
      console.error('Could not persist checkup request', { requestId, error });
      return json({ error: 'We could not record your request. Please try again.' }, { status: 500 });
    }
  }

  const privateEnv = env as Record<string, string | undefined>;
  const apiKey = privateEnv.RESEND_API_KEY;
  const fromEmail = privateEnv.BOOKING_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.error('Resend is not configured for checkup requests', {
      hasApiKey: Boolean(apiKey),
      hasFromEmail: Boolean(fromEmail)
    });
    return json(
      {
        error:
          'Your request was received, but email delivery is temporarily unavailable. Please email hello@webrehabstl.com directly.'
      },
      { status: 503 }
    );
  }

  const subject = `New site checkup request — ${website}`;
  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Website: ${website}`,
    '',
    message ? `Notes: ${message}` : 'No notes provided.',
    '',
    `Request id: ${requestId}`
  ];

  try {
    const resend = new Resend(apiKey);
    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: CHECKUP_TO,
      subject,
      text: lines.join('\n')
    });

    if (sendError) {
      console.error('Resend rejected the checkup notification', { message: sendError.message });
      return json(
        {
          error:
            'Your request was recorded, but the email to us failed. Please email hello@webrehabstl.com directly so nothing is lost.'
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Resend request failed', { requestId, error });
    return json(
      {
        error:
          'Your request was recorded, but the email to us failed. Please email hello@webrehabstl.com directly so nothing is lost.'
      },
      { status: 502 }
    );
  }

  return json({
    message:
      'Checkup request received. We will email the report to your address — usually within two business days.'
  });
};
