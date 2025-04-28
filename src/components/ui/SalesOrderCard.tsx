import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import ViewQuoteModal from './ViewQuoteModal';
import ViewShipmentsModal from './ViewShipmentsModal';
import { Shipment } from '@/types/shipment';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { supabase } from '@/lib/supabase';

interface SalesOrder {
  id: string;
  customer_name: string;
  created_at: string;
  total_price: number;
  payment_terms: string;
  delivery_terms: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  quote_id: string;
}

interface SalesOrderCardProps {
  salesOrder: SalesOrder;
  onViewQuote: (quoteId: string) => Promise<any>;
  onViewShipments: (orderId: string) => Promise<Shipment[]>;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  processing: 'bg-blue-100 text-blue-800 border-blue-300',
  shipped: 'bg-purple-100 text-purple-800 border-purple-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
};

const statusLabels = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function SalesOrderCard({ salesOrder, onViewQuote, onViewShipments }: SalesOrderCardProps) {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isShipmentsModalOpen, setIsShipmentsModalOpen] = useState(false);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [shipmentsData, setShipmentsData] = useState<any[]>([]);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const router = useRouter();

  const formattedDate = format(new Date(salesOrder.created_at), 'MMM d, yyyy');
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(salesOrder.total_price);

  const handleViewQuote = async () => {
    try {
      const data = await onViewQuote(salesOrder.quote_id);
      setQuoteData(data);
      setIsQuoteModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch quote:', error);
    }
  };

  const handleViewShipments = async () => {
    try {
      const data = await onViewShipments(salesOrder.id);
      setShipmentsData(data);
      setIsShipmentsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    }
  };

  const handleViewInvoice = async () => {
    // Fetch shipments for this sales order
    const shipments = await onViewShipments(salesOrder.id);
    const hasDelivered = shipments.some(s => s.status === 'delivered');
    if (!hasDelivered) {
      setShowExecuteModal(true);
    } else {
      router.push(`/invoices/${salesOrder.id}`);
    }
  };

  return (
    <>
      <div className="rounded-lg border p-6 shadow-sm transition-all hover:shadow-md bg-white flex flex-col min-w-[450px] max-w-full h-full">
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{salesOrder.customer_name}</h3>
            <Badge variant="outline" className={statusColors[salesOrder.status]}>
              {statusLabels[salesOrder.status]}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Created: {formattedDate}</p>
              <p className="text-xl font-bold">{formattedPrice}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Payment Terms:</span> {salesOrder.payment_terms}
              </p>
              <p className="text-sm">
                <span className="font-medium">Delivery Terms:</span> {salesOrder.delivery_terms}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={handleViewQuote}
            className="text-sm"
          >
            View Quote
          </Button>
          <Button
            variant="outline"
            onClick={handleViewShipments}
            className="text-sm"
          >
            View Shipments
          </Button>
          {/* <Button
            onClick={handleViewInvoice}
            className="text-sm bg-blue-600 hover:bg-blue-700"
          >
            View Invoice
          </Button> */}
        </div>
      </div>

      {isQuoteModalOpen && quoteData && (
        <ViewQuoteModal
          isOpen={isQuoteModalOpen}
          onClose={() => setIsQuoteModalOpen(false)}
          quote={quoteData}
        />
      )}

      {isShipmentsModalOpen && (
        <ViewShipmentsModal
          isOpen={isShipmentsModalOpen}
          onClose={() => setIsShipmentsModalOpen(false)}
          shipments={shipmentsData}
          onUpdateShipment={async (shipmentId: string, updates: Partial<Shipment>) => {
            try {
              const { data: sessionData } = await supabase.auth.getSession();
              const accessToken = sessionData.session?.access_token;
              if (!accessToken) throw new Error('No access token found. Please log in.');
              const response = await fetch(`/api/shipments/${shipmentId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(updates),
              });

              if (!response.ok) {
                throw new Error('Failed to update shipment');
              }

              // Refresh the shipments data
              const updatedShipments = await onViewShipments(salesOrder.id);
              setShipmentsData(updatedShipments);
            } catch (error) {
              console.error('Error updating shipment:', error);
              throw error;
            }
          }}
        />
      )}

      {showExecuteModal && (
        <Dialog open={showExecuteModal} onOpenChange={setShowExecuteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Execute Shipment to Create Invoice</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>
                You must execute the shipment (mark as delivered) before an invoice can be created.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowExecuteModal(false)}>OK</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 