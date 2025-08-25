
"use client";

import { useState, useEffect, useRef } from 'react';
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
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Use a ref to ensure the processing function has the latest state
  const filesRef = useRef(extractedFiles);
  filesRef.current = extractedFiles;

  const handleFilesExtract = (files: ExtractedFile[]) => {
    setExtractedFiles(prevFiles => [...prevFiles, ...files]);
  };
  
  const processFile = async (file: ExtractedFile) => {
    // Set status of this specific file to processing
    setExtractedFiles(prevFiles => prevFiles.map(f => 
      f.id === file.id ? { ...f, status: 'processing' } : f
    ));
    
    const response = await processInvoice(file.dataUri, file.name);

    if (response.success && response.data.length > 0) {
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
        description: response.success === false ? response.error : `No invoice data found in ${file.name}.`,
      });
    }
  };
  
  // Effect to automatically process files
  useEffect(() => {
    const processQueue = async () => {
      // Find the first file that is ready to be processed
      const fileToProcess = filesRef.current.find(f => f.status === 'idle');
      
      if (fileToProcess) {
        setIsProcessingQueue(true);
        await processFile(fileToProcess);
        // After processing, recursively call the queue to process the next file
        processQueue(); 
      } else {
        setIsProcessingQueue(false);
      }
    };
    
    // Only start the queue if it's not already running and there are idle files
    if (!isProcessingQueue && extractedFiles.some(f => f.status === 'idle')) {
      processQueue();
    }
  }, [extractedFiles, isProcessingQueue]);


  const handleClearAll = () => {
    setResults([]);
    setExtractedFiles([]);
  }

  const handleManualProcess = (file: ExtractedFile) => {
     if (file.status === 'idle' || file.status === 'error') {
       // Reset status to idle to allow re-processing
       setExtractedFiles(prev => prev.map(f => f.id === file.id ? {...f, status: 'idle'} : f));
     }
  }
  
  const hasContent = extractedFiles.length > 0 || results.length > 0;

  return (
    <div className="min-h-screen w-full font-body flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Logo className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Invoice Insights
            </h1>
          </div>
          {hasContent && (
             <Button variant="ghost" size="sm" onClick={handleClearAll}>
                <XCircle className="h-4 w-4 mr-2" />
                Clear All
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto py-8 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 items-start">
          
          <div className="col-span-1 md:col-span-1 lg:col-span-2 space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Upload Invoices</CardTitle>
                <CardDescription>
                  Drop a Word, PDF, or ZIP file. Our AI will extract the details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvoiceUploader onFilesExtract={handleFilesExtract} />
              </CardContent>
            </Card>

            {extractedFiles.length > 0 && (
              <ExtractedFilesCard 
                files={extractedFiles} 
                onProcessFile={handleManualProcess} 
                onClear={() => setExtractedFiles([])}
              />
            )}
          </div>
          
          <div className="col-span-1 md:col-span-1 lg:col-span-3">
            {results.length > 0 ? (
              <Card className="shadow-lg">
                <CardHeader>
                  <div>
                    <CardTitle>Extracted Data</CardTitle>
                    <CardDescription>
                      Review the extracted invoice details below.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <InvoiceTable data={results} sourceFiles={extractedFiles.filter(f => f.status === 'completed')} />
                </CardContent>
              </Card>
            ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
                    <div className="mb-4">
                        <svg className="w-16 h-16 text-muted-foreground mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">No data yet</h3>
                    <p className="text-muted-foreground mt-2">Upload an invoice to see the extracted data here.</p>
                </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t py-6 mt-auto bg-card">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Invoice Insights. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
