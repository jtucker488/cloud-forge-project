import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/app/store'; // or wherever your RootState is defined
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

export const fetchQuotes = createAsyncThunk(
  'quotes/fetchQuotes',
  async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error('No access token found. Please log in.');
    const response = await fetch('/api/quotes', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch quotes');
    }
    return response.json();
  }
);

export const fetchQuote = createAsyncThunk(
  'quotes/fetchQuote',
  async (quoteId: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error('No access token found. Please log in.');
    const response = await fetch(`/api/quotes/${quoteId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch quote');
    }
    console.log("response", response);
    return response.json();
  }
);

export const acceptQuote = createAsyncThunk(
  'quotes/acceptQuote',
  async ({ quoteId, terms }: { quoteId: string; terms: { payment_terms: string; delivery_terms: string } }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error('No access token found. Please log in.');
    const response = await fetch(`/api/quotes/${quoteId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(terms),
    });
    if (!response.ok) {
      throw new Error('Failed to accept quote');
    }
    return response.json();
  }
);

const quotesSlice = createSlice({
  name: 'quotes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuotes.fulfilled, (state, action) => {
        state.loading = false;
        state.quotes = action.payload;
      })
      .addCase(fetchQuotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch quotes';
      })
      .addCase(fetchQuote.fulfilled, (state, action) => {
        const index = state.quotes.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.quotes[index] = action.payload;
        } else {
          state.quotes.push(action.payload);
        }
      })
      .addCase(acceptQuote.fulfilled, (state, action) => {
        const index = state.quotes.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.quotes[index] = action.payload;
        }
      });
  },
});

export const selectCurrentQuote = (id: string) => (state: RootState) =>
  state.quotes.quotes.find(q => q.id === id);
export const selectQuotesLoading = (state: RootState) => state.quotes.loading;
export default quotesSlice.reducer; 