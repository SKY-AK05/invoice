
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FolderKanban } from 'lucide-react';

interface DrivePickerProps {
  onFileSelect: (fileDataUri: string, fileName: string) => void;
  isProcessing: boolean;
}

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
const APP_ID = process.env.NEXT_PUBLIC_GOOGLE_APP_ID || '';


export function DrivePicker({ onFileSelect, isProcessing }: DrivePickerProps) {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const scriptGapi = document.createElement('script');
    scriptGapi.src = 'https://apis.google.com/js/api.js';
    scriptGapi.async = true;
    scriptGapi.defer = true;
    scriptGapi.onload = () => setGapiLoaded(true);
    document.body.appendChild(scriptGapi);

    const scriptGis = document.createElement('script');
    scriptGis.src = 'https://accounts.google.com/gsi/client';
    scriptGis.async = true;
    scriptGis.defer = true;
    scriptGis.onload = () => setGisLoaded(true);
    document.body.appendChild(scriptGis);

    return () => {
      document.body.removeChild(scriptGapi);
      document.body.removeChild(scriptGis);
    };
  }, []);

  useEffect(() => {
    if (gapiLoaded) {
      window.gapi.load('client:picker', () => {
        window.gapi.client.load('drive', 'v3');
      });
    }
  }, [gapiLoaded]);
  
  useEffect(() => {
    if (gisLoaded) {
       if (!CLIENT_ID) {
        console.error("Google Client ID is missing. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env file.");
        return;
      }
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            createPicker(tokenResponse.access_token);
          }
        },
      });
      setTokenClient(client);
    }
  }, [gisLoaded]);


  const handleAuthClick = () => {
     if (!CLIENT_ID || !API_KEY || !APP_ID) {
        toast({
            variant: "destructive",
            title: "Google Drive Not Configured",
            description: "Google API credentials are not set up. Please add them to your .env file.",
        });
        return;
    }
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  };

  const createPicker = (accessToken: string) => {
    const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
    view.setMimeTypes("application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    const picker = new window.google.picker.PickerBuilder()
      .setAppId(APP_ID)
      .setApiKey(API_KEY)
      .setOAuthToken(accessToken)
      .addView(view)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const doc = data.docs[0];
          downloadFile(doc.id, doc.name, accessToken);
        }
      })
      .build();
    picker.setVisible(true);
  };

  const downloadFile = async (fileId: string, fileName: string, accessToken: string) => {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
        toast({
            variant: "destructive",
            title: "Download Failed",
            description: `Failed to download file from Google Drive. Status: ${response.statusText}`,
        });
        return;
    }

    const blob = await response.blob();
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      onFileSelect(dataUri, fileName);
    };
    reader.onerror = () => {
        toast({
            variant: "destructive",
            title: "File Read Error",
            description: "Could not read the selected file from Google Drive.",
        });
    };
    reader.readAsDataURL(blob);
  };

  const isReady = gapiLoaded && gisLoaded && !!CLIENT_ID;

  return (
    <Button
      onClick={handleAuthClick}
      disabled={!isReady || isProcessing}
      variant="outline"
      className="w-full"
    >
      <FolderKanban className="mr-2" />
      {isReady ? 'Select from Google Drive' : 'Loading Drive...'}
    </Button>
  );
}
