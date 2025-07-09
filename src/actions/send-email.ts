'use server';

import { Resend } from 'resend';
import { z } from 'zod';

const sendEmailSchema = z.object({
  to: z.array(z.string().email()),
  from: z.string(),
  subject: z.string(),
  html: z.string(),
});

type SendEmailInput = z.infer<typeof sendEmailSchema>;

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendCampaignEmail(input: SendEmailInput) {
  if (!process.env.RESEND_API_KEY) {
      return { error: 'Resend API key is not configured.' };
  }

  const parsedInput = sendEmailSchema.safeParse(input);

  if (!parsedInput.success) {
    console.error('Invalid input for sendCampaignEmail:', parsedInput.error);
    return { error: 'Invalid input provided to email sender.' };
  }

  const { to, from, subject, html } = parsedInput.data;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend API error:', error);
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error('Failed to send email:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `An unexpected error occurred: ${errorMessage}` };
  }
}
