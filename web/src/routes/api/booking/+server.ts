import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getDatabase, recordBooking } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const prerender = false;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  if (!locals.tenant) {
    return json({ error: 'No prospect mockup is configured for this host.' }, { status: 404 });
  }

  const booking = locals.tenant.booking;

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
  const name = text(input.name, 120);
  const email = text(input.email, 200);
  const phone = text(input.phone, 40);
  const treatment = text(input.treatment, 80);
  const message = text(input.message, 2000);
  const page = text(input.page, 200);
  const consent = input.consent === true;

  if (!name || !email || !treatment) {
    return json({ error: 'Please add your name, email, and the service you are interested in.' }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const treatmentField = booking.fields.find((field) => field.name === 'treatment');
  const allowedTreatments = new Set((treatmentField?.options ?? []).map((option) => option.value));
  if (!allowedTreatments.has(treatment)) {
    return json({ error: 'Please choose a service from the list.' }, { status: 400 });
  }

  if (!consent) {
    return json({ error: 'Please confirm that we may contact you about this request.' }, { status: 400 });
  }

  const requestId = crypto.randomUUID();
  const db = getDatabase(platform);

  if (db) {
    try {
      await recordBooking(db, {
        id: requestId,
        businessId: null,
        businessSlug: locals.tenant.id,
        name,
        email,
        phone,
        service: treatment,
        message,
        consent,
        idempotencyKey: requestId
      });
    } catch (error) {
      console.error('Could not persist booking request', { requestId, error });
      return json({ error: 'We could not record your request. Please try again.' }, { status: 500 });
    }
  }

  const privateEnv = env as Record<string, string | undefined>;
  const webhookUrl = privateEnv[booking.notification.webhookEnv];
  const apiKey = privateEnv[booking.notification.apiKeyEnv];

  if (!webhookUrl || !apiKey) {
    console.error('Booking webhook is not configured', {
      webhookEnv: booking.notification.webhookEnv,
      apiKeyEnv: booking.notification.apiKeyEnv
    });
    return json({ error: booking.unavailableMessage }, { status: 503 });
  }

  const submittedAt = new Date().toISOString();

  const payload = {
    source: 'clinic-engine',
    tenant: locals.tenant.id,
    requestId,
    submittedAt,
    subject: `${booking.notification.subjectPrefix} — ${name}`,
    from: privateEnv[booking.notification.fromEmailEnv] ?? undefined,
    replyTo: email,
    page: page || undefined,
    lead: {
      name,
      email,
      phone: phone || null,
      treatment,
      message: message || null,
      consent,
      consentAt: submittedAt
    }
  };

  try {
    const upstream = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Idempotency-Key': requestId
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000)
    });

    if (!upstream.ok) {
      console.error('Booking webhook rejected the request', {
        status: upstream.status,
        requestId
      });
      return json({ error: booking.errorMessage }, { status: 502 });
    }
  } catch (error) {
    console.error('Booking webhook request failed', { requestId, error });
    return json({ error: booking.errorMessage }, { status: 502 });
  }

  return json({ ok: true, message: booking.successMessage }, { status: 201 });
};
