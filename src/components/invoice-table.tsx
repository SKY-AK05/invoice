
"use client";

import type { ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';
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
import { Download } from 'lucide-react';

interface InvoiceTableProps {
  data: ExtractInvoiceDataOutput[];
}

const tableHeaders = [
  'SL No.', 'Client Name', 'Client ID', 'Invoice No', 'Invoice Date', 'Purpose',
  'Amount (excl. GST)', 'GST % Used', 'Total incl. GST', 'Status', 'Link'
];

const dataKeys: (keyof ExtractInvoiceDataOutput | 'slNo' | 'clientId')[] = [
  'slNo', 'clientName', 'clientId', 'invoiceNo', 'invoiceDate', 'purpose',
  'amountExclGST', 'gstPercentage', 'totalInclGST', 'status', 'link'
];

export function InvoiceTable({ data }: InvoiceTableProps) {
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

  const handleExportCSV = () => {
    const csvRows = [tableHeaders.join(',')];
    data.forEach((row, index) => {
      const values = dataKeys.map(key => {
        if (key === 'slNo') return (index + 1).toString();
        const value = row[key as keyof ExtractInvoiceDataOutput];
        const stringValue = typeof value === 'undefined' || value === null ? '' : String(value);
        return `"${stringValue.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `invoice_insights_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
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
              <TableRow key={row.invoiceNo || index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{row.clientName || 'N/A'}</TableCell>
                <TableCell>{row.clientId || 'N/A'}</TableCell>
                <TableCell className="font-medium">{row.invoiceNo || 'N/A'}</TableCell>
                <TableCell>{row.invoiceDate || 'N/A'}</TableCell>
                <TableCell className="max-w-xs truncate">{row.purpose || 'N/A'}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.amountExclGST)}</TableCell>
                <TableCell className="text-center">{row.gstPercentage ? `${row.gstPercentage}%` : 'N/A'}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(row.totalInclGST)}</TableCell>
                <TableCell>{getStatusBadge(row.status)}</TableCell>
                <TableCell>
                  {row.link ? <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View</a> : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
