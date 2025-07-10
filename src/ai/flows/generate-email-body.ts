'use server';

/**
 * @fileOverview Generates AI-driven email body content.
 *
 * - generateEmailBody - A function that generates an email body using AI.
 * - GenerateEmailBodyInput - The input type for the generateEmailBody function.
 * - GenerateEmailBodyOutput - The return type for the generateEmailBody function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEmailBodyInputSchema = z.object({
  topic: z
    .string()
    .describe('A description of the email a user wants to send. This can include the purpose, product details, target audience, and any key points to include.'),
  tone: z
    .string()
    .describe(
      'The desired tone of the email, e.g., professional, casual, urgent, playful.'
    ),
});

type GenerateEmailBodyInput = z.infer<typeof GenerateEmailBodyInputSchema>;

const GenerateEmailBodyOutputSchema = z.object({
  htmlContent: z.string().describe('The generated email body as a complete HTML string with inline styles.'),
});

type GenerateEmailBodyOutput = z.infer<typeof GenerateEmailBodyOutputSchema>;

export async function generateEmailBody(
  input: GenerateEmailBodyInput
): Promise<GenerateEmailBodyOutput> {
  return generateEmailBodyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEmailBodyPrompt',
  input: {schema: GenerateEmailBodyInputSchema},
  output: {schema: GenerateEmailBodyOutputSchema},
  prompt: `You are an expert email marketing copywriter and designer. Your task is to generate a complete, production-ready HTML email based on the user's topic and desired tone.

  **Instructions:**
  1.  **HTML Structure:** Generate a single responsive HTML structure. Use a main container div with a max-width of 600px and centered.
  2.  **Inline Styles:** YOU MUST USE INLINE STYLES FOR ALL STYLING. Do not use <style> blocks. This is critical for email client compatibility. Use common, safe fonts like Arial, Helvetica, sans-serif.
  3.  **Content:** Based on the user's topic and tone, write compelling content that includes:
      - A strong, engaging headline (h1).
      - A few paragraphs of body text (p).
      - A clear call-to-action (CTA).
  4.  **Call-to-Action:** The CTA must be a styled '<a>' tag that looks like a button. Use inline styles for background-color, color, padding, text-decoration, border-radius, etc.
  5.  **Images:** If the topic suggests an image would be appropriate (e.g., product announcement, welcome email), include a placeholder image using 'https://placehold.co/600x300.png'. Add a 'data-ai-hint' attribute to the '<img>' tag with one or two keywords describing the image (e.g., data-ai-hint="product launch").
  6.  **Personalization:** Do not use personalization tags like [FirstName]. The user will add these later.
  7.  **Do Not Include:** Do not include an unsubscribe footer. The application will add this automatically. Do not include <!DOCTYPE>, <html>, <head>, or <body> tags. Only generate the content that would go inside the <body>.

  **User Request:**
  - **Topic/Purpose:** {{{topic}}}
  - **Tone:** {{{tone}}}
  `,
});

const generateEmailBodyFlow = ai.defineFlow(
  {
    name: 'generateEmailBodyFlow',
    inputSchema: GenerateEmailBodyInputSchema,
    outputSchema: GenerateEmailBodyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return { htmlContent: output!.htmlContent };
  }
);
