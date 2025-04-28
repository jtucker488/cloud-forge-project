import { configureStore } from '@reduxjs/toolkit';
import quotesReducer from './slices/quotesSlice';
import salesOrdersReducer from './slices/salesOrdersSlice';
import shipmentsReducer from './slices/shipmentsSlice';

export const store = configureStore({
  reducer: {
    quotes: quotesReducer,
    salesOrders: salesOrdersReducer,
    shipments: shipmentsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 