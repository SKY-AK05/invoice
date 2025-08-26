
"use client";

import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import type { ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';
import type { ExtractedFile } from './extracted-files-card';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ChevronDown, Trash2, Pencil, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Separator } from './ui/separator';

export type InvoiceEntry = Extract<ExtractInvoiceDataOutput, any[]>[number] & { id: string };

interface InvoiceTableProps {
  data: InvoiceEntry[];
  sourceFiles: ExtractedFile[];
  onEdit: (invoice: InvoiceEntry) => void;
  onDelete: (invoiceId: string) => void;
}

const tableHeaders = [
  'SL No.', 'Client Name', 'Client ID', 'Invoice No', 'Invoice Date', 'Period', 'Purpose',
  'Amount (excl. GST)', 'GST % Used', 'Total incl. GST', 'Status', 'Link', 'File Name'
];

const dataKeys = [
  'slNo', 'clientName', 'clientId', 'invoiceNo', 'invoiceDate', 'period', 'purpose',
  'amountExclGST', 'gstPercentage', 'totalInclGST', 'status', 'link', 'fileName'
];


export function InvoiceTable({ data, sourceFiles, onEdit, onDelete }: InvoiceTableProps) {
  const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case 'paid':
        return <Badge variant="outline">Paid</Badge>;
      case 'unpaid':
      case 'pending':
        return <Badge variant="destructive">Unpaid</Badge>;
      case 'partially paid':
        return <Badge variant="secondary">Partially Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportCSV = () => {
    const csvHeaders = tableHeaders.filter(h => h !== 'Actions');
    const csvRows = [csvHeaders.join(',')];
    data.forEach((row, index) => {
      const values = dataKeys.map(key => {
        if (key === 'slNo') return (index + 1).toString();
        const value = row[key as keyof InvoiceEntry];
        const stringValue = typeof value === 'undefined' || value === null ? '' : String(value);
        return `"${stringValue.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `invoice_insights_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportExcel = () => {
    const excelHeaders = tableHeaders.filter(h => h !== 'Actions');
    const worksheetData = data.map((row, index) => {
        const newRow: Record<string, any> = { 'SL No.': index + 1 };
        excelHeaders.slice(1).forEach((header, i) => {
            const key = dataKeys[i+1];
            newRow[header] = row[key as keyof InvoiceEntry];
        });
        return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    triggerDownload(blob, `invoice_insights_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  
  const handleExportZip = async () => {
    const zip = new JSZip();

    // 1. Add Excel file
    const excelHeaders = tableHeaders.filter(h => h !== 'Actions');
    const worksheetData = data.map((row, index) => {
        const newRow: Record<string, any> = { 'SL No.': index + 1 };
        excelHeaders.slice(1).forEach((header, i) => {
            const key = dataKeys[i+1];
            newRow[header] = row[key as keyof InvoiceEntry];
        });
        return newRow;
    });
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    zip.file('invoice_data.xlsx', excelBuffer);

    // 2. Add source files
    sourceFiles.forEach(file => {
        const base64String = file.dataUri.split(',')[1];
        if (base64String) {
            zip.file(file.name, base64String, { base64: true });
        }
    });
    
    const zipBlob = await zip.generateAsync({ type: "blob" });
    triggerDownload(zipBlob, `invoice_insights_archive_${new Date().toISOString().split('T')[0]}.zip`);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleExportCSV}>
              Download CSV
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleExportExcel}>
              Download Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleExportZip}>
              Download as ZIP
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {data.map((row) => (
          <Card key={row.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{row.clientName || 'N/A'}</CardTitle>
                    <CardDescription>Invoice #: {row.invoiceNo || 'N/A'}</CardDescription>
                  </div>
                  {getStatusBadge(row.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
              <div className="text-sm text-muted-foreground space-y-2">
                  <p className="truncate">
                    <span className="font-semibold text-foreground">Purpose:</span> {row.purpose || 'N/A'}
                  </p>
                  <div className="flex justify-between">
                    <p><span className="font-semibold text-foreground">Date:</span> {row.invoiceDate || 'N/A'}</p>
                    <p><span className="font-semibold text-foreground">Period:</span> {row.period || 'N/A'}</p>
                  </div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount (excl. GST)</p>
                    <p className="font-semibold">{formatCurrency(row.amountExclGST)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">GST %</p>
                    <p className="font-semibold">{row.gstPercentage ? `${row.gstPercentage}%` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-bold text-primary">{formatCurrency(row.totalInclGST)}</p>
                  </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                 <FileText className="h-4 w-4 flex-shrink-0" />
                 <span className="truncate">{row.fileName || 'N/A'}</span>
                 {row.link && <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-2 flex-shrink-0">View</a>}
              </div>
               <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(row)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this
                          invoice entry.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(row.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
