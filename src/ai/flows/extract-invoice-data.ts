'use server';

/**
 * @fileOverview A flow to extract invoice data from a document.
 *
 * - extractInvoiceData - A function that handles the invoice data extraction process.
 * - ExtractInvoiceDataInput - The input type for the extractInvoiceData function.
 * - ExtractInvoiceDataOutput - The return type for the extractInvoiceData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractInvoiceDataInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The invoice document (Word or PDF) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  excelColumns: z
    .string()
    .describe(
      'The names of the excel columns that will be used to summarize or extract content with. e.g. Client Name, Invoice No, Invoice Date, Amount (excl. GST)'
    )
});
export type ExtractInvoiceDataInput = z.infer<typeof ExtractInvoiceDataInputSchema>;

const ExtractInvoiceDataOutputSchema = z.object({
  clientName: z.string().describe('The name of the client.'),
  clientId: z.string().optional().describe('The ID of the client, if available.'),
  invoiceNo: z.string().describe('The invoice number.'),
  invoiceDate: z.string().describe('The invoice date.'),
  purpose: z.string().describe('The purpose of the invoice.'),
  amountExclGST: z.number().describe('The amount excluding GST.'),
  gstPercentage: z.number().optional().describe('The GST percentage used, if applicable.'),
  totalInclGST: z.number().describe('The total amount including GST.'),
  status: z.string().describe('The status of the invoice (e.g., paid, unpaid).'),
  link: z.string().optional().describe('A link to the invoice document, if available.'),
});
export type ExtractInvoiceDataOutput = z.infer<typeof ExtractInvoiceDataOutputSchema>;

export async function extractInvoiceData(input: ExtractInvoiceDataInput): Promise<ExtractInvoiceDataOutput> {
  return extractInvoiceDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractInvoiceDataPrompt',
  input: {schema: ExtractInvoiceDataInputSchema},
  output: {schema: ExtractInvoiceDataOutputSchema},
  prompt: `You are an expert data extractor specializing in invoices. Extract the following information from the invoice document provided. The excel columns you will be extracting include the following names: {{{excelColumns}}}.\n\nInvoice Document: {{media url=documentDataUri}}\n\nEnsure that all fields are populated accurately. If a field is not available, indicate with 'N/A'.  Ensure that amountExclGST and totalInclGST are returned as floating point numbers, not strings.  Do not return the same value for amountExclGST and totalInclGST.  The excel columns correspond to the following data points:\n- Client Name: The name of the client.\n- Client ID: The ID of the client, if available.\n- Invoice No: The invoice number.\n- Invoice Date: The invoice date.\n- Purpose: The purpose of the invoice.\n- Amount (excl. GST): The amount excluding GST.\n- GST % Used: The GST percentage used, if applicable.\n- Total incl. GST: The total amount including GST.\n- Status: The status of the invoice (e.g., paid, unpaid).\n- Link: A link to the invoice document, if available.`,
});

const extractInvoiceDataFlow = ai.defineFlow(
  {
    name: 'extractInvoiceDataFlow',
    inputSchema: ExtractInvoiceDataInputSchema,
    outputSchema: ExtractInvoiceDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
