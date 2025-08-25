
"use client";

import { useState, useCallback, type DragEvent } from 'react';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { UploadCloud, File as FileIcon, Loader2 } from 'lucide-react';

interface InvoiceUploaderProps {
  onFileUpload: (fileDataUri: string) => void;
  isProcessing: boolean;
}

const acceptedFileTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function InvoiceUploader({ onFileUpload, isProcessing }: InvoiceUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFile = useCallback((file: File) => {
    if (!acceptedFileTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload a PDF or Word document.",
      });
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      onFileUpload(dataUri);
    };
    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "File Read Error",
        description: "Could not read the selected file.",
      });
       setFileName(null);
    };
    reader.readAsDataURL(file);
  }, [onFileUpload, toast]);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        className={cn(
          "relative block w-full rounded-lg border-2 border-dashed border-border p-8 text-center cursor-pointer transition-colors duration-200 ease-in-out hover:border-primary",
          isDragging && "border-primary bg-accent"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-primary">
            {isProcessing ? (
              <Loader2 className="h-12 w-12 animate-spin" />
            ) : (
              <UploadCloud className="h-12 w-12" />
            )}
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              {isProcessing ? "Processing your invoice..." : "Click to upload or drag and drop"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isProcessing ? fileName : "PDF or Word document"}
            </p>
          </div>
        </div>
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          className="sr-only"
          accept={acceptedFileTypes.join(',')}
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          disabled={isProcessing}
        />
      </label>
    </div>
  );
}
