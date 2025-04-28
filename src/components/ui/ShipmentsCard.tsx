import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Shipment } from '@/types/shipment';

interface ShipmentsCardProps {
  shipment: Shipment;
  onEdit: (shipment: Shipment) => void;
  onExecute?: (shipment: Shipment) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'in_transit': 'bg-blue-100 text-blue-800 border-blue-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  'in_transit': 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function ShipmentsCard({ shipment, onEdit, onExecute }: ShipmentsCardProps) {
  const formattedCreated = shipment.created_at ? format(new Date(shipment.created_at), 'MMM d, yyyy') : 'N/A';
  const formattedPlanned = shipment.planned_ship_date ? format(new Date(shipment.planned_ship_date), 'MMM d, yyyy') : 'N/A';
  const formattedActual = shipment.actual_ship_date ? format(new Date(shipment.actual_ship_date), 'MMM d, yyyy') : 'N/A';
  const formattedFreight = shipment.freight_cost !== undefined && shipment.freight_cost !== null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(shipment.freight_cost)
    : 'N/A';

  return (
    <div className="rounded-lg border p-6 shadow-sm transition-all hover:shadow-md bg-white flex flex-col min-w-[450px] max-w-full h-full">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{shipment.customer_name}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={statusColors[shipment.status] || ''}>
              {statusLabels[shipment.status] || shipment.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(shipment)}
            >
              Edit Shipment
            </Button>
            {onExecute && shipment.status !== 'delivered' && shipment.status !== 'cancelled' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onExecute(shipment)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Execute Shipment
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Created: {formattedCreated}</p>
            <p className="text-sm">Planned Ship: {formattedPlanned}</p>
            <p className="text-sm">Actual Ship: {formattedActual}</p>
            <p className="text-sm">Freight Cost: {formattedFreight}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm"><span className="font-medium">Carrier:</span> {shipment.carrier || 'N/A'}</p>
            <p className="text-sm"><span className="font-medium">Tracking #:</span> {shipment.tracking_number || 'N/A'}</p>
            <p className="text-sm"><span className="font-medium">Shipping Address:</span> {shipment.shipping_address || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 