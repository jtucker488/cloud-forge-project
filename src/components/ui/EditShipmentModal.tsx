import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Shipment } from '@/types/shipment';

interface EditShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment;
  onSave: (updatedShipment: Partial<Shipment>) => Promise<void>;
}

export default function EditShipmentModal({ isOpen, onClose, shipment, onSave }: EditShipmentModalProps) {
  const [formData, setFormData] = useState({
    planned_ship_date: shipment.planned_ship_date || '',
    actual_ship_date: shipment.actual_ship_date || '',
    freight_cost: shipment.freight_cost?.toString() || '',
    carrier: shipment.carrier || '',
    tracking_number: shipment.tracking_number || '',
    shipping_address: shipment.shipping_address || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert freight_cost to number and validate
      const freightCost = formData.freight_cost ? parseFloat(formData.freight_cost) : undefined;
      if (freightCost !== undefined && freightCost < 0) {
        throw new Error('Freight cost must be a positive number');
      }

      await onSave({
        id: shipment.id,
        planned_ship_date: formData.planned_ship_date || undefined,
        actual_ship_date: formData.actual_ship_date || undefined,
        freight_cost: freightCost,
        carrier: formData.carrier || undefined,
        tracking_number: formData.tracking_number || undefined,
        shipping_address: formData.shipping_address || undefined,
      });

      toast.success('Shipment updated successfully');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update shipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Shipment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="planned_ship_date">Planned Ship Date</Label>
              <Input
                id="planned_ship_date"
                type="date"
                value={formData.planned_ship_date}
                onChange={(e) => setFormData({ ...formData, planned_ship_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="actual_ship_date">Actual Ship Date</Label>
              <Input
                id="actual_ship_date"
                type="date"
                value={formData.actual_ship_date}
                onChange={(e) => setFormData({ ...formData, actual_ship_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="freight_cost">Freight Cost</Label>
            <Input
              id="freight_cost"
              type="number"
              min="0"
              step="0.01"
              value={formData.freight_cost}
              onChange={(e) => setFormData({ ...formData, freight_cost: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="carrier">Carrier</Label>
            <Input
              id="carrier"
              value={formData.carrier}
              onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="tracking_number">Tracking Number</Label>
            <Input
              id="tracking_number"
              value={formData.tracking_number}
              onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="shipping_address">Shipping Address</Label>
            <Input
              id="shipping_address"
              value={formData.shipping_address}
              onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 