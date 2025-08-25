
"use client";

import { useState, useCallback, type DragEvent } from 'react';
import JSZip from 'jszip';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { UploadCloud, Loader2 } from 'lucide-react';
import { DrivePicker } from './drive-picker';
import { Separator } from './ui/separator';
import type { ExtractedFile } from './extracted-files-card';

interface InvoiceUploaderProps {
  onFilesExtract: (files: ExtractedFile[]) => void;
}

const acceptedFileTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
];

const fileExtensionsToMimeType: Record<string, string> = {
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

export function InvoiceUploader({ onFilesExtract }: InvoiceUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("Click to upload or drag and drop");
  const { toast } = useToast();

  const getMimeTypeFromFileName = (filename: string): string | undefined => {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? fileExtensionsToMimeType[extension] : undefined;
  }

  const handleFile = useCallback(async (file: File) => {
    if (!acceptedFileTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload a PDF, Word, or ZIP document.",
      });
      return;
    }

    setIsProcessing(true);
    setStatusText(`Processing ${file.name}...`);
    
    if (file.type === 'application/zip') {
      try {
        const zip = await JSZip.loadAsync(file);
        const extractedFiles: ExtractedFile[] = [];
        const filePromises = Object.keys(zip.files).map(async (filename) => {
          const zipEntry = zip.files[filename];
          if (!zipEntry.dir) {
            const mimeType = getMimeTypeFromFileName(filename);
            if (!mimeType) return; // Skip files with unsupported extensions

            const blob = await zipEntry.async('blob');
            
            // Recreate blob with correct MIME type
            const typedBlob = new Blob([blob], { type: mimeType });

            const dataUri = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.onerror = (err) => reject(err);
              reader.readAsDataURL(typedBlob);
            });
            extractedFiles.push({
              id: self.crypto.randomUUID(),
              name: filename,
              dataUri: dataUri,
              status: 'idle',
            });
          }
        });
        await Promise.all(filePromises);
        onFilesExtract(extractedFiles);
        toast({
          title: "ZIP Extracted",
          description: `Extracted ${extractedFiles.length} files. Ready for processing.`,
        });
      } catch (error) {
        toast({
            variant: "destructive",
            title: "ZIP Read Error",
            description: "Could not read the ZIP file. It may be corrupt.",
        });
      }
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUri = e.target?.result as string;
          onFilesExtract([{ id: self.crypto.randomUUID(), name: file.name, dataUri, status: 'idle' }]);
        };
        reader.onerror = () => {
          toast({
              variant: "destructive",
              title: "File Read Error",
              description: "Could not read the selected file.",
          });
        };
        reader.readAsDataURL(file);
    }
    
    setIsProcessing(false);
    setStatusText("Click to upload or drag and drop");

  }, [onFilesExtract, toast]);

  const handleDriveFileSelect = async (dataUri: string, driveFileName: string) => {
    setIsProcessing(true);
    setStatusText(`Processing ${driveFileName}...`);
    onFilesExtract([{ id: self.crypto.randomUUID(), name: driveFileName, dataUri, status: 'idle' }]);
    setIsProcessing(false);
    setStatusText("Click to upload or drag and drop");
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragging(true);
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
    if (isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div className="w-full space-y-4">
      <label
        htmlFor="file-upload"
        className={cn(
          "relative block w-full rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors duration-200 ease-in-out",
          !isProcessing && "cursor-pointer hover:border-primary",
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
              {statusText}
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, Word or ZIP document
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

      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <DrivePicker onFileSelect={handleDriveFileSelect} isProcessing={isProcessing} />
    </div>
  );
}
