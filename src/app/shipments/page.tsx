"use client";
import React, { useEffect, useState } from 'react';
import ShipmentsCard from '@/components/ui/ShipmentsCard';
import EditShipmentModal from '@/components/ui/EditShipmentModal';
import { Shipment } from '@/types/shipment';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import ExecuteShipmentModal from '@/components/ui/ExecuteShipmentModal';
import { supabase } from '@/lib/supabase';

const getAccessToken = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  console.log('[getAccessToken] sessionData:', sessionData, 'accessToken:', accessToken);
  if (!accessToken) throw new Error('No access token found. Please log in.');
  return accessToken;
};

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [executeModalOpen, setExecuteModalOpen] = useState(false);
  const [shipmentToExecute, setShipmentToExecute] = useState<Shipment | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const accessToken = await getAccessToken();
      console.log('[fetchShipments] Using accessToken:', accessToken);
      const response = await fetch('/api/shipments', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      console.log('[fetchShipments] Response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch shipments');
      }
      const data = await response.json();
      console.log('[fetchShipments] Shipments data:', data);
      setShipments(data);
    } catch (err) {
      console.error('[fetchShipments] Error:', err);
      setError('Failed to load shipments. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditShipment = async (updates: Partial<Shipment>) => {
    if (!editingShipment) return;
    try {
      const accessToken = await getAccessToken();
      console.log('[handleEditShipment] Editing shipment:', editingShipment, 'with updates:', updates);
      const response = await fetch(`/api/shipments/${editingShipment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updates),
      });
      console.log('[handleEditShipment] Response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to update shipment');
      }
      await fetchShipments();
      toast.success('Shipment updated successfully');
      setEditingShipment(null);
    } catch (error) {
      console.error('[handleEditShipment] Error:', error);
      toast.error('Failed to update shipment');
    }
  };

  const handleExecuteShipment = (shipment: Shipment) => {
    console.log('[handleExecuteShipment] Executing shipment:', shipment);
    setShipmentToExecute(shipment);
    setExecuteModalOpen(true);
  };

  const handleExecuteModalSubmit = async (taxRate: number, discount: number) => {
    if (!shipmentToExecute) return;
    try {
      const accessToken = await getAccessToken();
      console.log('[handleExecuteModalSubmit] Executing shipment:', shipmentToExecute, 'taxRate:', taxRate, 'discount:', discount);

      // 1. Update shipment status to delivered
      const updateRes = await fetch(`/api/shipments/${shipmentToExecute.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: 'delivered', actual_ship_date: new Date().toISOString() }),
      });
      console.log('[handleExecuteModalSubmit] Update shipment response:', updateRes.status);
      if (!updateRes.ok) throw new Error('Failed to update shipment status');

      // 2. Create invoice with tax/discount
      const invoiceRes = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          shipmentId: shipmentToExecute.id,
          tax_rate: taxRate,
          discount_amount: discount,
        }),
      });
      console.log('[handleExecuteModalSubmit] Create invoice response:', invoiceRes.status);
      if (!invoiceRes.ok) throw new Error('Failed to create invoice');
      const invoice = await invoiceRes.json();
      console.log('[handleExecuteModalSubmit] Invoice:', invoice);

      // 3. Adjust inventory (decrease allocated_quantity)
      const executeRes = await fetch(`/api/shipments/${shipmentToExecute.id}/execute`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      console.log('[handleExecuteModalSubmit] Execute shipment response:', executeRes.status);
      if (!executeRes.ok) throw new Error('Failed to adjust inventory after shipment execution');

      // 4. Refresh shipments and redirect
      await fetchShipments();
      setExecuteModalOpen(false);
      setShipmentToExecute(null);
      router.push(`/invoices/${invoice.id}`);
    } catch (error) {
      toast.error('Failed to execute shipment and create invoice');
      console.error('[handleExecuteModalSubmit] Error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shipments</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shipments.map((shipment) => (
          <ShipmentsCard 
            key={shipment.id} 
            shipment={shipment} 
            onEdit={setEditingShipment}
            onExecute={handleExecuteShipment}
          />
        ))}
      </div>
      {shipments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No shipments found</p>
        </div>
      )}

      {editingShipment && (
        <EditShipmentModal
          isOpen={!!editingShipment}
          onClose={() => setEditingShipment(null)}
          shipment={editingShipment}
          onSave={handleEditShipment}
        />
      )}

      <ExecuteShipmentModal
        isOpen={executeModalOpen}
        onClose={() => setExecuteModalOpen(false)}
        onSubmit={handleExecuteModalSubmit}
      />
    </div>
  );
} 