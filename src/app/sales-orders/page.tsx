'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { fetchSalesOrders } from '@/store/slices/salesOrdersSlice';
import { fetchQuote } from '@/store/slices/quotesSlice';
import { fetchShipments } from '@/store/slices/shipmentsSlice';
import SalesOrderCard from '@/components/ui/SalesOrderCard';
import { toast } from 'sonner';

export default function SalesOrdersPage() {
  const dispatch = useDispatch();
  const { salesOrders, loading, error } = useSelector((state: RootState) => state.salesOrders);

  useEffect(() => {
    dispatch(fetchSalesOrders());
  }, [dispatch]);

  const handleViewQuote = async (quoteId: string) => {
    try {
      const result = await dispatch(fetchQuote(quoteId));
      return result.payload;
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to fetch quote details',
      });
      throw error;
    }
  };

  const handleViewShipments = async (salesOrderId: string) => {
    try {
      const response = await fetch(`/api/sales-orders/${salesOrderId}/shipments`);
      if (!response.ok) {
        throw new Error('Failed to fetch shipments');
      }
      const shipments = await response.json();
      return shipments; // This will be an array of shipment objects, each with a status
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to fetch shipments',
      });
      throw error;
    }
  };

  if (loading) {
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
      <h1 className="text-2xl font-bold mb-6">Sales Orders</h1>
      <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
        {salesOrders.map((salesOrder) => (
          <SalesOrderCard
            key={salesOrder.id}
            salesOrder={salesOrder}
            onViewQuote={handleViewQuote}
            onViewShipments={handleViewShipments}
          />
        ))}
      </div>
    </div>
  );
} 