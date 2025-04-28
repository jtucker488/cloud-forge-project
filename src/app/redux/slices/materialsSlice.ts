// store/slices/materialsSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/app/store/index';
import { supabase } from '@/lib/supabase';

export interface Material {
  id: number;
  name: string;
  dimension_unit: string;
  [key: string]: any;
}

interface MaterialsState {
  materials: Record<number, Material>;
  materialMap: Record<number, string>;
  loading: boolean;
  error: string | null;
}

const initialState: MaterialsState = {
  materials: {},
  materialMap: {},
  loading: false,
  error: null,
};

// export const fetchMaterials = createAsyncThunk(
//   'materials/fetchMaterials',
//   async () => {
//     const res = await fetch('/api/materials');
//     const data = await res.json();
//     return data as Material[];
//   }
// );

export const fetchMaterials = createAsyncThunk(
  'materials/fetchMaterials',
  async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error('No access token found. Please log in.');
    const res = await fetch('/api/materials', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format: expected an array');
    }
    return data as Material[];
  }
);

const materialsSlice = createSlice({
  name: 'materials',
  initialState,
  reducers: {
    setMaterials(state, action: PayloadAction<Material[]>) {
      state.materials = Object.fromEntries(action.payload.map((m) => [m.id, m]));
      state.materialMap = Object.fromEntries(action.payload.map((m) => [m.id, m.name]));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaterials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaterials.fulfilled, (state, action) => {
        state.loading = false;
        state.materials = Object.fromEntries(action.payload.map((m) => [m.id, m]));
        state.materialMap = Object.fromEntries(action.payload.map((m) => [m.id, m.name]));
      })
      .addCase(fetchMaterials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load materials';
      });
  },
});

export const selectMaterialsArray = (state: RootState) =>
  Object.values(state.materials.materials);

export const selectMaterialNameById = (id: number) => (state: RootState) =>
  state.materials.materialMap[id];

export const selectMaterialMap = (state: RootState) =>
  state.materials.materialMap;

export const { setMaterials } = materialsSlice.actions;

export default materialsSlice.reducer;