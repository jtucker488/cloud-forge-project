import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/app/store';
import { supabase } from '@/lib/supabase';

interface Quote {
  id: string;
  customer_name: string;
  created_at: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  total_price: number;
  notes?: string;
}

interface QuotesState {
  quotes: Quote[];
  loading: boolean;
  error: string | null;
}

const initialState: QuotesState = {
  quotes: [],
  loading: false,
  error: null,
};

export const createQuote = createAsyncThunk(
  'quotes/createQuote',
  async (quote: Omit<Quote, 'id' | 'created_at'>, { rejectWithValue }) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('No access token found. Please log in.');
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(quote),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create quote');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create quote');
    }
  }
);

const quotesSlice = createSlice({
  name: 'quotes',
  initialState,
  reducers: {
    setQuotes: (state, action: PayloadAction<Quote[]>) => {
      state.quotes = action.payload;
    },
    updateQuoteStatus: (state, action: PayloadAction<{ id: string; status: 'draft' | 'sent' | 'accepted' | 'rejected' }>) => {
      const { id, status } = action.payload;
      const quote = state.quotes.find(q => q.id === id);
      if (quote) {
        quote.status = status;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuote.fulfilled, (state, action) => {
        state.loading = false;
        state.quotes.push(action.payload);
      })
      .addCase(createQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setQuotes, updateQuoteStatus, setLoading, setError } = quotesSlice.actions;
export default quotesSlice.reducer; 