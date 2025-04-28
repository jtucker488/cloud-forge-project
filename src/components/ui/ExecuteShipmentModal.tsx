import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ExecuteShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taxRate: number, discount: number) => void;
}

export default function ExecuteShipmentModal({
  isOpen,
  onClose,
  onSubmit,
}: ExecuteShipmentModalProps) {
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Execute Shipment & Create Invoice</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            onSubmit(taxRate, discount);
          }}
        >
          <div>
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={taxRate}
              onChange={e => setTaxRate(Number(e.target.value))}
              placeholder="0 or 6"
            />
          </div>
          <div>
            <Label htmlFor="discount">Discount ($)</Label>
            <Input
              id="discount"
              type="number"
              min={0}
              step={0.01}
              value={discount}
              onChange={e => setDiscount(Number(e.target.value))}
              placeholder="Optional"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Execute & Create Invoice</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}