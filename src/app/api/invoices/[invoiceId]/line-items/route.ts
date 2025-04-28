import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/authMiddleware';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    // Verify user authentication
    await verifyUser(request);

    const invoiceId = params.invoiceId;

    // 1. Get the shipment_id from the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('shipment_id')
      .eq('id', invoiceId)
      .single();
    console.log('invoice:', invoice);
    if (invoiceError || !invoice) {
      console.error('Invoice fetch error:', invoiceError, 'InvoiceId:', invoiceId);
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // 2. Get the full shipment record
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', invoice.shipment_id)
      .single();
    console.log('shipment:', shipment);
    if (shipmentError || !shipment) {
      console.error('Shipment fetch error:', shipmentError, 'ShipmentId:', invoice.shipment_id);
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // 3. Get the quote_id from the sales order
    const { data: salesOrder, error: salesOrderError } = await supabase
      .from('sales_orders')
      .select('quote_id')
      .eq('id', shipment.sales_order_id)
      .single();
    console.log('salesOrder:', salesOrder);
    if (salesOrderError || !salesOrder) {
      console.error('Sales order fetch error:', salesOrderError, 'SalesOrderId:', shipment.sales_order_id);
      return NextResponse.json(
        { error: 'Sales order not found' },
        { status: 404 }
      );
    }

    // 4. Get the line items from the associated quote
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('quote_line_items')
      .select('*')
      .eq('quote_id', salesOrder.quote_id)
      .order('id', { ascending: true });
    if (lineItemsError) {
      console.error('Line items fetch error:', lineItemsError, 'QuoteId:', salesOrder.quote_id);
      return NextResponse.json(
        { error: 'Failed to fetch line items' },
        { status: 500 }
      );
    }

    // Return both line items and shipment details
    return NextResponse.json({
      lineItems: Array.isArray(lineItems) ? lineItems : [],
      shipment
    });
  } catch (error: any) {
    console.error('API route error:', error);
    if (error instanceof NextResponse) {
      return error;
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
