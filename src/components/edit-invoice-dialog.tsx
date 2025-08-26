
"use client";

import { useState, useEffect } from 'react';
import { type InvoiceEntry } from './invoice-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditInvoiceDialogProps {
  invoice: InvoiceEntry;
  onSave: (invoice: InvoiceEntry) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function EditInvoiceDialog({ invoice, onSave, onCancel, isOpen }: EditInvoiceDialogProps) {
  const [formData, setFormData] = useState<InvoiceEntry>(invoice);

  useEffect(() => {
    setFormData(invoice);
  }, [invoice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Handle number conversion
    const isNumberField = ['amountExclGST', 'gstPercentage', 'totalInclGST'].includes(name);
    setFormData(prev => ({
      ...prev,
      [name]: isNumberField ? (value === '' ? undefined : Number(value)) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Invoice Entry</DialogTitle>
          <DialogDescription>
            Make changes to the invoice details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            
            {/* We map over the fields to create the form dynamically */}
            {Object.entries(formData).map(([key, value]) => {
              // We don't want to edit id, link or fileName here
              if (['id', 'link', 'fileName'].includes(key)) return null;

              // Create a more readable label from the key
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              const isNumberField = ['amountExclGST', 'gstPercentage', 'totalInclGST'].includes(key);

              return (
                <div key={key} className="grid items-center gap-1.5">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    name={key}
                    type={isNumberField ? 'number' : 'text'}
                    value={value || ''}
                    onChange={handleChange}
                    className="col-span-3"
                    step={isNumberField ? '0.01' : undefined}
                  />
                </div>
              );
            })}

          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
