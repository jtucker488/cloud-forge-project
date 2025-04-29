import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from '@/lib/authMiddleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PATCH(
  request: NextRequest,
  context: any
) {
  try {
    const userId = await verifyUser(request);
    const { shipmentId } = context.params;
    const updates = await request.json();

    if (updates.freight_cost !== undefined && updates.freight_cost < 0) {
      return NextResponse.json({ error: 'Freight cost must be positive' }, { status: 400 });
    }

    const { data: existingShipment, error: fetchError } = await supabase
      .from('shipments')
      .select('id')
      .eq('id', shipmentId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingShipment) {
      return NextResponse.json({ error: 'Shipment not found or unauthorized' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('shipments')
      .update({
        planned_ship_date: updates.planned_ship_date,
        actual_ship_date: updates.actual_ship_date,
        freight_cost: updates.freight_cost,
        carrier: updates.carrier,
        tracking_number: updates.tracking_number,
        shipping_address: updates.shipping_address,
        status: updates.status,
        user_id: userId,
      })
      .eq('id', shipmentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating shipment:', error);
    return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const userId = await verifyUser(request);
    const { shipmentId } = context.params;

    const { data: shipment, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .eq('user_id', userId)
      .single();

    if (error || !shipment) {
      return NextResponse.json({ error: 'Shipment not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json(shipment);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    return NextResponse.json({ error: 'Failed to fetch shipment' }, { status: 500 });
  }
}