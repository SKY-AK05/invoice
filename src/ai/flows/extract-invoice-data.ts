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
      "The invoice document (Word or PDF) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  excelColumns: z
    .string()
    .describe(
      'The names of the excel columns that will be used to summarize or extract content with. e.g. Client Name, Invoice No, Invoice Date, Amount (excl. GST)'
    )
});
export type ExtractInvoiceDataInput = z.infer<typeof ExtractInvoiceDataInputSchema>;

const InvoiceEntrySchema = z.object({
  clientName: z.string().describe('The name of the company/client.'),
  clientId: z.string().optional().describe('Unique ID that links to the Clients sheet.'),
  invoiceNo: z.string().describe('The invoice or credit note number.'),
  invoiceDate: z.string().describe('Date of the invoice.'),
  purpose: z.string().describe('Reason (e.g., Gratuity, Leave).'),
  amountExclGST: z.number().describe('Net invoice value before tax.'),
  gstPercentage: z.number().optional().describe('GST percentage applied (default 18%).'),
  totalInclGST: z.number().describe('Auto-calculated invoice value with tax.'),
  status: z.string().describe('Payment status (e.g., Paid, Unpaid, Partially Paid).'),
  link: z.string().optional().describe('Direct link to the invoice file (e.g., Google Drive link).'),
});

const ExtractInvoiceDataOutputSchema = z.array(InvoiceEntrySchema);
export type ExtractInvoiceDataOutput = z.infer<typeof ExtractInvoiceDataOutputSchema>;

export async function extractInvoiceData(input: ExtractInvoiceDataInput): Promise<ExtractInvoiceDataOutput> {
  return extractInvoiceDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractInvoiceDataPrompt',
  input: {schema: ExtractInvoiceDataInputSchema},
  output: {schema: ExtractInvoiceDataOutputSchema},
  prompt: `You are an expert data extractor specializing in invoices. Extract the following information from the invoice document provided. The excel columns you will be extracting include the following names: {{{excelColumns}}}.

If the invoice document contains multiple distinct invoice entries, extract each one as a separate item in the response array.

Invoice Document: {{media url=documentDataUri}}

Ensure that all fields are populated accurately. The data you extract should correspond to these columns:
- Client Name: Name of the company/client.
- Client ID: Unique ID that links to the Clients sheet (if available).
- Invoice No: The invoice or credit note number.
- Invoice Date: Date of the invoice.
- Purpose: Reason for the invoice (e.g., Gratuity, Leave).
- Amount (excl. GST): Net invoice value before tax. Return a floating point number.
- GST % Used: GST percentage applied (e.g., 18 for 18%). The default is 18% if not specified.
- Total incl. GST: Auto-calculated invoice value with tax. Return a floating point number.
- Status: Payment status (e.g., Paid, Unpaid, Partially Paid). Default to Unpaid if not specified.
- Link: Direct link to the invoice file. If not present, this can be omitted.

If a field is not available, indicate with 'N/A' for strings or handle numbers appropriately. Ensure that amountExclGST and totalInclGST are returned as floating point numbers.`,
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
