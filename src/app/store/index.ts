// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import materialsReducer from '../redux/slices/materialsSlice';
import inventoryReducer from '../redux/slices/inventorySlice';
import gradesReducer from '../redux/slices/gradesSlice';
import quoteReducer from '../redux/slices/quoteSlice';
import quotesReducer from '../redux/slices/quotesSlice';
import salesOrdersReducer from '../redux/slices/salesOrdersSlice';

export const store = configureStore({
  reducer: {
    materials: materialsReducer,
    inventory: inventoryReducer, // 👈 register the inventory slice here
    grades: gradesReducer, // 👈 register the inventory slice here
    quote: quoteReducer,
    quotes: quotesReducer,
    salesOrders: salesOrdersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;