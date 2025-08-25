
"use server";

import { extractInvoiceData, type ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';

const EXCEL_COLUMNS = "SL No., Client Name, Client ID, Invoice No., Invoice Date, Period, Purpose, Amount (excl. GST), GST % Used, Total incl. GST, Status, Link";

export async function processInvoice(documentDataUri: string, fileName: string): Promise<{ success: true; data: ExtractInvoiceDataOutput } | { success: false; error: string }> {
  if (!documentDataUri || !documentDataUri.startsWith('data:')) {
    return { success: false, error: 'Invalid document data URI provided.' };
  }

  try {
    const result = await extractInvoiceData({
      documentDataUri: documentDataUri,
      excelColumns: EXCEL_COLUMNS,
      fileName: fileName,
    });
    return { success: true, data: result };
  } catch (e) {
    console.error("AI processing error:", e);
    const error = e instanceof Error ? e.message : 'An unknown error occurred during AI processing.';
    return { success: false, error: `Failed to extract invoice data. ${error}` };
  }
}
