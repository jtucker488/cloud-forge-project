import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { useAppDispatch } from '@/store/hooks';
import { supabase } from '@/lib/supabase';

interface Shipment {
  id: string;
  sales_order_id: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  estimated_delivery_date: string;
  actual_delivery_date?: string;
  tracking_number?: string;
  carrier?: string;
}

interface ShipmentsState {
  shipments: Shipment[];
  loading: boolean;
  error: string | null;
}

const initialState: ShipmentsState = {
  shipments: [],
  loading: false,
  error: null,
};

export const fetchShipments = createAsyncThunk(
  'shipments/fetchShipments',
  async (salesOrderId: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error('No access token found. Please log in.');
    const response = await fetch(`/api/sales-orders/${salesOrderId}/shipments`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch shipments');
    }
    return response.json();
  }
);

const shipmentsSlice = createSlice({
  name: 'shipments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchShipments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShipments.fulfilled, (state, action) => {
        state.loading = false;
        state.shipments = action.payload;
      })
      .addCase(fetchShipments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch shipments';
      });
  },
});

export default shipmentsSlice.reducer; 