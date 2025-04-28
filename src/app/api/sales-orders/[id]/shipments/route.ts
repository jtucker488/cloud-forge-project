import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/authMiddleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyUser(request);
    
    // First verify the sales order belongs to the user
    const { data: salesOrder, error: salesOrderError } = await supabase
      .from('sales_orders')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single();

    if (salesOrderError || !salesOrder) {
      return NextResponse.json({ error: 'Sales order not found or unauthorized' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('sales_order_id', params.id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return error;
  }
} 