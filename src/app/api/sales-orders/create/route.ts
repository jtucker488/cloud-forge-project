import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/authMiddleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const userId = await verifyUser(request);
    const body = await request.json();
    const { quote_id, customer_name, total_price, payment_terms, delivery_terms } = body;

    const parsedQuoteId = parseInt(quote_id, 10);
    const parsedTotalPrice = parseFloat(total_price);

    if (isNaN(parsedQuoteId) || isNaN(parsedTotalPrice)) {
      return NextResponse.json({ error: 'Invalid quote_id or total_price' }, { status: 400 });
    }

    // Verify the quote belongs to the user
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id')
      .eq('id', parsedQuoteId)
      .eq('user_id', userId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found or unauthorized' }, { status: 404 });
    }

    // Insert into sales_orders
    const { data: salesOrder, error: salesOrderError } = await supabase
      .from('sales_orders')
      .insert([{
        quote_id: parsedQuoteId,
        customer_name,
        total_price: parsedTotalPrice,
        payment_terms,
        delivery_terms,
        user_id: userId,
        status: 'pending',
      }])
      .select()
      .single();

    if (salesOrderError) {
      return NextResponse.json({ error: salesOrderError.message }, { status: 500 });
    }

    // Insert a draft shipment linked to the new sales order
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert([{
        sales_order_id: salesOrder.id,
        customer_name,
        status: 'pending',
        user_id: userId,
      }])
      .select()
      .single();

    if (shipmentError) {
      return NextResponse.json({ error: shipmentError.message }, { status: 500 });
    }

    return NextResponse.json({ salesOrder, shipment });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}