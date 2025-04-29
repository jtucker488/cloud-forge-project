import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/authMiddleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: Request,
  context: any
) {
  try {
    const userId = await verifyUser(request);
    const salesOrderId = context.params.id;

    // First verify the sales order belongs to the user
    const { data: salesOrder, error: salesOrderError } = await supabase
      .from('sales_orders')
      .select('id')
      .eq('id', salesOrderId)
      .eq('user_id', userId)
      .single();

    if (salesOrderError || !salesOrder) {
      return NextResponse.json({ error: 'Sales order not found or unauthorized' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('sales_order_id', salesOrderId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}