import { badRequest, guardAdmin, notFound } from '$lib/server/admin';
import { getBusiness, getPitch, updatePitch } from '$lib/server/db';
import { aiChat, resolveAiConfig } from '$lib/server/ai';
import type { RequestHandler } from './$types';

export const prerender = false;

export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
  const guard = guardAdmin(locals, platform);
  if ('response' in guard) return guard.response;

  const pitch = await getPitch(guard.db, params.id);
  if (!pitch) return notFound('That pitch does not exist.');

  const business = await getBusiness(guard.db, pitch.business_id);
  if (!business) return notFound('That prospect does not exist.');

  const env = platform?.env ?? {};
  const config = resolveAiConfig(env);

  let body: { instruction?: string };
  try {
    body = (await request.json()) as { instruction?: string };
  } catch {
    return badRequest('Please send the request as JSON.');
  }

  const userInstruction = typeof body.instruction === 'string' && body.instruction.trim()
    ? body.instruction.trim()
    : 'Rewrite this cold outreach pitch to be sharper and more confident. Keep every factual claim exactly as written—do not invent prices, testimonials, or services. Keep the same channel tone (email or SMS). Keep the no-pressure close and reply-to-unsubscribe line if present. Return only the rewritten pitch body, no preamble.';

  const systemPrompt = `You are a copy editor for local-business outreach. You rewrite cold email and SMS pitches. Rules: (1) Never invent facts, prices, testimonials, or services—only use claims present in the source pitch or prospect record. (2) Preserve the channel: email pitches stay professional with a subject line implied by context; SMS pitches stay short and conversational. (3) Keep the no-pressure, opt-out-friendly close. (4) Output only the rewritten pitch body, no preamble, no quotes, no meta-commentary.`;

  const prospectContext = `
Prospect: ${business.name}
Industry: ${business.industry}
Website: ${business.website || 'none listed'}
Classification: ${business.classification}
Audit: ${business.audit_summary || 'not audited'}
Pitch facts: ${business.pitch_facts || 'none stored'}

Existing pitch body:
${pitch.body}`;

  try {
    const polished = await aiChat(config, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${userInstruction}\n\n${prospectContext}` }
    ], 0.4);

    await updatePitch(guard.db, params.id, { body: polished });
    const updated = await getPitch(guard.db, params.id);
    return Response.json({ pitch: updated, provider: config.provider });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 502 });
    }
    throw error;
  }
};
