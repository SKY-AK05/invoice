
"use client";

import { useState } from 'react';
import type { ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';
import { processInvoice } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InvoiceUploader } from '@/components/invoice-uploader';
import { InvoiceTable } from '@/components/invoice-table';
import { Logo } from '@/components/icons';

type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';

export default function Home() {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [results, setResults] = useState<ExtractInvoiceDataOutput[]>([]);
  const { toast } = useToast();

  const handleFileUpload = async (fileDataUri: string) => {
    setStatus('processing');
    const response = await processInvoice(fileDataUri);

    if (response.success) {
      setResults(prevResults => [...prevResults, response.data]);
      setStatus('completed');
      toast({
        title: "Extraction Complete",
        description: "Invoice data has been successfully extracted.",
      });
    } else {
      setStatus('error');
      toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: response.error,
      });
      // Reset to idle after an error to allow retries
      setTimeout(() => setStatus('idle'), 500); 
    }
  };
  
  const isProcessing = status === 'processing';

  return (
    <div className="min-h-screen w-full font-body">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Logo className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Invoice Insights
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Upload Your Invoice</CardTitle>
              <CardDescription>
                Drop a Word or PDF file below. Our AI will automatically extract the details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceUploader onFileUpload={handleFileUpload} isProcessing={isProcessing} />
            </CardContent>
          </Card>
          
          {(status === 'completed' || results.length > 0) && (
             <Card>
              <CardHeader>
                <CardTitle>Extracted Data</CardTitle>
                <CardDescription>
                  Review the extracted invoice details below and export to CSV.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvoiceTable data={results} />
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Invoice Insights. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
