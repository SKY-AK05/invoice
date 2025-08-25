'use server';

/**
 * @fileOverview A Genkit flow to automatically determine the correct excel columns for LLM summarization and extraction.
 *
 * - determineExcelColumns - A function that handles the determination of relevant excel columns.
 * - DetermineExcelColumnsInput - The input type for the determineExcelColumns function.
 * - DetermineExcelColumnsOutput - The return type for the determineExcelColumns function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetermineExcelColumnsInputSchema = z.object({
  columnHeaders: z.array(z.string()).describe('An array of excel column headers.'),
  documentType: z.string().describe('The type of document being processed, e.g., invoice.'),
});
export type DetermineExcelColumnsInput = z.infer<typeof DetermineExcelColumnsInputSchema>;

const DetermineExcelColumnsOutputSchema = z.object({
  relevantColumns: z
    .array(z.string())
    .describe('An array of column headers that are most relevant for summarization and extraction.'),
});
export type DetermineExcelColumnsOutput = z.infer<typeof DetermineExcelColumnsOutputSchema>;

export async function determineExcelColumns(input: DetermineExcelColumnsInput): Promise<DetermineExcelColumnsOutput> {
  return determineExcelColumnsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'determineExcelColumnsPrompt',
  input: {schema: DetermineExcelColumnsInputSchema},
  output: {schema: DetermineExcelColumnsOutputSchema},
  prompt: `You are an AI assistant that determines which columns from an excel sheet are most relevant for summarizing the document.

You will be given a list of column headers, and the document type.
Based on this information, return a list of the most relevant column headers that would be useful for summarizing the document.

Document Type: {{{documentType}}}
Column Headers: {{#each columnHeaders}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Relevant Columns:`, // The Handlebars template has been corrected.
});

const determineExcelColumnsFlow = ai.defineFlow(
  {
    name: 'determineExcelColumnsFlow',
    inputSchema: DetermineExcelColumnsInputSchema,
    outputSchema: DetermineExcelColumnsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
