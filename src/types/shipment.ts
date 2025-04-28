export interface Shipment {
  id: number;
  sales_order_id: number;
  customer_name: string;
  shipping_address?: string;
  carrier?: string;
  tracking_number?: string;
  planned_ship_date?: string;
  actual_ship_date?: string;
  status: string;
  freight_cost?: number;
  created_at: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
} 