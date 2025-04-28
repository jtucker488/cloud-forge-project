import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/app/store';
import { supabase } from '@/lib/supabase';

export interface SalesOrder {
  id: string;
  customer_name: string;
  created_at: string;
  total_price: number;
  payment_terms: string;
  delivery_terms: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  quote_id: string;
}

interface SalesOrdersState {
  salesOrders: SalesOrder[];
  loading: boolean;
  error: string | null;
}

const initialState: SalesOrdersState = {
  salesOrders: [],
  loading: false,
  error: null,
};

export const fetchSalesOrders = createAsyncThunk(
  'salesOrders/fetchSalesOrders',
  async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error('No access token found. Please log in.');
    const response = await fetch('/api/sales-orders', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch sales orders');
    }
    return response.json();
  }
);

const salesOrdersSlice = createSlice({
  name: 'salesOrders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.salesOrders = action.payload;
      })
      .addCase(fetchSalesOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch sales orders';
      });
  },
});

export default salesOrdersSlice.reducer; 