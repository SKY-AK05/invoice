
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Loader2, CheckCircle2, XCircle, AlertCircle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExtractedFile {
  id: string;
  name: string;
  dataUri: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
}

interface ExtractedFilesCardProps {
  files: ExtractedFile[];
  onProcessFile: (file: ExtractedFile) => void;
  onClear: () => void;
}

const statusText = {
    idle: "Ready to process",
    processing: "Processing...",
    completed: "Done",
    error: "Failed",
}


export function ExtractedFilesCard({ files, onProcessFile, onClear }: ExtractedFilesCardProps) {

  const getStatusIcon = (file: ExtractedFile) => {
    switch (file.status) {
        case 'idle':
            return <Play className="h-5 w-5 text-primary" />;
        case 'processing':
            return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
        case 'completed':
            return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        case 'error':
             return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
            <CardTitle>Extracted Files</CardTitle>
            <CardDescription>
                Process individual files from your upload.
            </CardDescription>
        </div>
         <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear extracted files">
            <XCircle className="h-5 w-5 text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72 w-full pr-4">
          <div className="space-y-3">
            {files.map((file) => (
              <div 
                key={file.id} 
                className={cn(
                  "flex items-center p-2 rounded-md border transition-colors",
                  file.status === 'idle' && "cursor-pointer hover:bg-accent hover:border-primary"
                )}
                onClick={() => file.status === 'idle' && onProcessFile(file)}
                role={file.status === 'idle' ? 'button' : undefined}
                tabIndex={file.status === 'idle' ? 0 : -1}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && file.status === 'idle') {
                    e.preventDefault();
                    onProcessFile(file);
                  }
                }}
              >
                <FileText className="h-6 w-6 mr-3 text-muted-foreground" />
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{statusText[file.status]}</p>
                </div>
                <div className="flex items-center justify-center w-10 h-10">
                  {getStatusIcon(file)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
