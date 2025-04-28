import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import EditShipmentModal from './EditShipmentModal';
import ShipmentsCard from './ShipmentsCard';
import { Shipment } from '@/types/shipment';

interface ViewShipmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipments: Shipment[];
  onUpdateShipment: (shipmentId: string, updates: Partial<Shipment>) => Promise<void>;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_transit: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function ViewShipmentsModal({ isOpen, onClose, shipments, onUpdateShipment }: ViewShipmentsModalProps) {
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);

  const handleEditShipment = async (updates: Partial<Shipment>) => {
    if (!editingShipment) return;
    await onUpdateShipment(editingShipment.id.toString(), updates);
    setEditingShipment(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Shipments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {shipments.length === 0 ? (
              <p className="text-sm text-gray-500">No shipments found</p>
            ) : (
              shipments.map((shipment) => (
                <ShipmentsCard
                  key={shipment.id}
                  shipment={shipment}
                  onEdit={setEditingShipment}
                />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {editingShipment && (
        <EditShipmentModal
          isOpen={!!editingShipment}
          onClose={() => setEditingShipment(null)}
          shipment={editingShipment}
          onSave={handleEditShipment}
        />
      )}
    </>
  );
} 