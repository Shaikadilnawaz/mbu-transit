import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Only enable the Google AI plugin when an API key is configured. Without this
// guard, googleAI() throws FAILED_PRECONDITION at import time and crashes any
// page that touches this module, even though the app doesn't need AI to run.
const hasApiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

export const ai = genkit({
  plugins: hasApiKey ? [googleAI()] : [],
  model: 'googleai/gemini-2.5-flash',
});
