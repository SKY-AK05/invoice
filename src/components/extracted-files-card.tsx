
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";

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
    completed: "Completed",
    error: "Failed - Click to retry",
}

export function ExtractedFilesCard({ files, onProcessFile, onClear }: ExtractedFilesCardProps) {

  const getStatusIcon = (file: ExtractedFile) => {
    switch (file.status) {
        case 'idle':
            return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
        case 'processing':
            return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
        case 'completed':
            return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        case 'error':
             return <RefreshCw className="h-5 w-5 text-destructive" />;
    }
  }

  const isClickable = (file: ExtractedFile) => file.status === 'error';
  
  const completedCount = files.filter(f => f.status === 'completed').length;
  const progressValue = files.length > 0 ? (completedCount / files.length) * 100 : 0;
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
            <CardTitle>Processing Queue</CardTitle>
            <CardDescription>
                {completedCount} of {files.length} files processed.
            </CardDescription>
        </div>
         <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear extracted files">
            <XCircle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <Progress value={progressValue} />
            <ScrollArea className="h-60 w-full pr-4">
              <div className="space-y-3">
                {files.map((file) => (
                  <div 
                    key={file.id} 
                    className={cn(
                      "flex items-center p-3 rounded-md border-l-4 transition-colors",
                      isClickable(file) && "cursor-pointer hover:bg-accent",
                      file.status === 'completed' && "border-green-500 bg-green-500/10",
                      file.status === 'error' && "border-destructive bg-destructive/10",
                      file.status === 'processing' && "border-primary",
                      file.status === 'idle' && "border-border",
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
                    <FileText className="h-6 w-6 mr-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 truncate">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className={cn(
                          "text-xs",
                          file.status === 'completed' ? "text-green-600" : "text-muted-foreground",
                          file.status === 'error' ? "text-destructive" : "text-muted-foreground",
                          file.status === 'processing' ? "text-primary" : "text-muted-foreground",
                      )}>
                          {statusText[file.status]}
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 ml-2 flex-shrink-0">
                      {getStatusIcon(file)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
