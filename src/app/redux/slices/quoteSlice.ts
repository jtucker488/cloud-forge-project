import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/app/store';

export interface QuoteItem {
  id: string;
  material_id: string;
  material_name: string;
  grade_name: string;
  length?: number;
  width?: number;
  thickness?: number;
  quantity: number;
  price?: number;
  notes?: string;
}

interface QuoteState {
  items: QuoteItem[];
}

const initialState: QuoteState = {
  items: [],
};

const quoteSlice = createSlice({
  name: 'quote',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<QuoteItem>) => {
      const existingItem = state.items.find(item => 
        item.material_id === action.payload.material_id &&
        item.grade_name === action.payload.grade_name &&
        item.length === action.payload.length &&
        item.width === action.payload.width &&
        item.thickness === action.payload.thickness
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
      }
    },
    clearQuote: (state) => {
      state.items = [];
    },
  },
});

export const selectQuoteItems = (state: RootState) => state.quote.items;
export const { addItem, removeItem, updateQuantity, clearQuote } = quoteSlice.actions;
export default quoteSlice.reducer; 