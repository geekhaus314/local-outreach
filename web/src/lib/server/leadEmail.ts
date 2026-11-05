import { Resend } from 'resend';

export interface LeadEmailConfig {
  apiKey: string;
  fromEmail: string;
}

export function readLeadEmailConfig(
  env: Record<string, string | undefined>
): LeadEmailConfig | null {
  const apiKey = env.RESEND_API_KEY;
  const fromEmail = env.BOOKING_FROM_EMAIL;
  if (!apiKey || !fromEmail) return null;
  return { apiKey, fromEmail };
}

export interface LeadEmailMessage {
  to: string;
  subject: string;
  lines: string[];
  replyTo?: string;
}

export type LeadEmailResult = { sent: true } | { sent: false; error: string };

export async function sendLeadEmail(
  config: LeadEmailConfig,
  message: LeadEmailMessage
): Promise<LeadEmailResult> {
  try {
    const resend = new Resend(config.apiKey);
    const { error } = await resend.emails.send({
      from: config.fromEmail,
      to: message.to,
      subject: message.subject,
      text: message.lines.join('\n'),
      ...(message.replyTo ? { replyTo: message.replyTo } : {})
    });

    if (error) {
      return { sent: false, error: error.message };
    }
    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : 'Unknown email failure'
    };
  }
}
