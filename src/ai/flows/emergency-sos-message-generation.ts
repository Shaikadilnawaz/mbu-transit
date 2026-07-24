'use server';

/**
 * @fileOverview Generates an emergency SOS message with user and location data.
 *
 * - generateSosMessage - A function that generates the SOS message.
 * - SosMessageInput - The input type for the generateSosMessage function.
 * - SosMessageOutput - The return type for the generateSosMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SosMessageInputSchema = z.object({
  userName: z.string().describe('The name of the user.'),
  location: z.string().describe('The current location of the user.'),
  reason: z.string().describe('The reason for the SOS request.'),
});
export type SosMessageInput = z.infer<typeof SosMessageInputSchema>;

const SosMessageOutputSchema = z.object({
  message: z.string().describe('The generated SOS message.'),
});
export type SosMessageOutput = z.infer<typeof SosMessageOutputSchema>;

export async function generateSosMessage(input: SosMessageInput): Promise<SosMessageOutput> {
  return generateSosMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sosMessagePrompt',
  input: {schema: SosMessageInputSchema},
  output: {schema: SosMessageOutputSchema},
  prompt: `Emergency SOS! User: {{{userName}}}, Location: {{{location}}}, Reason: {{{reason}}}. Please send help immediately! This message was automatically generated from MCONNECTS app.`,
});

const generateSosMessageFlow = ai.defineFlow(
  {
    name: 'generateSosMessageFlow',
    inputSchema: SosMessageInputSchema,
    outputSchema: SosMessageOutputSchema,
  },
  async input => {
    // In a real application, this flow would trigger alerts,
    // notifications to emergency services, etc.
    // For now, we just generate a message.
    console.log(`SOS Triggered: ${JSON.stringify(input)}`);
    const {output} = await prompt(input);
    return output!;
  }
);
