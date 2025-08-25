
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Loader2, CheckCircle2, XCircle, AlertCircle, Play, RefreshCw } from 'lucide-react';
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
    idle: "In queue...",
    processing: "Processing...",
    completed: "Done",
    error: "Failed",
}


export function ExtractedFilesCard({ files, onProcessFile, onClear }: ExtractedFilesCardProps) {

  const getStatusIcon = (file: ExtractedFile) => {
    switch (file.status) {
        case 'idle':
            return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
        case 'processing':
            return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
        case 'completed':
            return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        case 'error':
             return <RefreshCw className="h-5 w-5 text-destructive" />;
    }
  }

  const isClickable = (file: ExtractedFile) => file.status === 'error';
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
            <CardTitle>Extracted Files</CardTitle>
            <CardDescription>
                Files are processed automatically. Click a failed item to retry.
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
                  isClickable(file) && "cursor-pointer hover:bg-accent hover:border-primary",
                  file.status === 'completed' && "bg-green-50 border-green-200",
                  file.status === 'error' && "bg-red-50 border-red-200"
                )}
                onClick={() => isClickable(file) && onProcessFile(file)}
                role={isClickable(file) ? 'button' : undefined}
                tabIndex={isClickable(file) ? 0 : -1}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && isClickable(file)) {
                    e.preventDefault();
                    onProcessFile(file);
                  }
                }}
              >
                <FileText className="h-6 w-6 mr-3 text-muted-foreground" />
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className={cn(
                      "text-xs",
                      file.status === 'completed' ? "text-green-600" : "text-muted-foreground",
                      file.status === 'error' ? "text-red-600" : "text-muted-foreground",
                  )}>
                      {statusText[file.status]}
                  </p>
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
