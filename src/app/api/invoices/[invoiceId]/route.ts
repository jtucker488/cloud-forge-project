import { NextResponse} from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: Request,
  context: any    // <--- same here
) {
  try {
    const invoiceId = Number(context.params.invoiceId);
    console.log('Fetching invoice with ID:', invoiceId);

    // 1. Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // 2. Fetch shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', invoice.shipment_id)
      .single();
    if (shipmentError || !shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // 3. Fetch sales order
    const { data: salesOrder, error: salesOrderError } = await supabase
      .from('sales_orders')
      .select('*')
      .eq('id', shipment.sales_order_id)
      .single();
    if (salesOrderError || !salesOrder) {
      return NextResponse.json({ error: 'Sales order not found' }, { status: 404 });
    }

    // 4. Fetch quote line items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('quote_line_items')
      .select('*')
      .eq('quote_id', salesOrder.quote_id);
    if (lineItemsError) {
      return NextResponse.json({ error: 'Failed to fetch line items' }, { status: 500 });
    }

    return NextResponse.json({
      invoice,
      shipment,
      salesOrder,
      lineItems,
    });
  } catch (err) {
    console.error('Error in /api/invoices/[invoiceId]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}