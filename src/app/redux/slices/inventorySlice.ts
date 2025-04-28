// store/slices/inventorySlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/app/store';
import { fetchMaterials } from './materialsSlice';
import { fetchGrades } from './gradesSlice';
import { supabase } from '@/lib/supabase';

export interface InventoryItem {
  id: number;
  material_id: string;
  material_name: string;
  grade_name: string;
  length: number;
  width: number;
  thickness: number;
  on_hand_quantity: number;
  allocated_quantity: number;
  default_price: number;
}

interface InventoryState {
  inventory: Record<number, InventoryItem>;
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  inventory: {},
  loading: false,
  error: null,
};

export const fetchInventory = createAsyncThunk(
  'inventory/fetchInventory',
  async (_, { getState, dispatch }) => {
    // First ensure materials and grades are loaded
    await dispatch(fetchMaterials());
    await dispatch(fetchGrades());
    
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error('No access token found. Please log in.');
    const res = await fetch('/api/inventory', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    
    // Get the current state to access material and grade maps
    const state = getState() as RootState;
    const materialMap = state.materials.materialMap;
    const gradeMap = state.grades.gradeMap;

    // Transform the data to include material and grade names
    const transformedData = data.map((item: any) => ({
      ...item,
      material_name: materialMap[item.material_id] || '',
      grade_name: gradeMap[item.grade_id] || ''
    }));

    return transformedData;
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.inventory = Object.fromEntries(
          action.payload.map((item: InventoryItem) => [item.id, item])
        );
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load inventory';
      });
  },
});

export const selectInventory = (state: RootState) =>
  Object.values(state.inventory.inventory);

export default inventorySlice.reducer;