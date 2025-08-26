
"use client";

import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import type { ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';
import type { ExtractedFile } from './extracted-files-card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ChevronDown, Trash2, Pencil } from 'lucide-react';
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

export type InvoiceEntry = Extract<ExtractInvoiceDataOutput, any[]>[number] & { id: string };

interface InvoiceTableProps {
  data: InvoiceEntry[];
  sourceFiles: ExtractedFile[];
  onEdit: (invoice: InvoiceEntry) => void;
  onDelete: (invoiceId: string) => void;
}

const tableHeaders = [
  'SL No.', 'Client Name', 'Client ID', 'Invoice No', 'Invoice Date', 'Period', 'Purpose',
  'Amount (excl. GST)', 'GST % Used', 'Total incl. GST', 'Status', 'Link', 'File Name', 'Actions'
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
    if (!status) return null;
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case 'paid':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'unpaid':
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Unpaid</Badge>;
      case 'partially paid':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Partially Paid</Badge>;
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
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {tableHeaders.map(header => <TableHead key={header}>{header}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{row.clientName || 'N/A'}</TableCell>
                <TableCell>{row.clientId || 'N/A'}</TableCell>
                <TableCell className="font-medium">{row.invoiceNo || 'N/A'}</TableCell>
                <TableCell>{row.invoiceDate || 'N/A'}</TableCell>
                <TableCell>{row.period || 'N/A'}</TableCell>
                <TableCell className="max-w-xs truncate">{row.purpose || 'N/A'}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.amountExclGST)}</TableCell>
                <TableCell className="text-center">{row.gstPercentage ? `${row.gstPercentage}%` : 'N/A'}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(row.totalInclGST)}</TableCell>
                <TableCell>{getStatusBadge(row.status)}</TableCell>
                <TableCell>
                  {row.link ? <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View</a> : 'N/A'}
                </TableCell>
                <TableCell className="max-w-[150px] truncate">{row.fileName || 'N/A'}</TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
