import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

interface Quote {
  id: string;
  customer_name: string;
  created_at: string;
  total_price: number;
  status: string;
  notes?: string;
}

interface ViewQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
}

export default function ViewQuoteModal({ isOpen, onClose, quote }: ViewQuoteModalProps) {
  const formattedDate = format(new Date(quote.created_at), 'MMM d, yyyy');
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(quote.total_price);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quote Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Customer</p>
              <p className="text-sm">{quote.customer_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created Date</p>
              <p className="text-sm">{formattedDate}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Price</p>
              <p className="text-sm font-semibold">{formattedPrice}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="text-sm">{quote.status}</p>
            </div>
          </div>
          {quote.notes && (
            <div>
              <p className="text-sm font-medium text-gray-500">Notes</p>
              <p className="text-sm">{quote.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 