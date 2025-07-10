'use server';

/**
 * @fileOverview Generates AI-driven subject lines for emails to improve open rates.
 *
 * - generateSubjectLine - A function that generates subject lines using AI.
 * - GenerateSubjectLineInput - The input type for the generateSubjectLine function.
 * - GenerateSubjectLineOutput - The return type for the generateSubjectLine function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSubjectLineInputSchema = z.object({
  emailBody: z
    .string()
    .describe('The body of the email for which a subject line is needed.'),
  tone: z
    .string()
    .optional()
    .describe(
      'The desired tone of the subject line, e.g., professional, casual, urgent.'
    ),
  keywords: z
    .string()
    .optional()
    .describe('Comma-separated keywords to include in the subject line.'),
});

type GenerateSubjectLineInput = z.infer<typeof GenerateSubjectLineInputSchema>;

const GenerateSubjectLineOutputSchema = z.object({
  subjectLine: z.string().describe('The generated subject line.'),
});

type GenerateSubjectLineOutput = z.infer<typeof GenerateSubjectLineOutputSchema>;

export async function generateSubjectLine(
  input: GenerateSubjectLineInput
): Promise<GenerateSubjectLineOutput> {
  return generateSubjectLineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSubjectLinePrompt',
  input: {schema: GenerateSubjectLineInputSchema},
  output: {schema: GenerateSubjectLineOutputSchema},
  prompt: `You are an AI expert in writing compelling subject lines for emails.

  Given the email body, desired tone, and keywords, generate a subject line that will maximize open rates.

  Email Body: {{{emailBody}}}
  Tone: {{tone}}
  Keywords: {{keywords}}

  Subject Line:`,
});

const generateSubjectLineFlow = ai.defineFlow(
  {
    name: 'generateSubjectLineFlow',
    inputSchema: GenerateSubjectLineInputSchema,
    outputSchema: GenerateSubjectLineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
