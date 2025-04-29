import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/authMiddleware';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/invoices/[invoiceId]/line-items called');
    const userId = await verifyUser(request);
    console.log('Verified userId:', userId);

    // Parse invoiceId manually
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const invoiceId = segments[segments.length - 3]; // <- ⚡ 3rd from end (/api/invoices/[invoiceId]/line-items)

    console.log('Parsed invoiceId param:', invoiceId);

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('shipment_id')
      .eq('id', invoiceId)
      .single();
    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('sales_order_id')
      .eq('id', invoice.shipment_id)
      .single();
    if (shipmentError || !shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    const { data: salesOrder, error: salesOrderError } = await supabase
      .from('sales_orders')
      .select('quote_id')
      .eq('id', shipment.sales_order_id)
      .single();
    if (salesOrderError || !salesOrder) {
      return NextResponse.json({ error: 'Sales order not found' }, { status: 404 });
    }

    const { data: lineItems, error: lineItemsError } = await supabase
      .from('quote_line_items')
      .select('*')
      .eq('quote_id', salesOrder.quote_id)
      .order('id', { ascending: true });
    if (lineItemsError) {
      return NextResponse.json({ error: 'Failed to fetch line items' }, { status: 500 });
    }

    return NextResponse.json({
      lineItems: Array.isArray(lineItems) ? lineItems : [],
      shipment,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in GET /api/invoices/[invoiceId]/line-items:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}