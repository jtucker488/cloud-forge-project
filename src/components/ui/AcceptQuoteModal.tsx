import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AcceptQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (quoteId: string, paymentTerms: string, deliveryTerms: string) => void;
  quote: {
    id: string;
    customer_name: string;
    total_price: number;
  };
}

export default function AcceptQuoteModal({ isOpen, onClose, onAccept, quote }: AcceptQuoteModalProps) {
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [deliveryTerms, setDeliveryTerms] = useState('FOB Origin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[AcceptQuoteModal] Submitting with values:");
    console.log("paymentTerms:", paymentTerms);
    console.log("deliveryTerms:", deliveryTerms);
    onAccept(quote.id, paymentTerms, deliveryTerms);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Accept Quote</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Input
              id="paymentTerms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="Net 30"
            />
          </div>
          <div>
            <Label htmlFor="deliveryTerms">Delivery Terms</Label>
            <Input
              id="deliveryTerms"
              value={deliveryTerms}
              onChange={(e) => setDeliveryTerms(e.target.value)}
              placeholder="FOB Origin"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Accept Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 