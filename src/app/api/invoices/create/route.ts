import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from '@/lib/authMiddleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  console.log('--- /api/invoices/create POST called ---');
  try {
    const userId = await verifyUser(request);
    const { shipmentId, tax_rate = 0, discount_amount = 0, payment_terms = 'Net 30' } = await request.json();
    console.log('Received body:', { shipmentId, tax_rate, discount_amount, payment_terms });

    // 1. Fetch shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', Number(shipmentId))
      .single();
    if (shipmentError || !shipment) {
      console.log('Shipment not found:', shipmentError);
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // 2. Fetch sales order
    const { data: salesOrder, error: salesOrderError } = await supabase
      .from('sales_orders')
      .select('*')
      .eq('id', shipment.sales_order_id)
      .single();
    if (salesOrderError || !salesOrder) {
      console.log('Sales order not found:', salesOrderError);
      return NextResponse.json({ error: 'Sales order not found' }, { status: 404 });
    }

    // 3. Fetch quote line items (via quote_id on sales order)
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('quote_line_items')
      .select('*')
      .eq('quote_id', salesOrder.quote_id);
    if (lineItemsError) {
      console.log('Line items error:', lineItemsError);
      return NextResponse.json({ error: 'Failed to fetch line items' }, { status: 500 });
    }

    // 4. Calculate subtotal
    const subtotal = (lineItems || []).reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0);

    // 5. Calculate total
    const tax = subtotal * (tax_rate / 100);
    const total = subtotal + tax - discount_amount;

    // 6. Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{
        shipment_id: shipment.id,
        customer_name: shipment.customer_name,
        invoice_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Net 30
        subtotal_amount: subtotal,
        tax_rate,
        discount_amount,
        total_amount: total,
        payment_terms,
        status: 'Pending',
        user_id: userId,
      }])
      .select()
      .single();

    if (invoiceError) {
      return NextResponse.json({ error: invoiceError.message }, { status: 500 });
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error('Error in /api/invoices/create:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 