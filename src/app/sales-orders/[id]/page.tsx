import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ViewShipmentsModal from '@/components/ui/ViewShipmentsModal';
import { Shipment } from '@/types/shipment';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface SalesOrderPageProps {
  params: {
    id: string;
  };
}

export default function SalesOrderPage({ params }: SalesOrderPageProps) {
  const router = useRouter();
  const [isShipmentsModalOpen, setIsShipmentsModalOpen] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  const handleUpdateShipment = async (shipmentId: string, updates: Partial<Shipment>) => {
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
      const updatedShipments = await fetch(`/api/shipments?orderId=${params.id}`).then(res => res.json());
      setShipments(updatedShipments);
    } catch (error) {
      console.error('Error updating shipment:', error);
      throw error;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Sales Order #{params.id}</h1>
      
      <Button onClick={() => setIsShipmentsModalOpen(true)}>
        View Shipments
      </Button>

      <ViewShipmentsModal
        isOpen={isShipmentsModalOpen}
        onClose={() => setIsShipmentsModalOpen(false)}
        shipments={shipments}
        onUpdateShipment={handleUpdateShipment}
      />
    </div>
  );
} 