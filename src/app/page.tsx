
"use client";

import { useState } from 'react';
import type { ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';
import { processInvoice } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InvoiceUploader } from '@/components/invoice-uploader';
import { InvoiceTable } from '@/components/invoice-table';
import { ExtractedFilesCard, type ExtractedFile } from '@/components/extracted-files-card';
import { Logo } from '@/components/icons';
import { XCircle } from 'lucide-react';

type InvoiceEntry = Extract<ExtractInvoiceDataOutput, any[]>[number];

export default function Home() {
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([]);
  const [results, setResults] = useState<InvoiceEntry[]>([]);
  const { toast } = useToast();

  const handleFilesExtract = (files: ExtractedFile[]) => {
    setExtractedFiles(prevFiles => [...prevFiles, ...files]);
  };
  
  const handleProcessFile = async (file: ExtractedFile) => {
    // Set status of this specific file to processing
    setExtractedFiles(prevFiles => prevFiles.map(f => 
      f.id === file.id ? { ...f, status: 'processing' } : f
    ));
    
    const response = await processInvoice(file.dataUri);

    if (response.success) {
      setResults(prevResults => [...prevResults, ...response.data]);
      setExtractedFiles(prevFiles => prevFiles.map(f => 
        f.id === file.id ? { ...f, status: 'completed' } : f
      ));
      toast({
        title: "Extraction Complete",
        description: `Successfully extracted data from ${file.name}.`,
      });
    } else {
      setExtractedFiles(prevFiles => prevFiles.map(f => 
        f.id === file.id ? { ...f, status: 'error' } : f
      ));
      toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: response.error,
      });
    }
  };

  const handleClearAll = () => {
    setResults([]);
    setExtractedFiles([]);
  }

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
          {(extractedFiles.length > 0 || results.length > 0) && (
             <Button variant="ghost" size="sm" onClick={handleClearAll}>
                <XCircle className="h-4 w-4 mr-2" />
                Clear All
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Upload Invoices</CardTitle>
                <CardDescription>
                  Drop a Word, PDF, or ZIP file below. Our AI will automatically extract the details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvoiceUploader onFilesExtract={handleFilesExtract} />
              </CardContent>
            </Card>

            {extractedFiles.length > 0 && (
              <ExtractedFilesCard 
                files={extractedFiles} 
                onProcessFile={handleProcessFile} 
                onClear={() => setExtractedFiles([])}
              />
            )}
          </div>
          
          <div className="lg:col-span-1">
            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Extracted Data</CardTitle>
                    <CardDescription>
                      Review the extracted invoice details below.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <InvoiceTable data={results} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t py-6 mt-8">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Invoice Insights. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
