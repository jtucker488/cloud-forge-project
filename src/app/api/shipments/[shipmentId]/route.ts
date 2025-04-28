import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from '@/lib/authMiddleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PATCH(
  request: Request,
  { params }: { params: { shipmentId: string } }
) {
  try {
    console.log('PATCH /api/shipments/[shipmentId] called');
    const userId = await verifyUser(request);
    console.log('Verified userId:', userId);
    const { shipmentId } = params;
    console.log('shipmentId param:', shipmentId);
    const updates = await request.json();
    console.log('Received updates:', updates);

    // Validate the updates
    if (updates.freight_cost !== undefined && updates.freight_cost < 0) {
      console.log('Invalid freight_cost:', updates.freight_cost);
      return NextResponse.json(
        { error: 'Freight cost must be a positive number' },
        { status: 400 }
      );
    }

    // First verify the shipment belongs to the user
    const { data: existingShipment, error: fetchError } = await supabase
      .from('shipments')
      .select('id')
      .eq('id', shipmentId)
      .eq('user_id', userId)
      .single();
    console.log('Fetched existingShipment:', existingShipment, 'fetchError:', fetchError);

    if (fetchError || !existingShipment) {
      console.log('Shipment not found or unauthorized');
      return NextResponse.json({ error: 'Shipment not found or unauthorized' }, { status: 404 });
    }

    // Update the shipment
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
    console.log('Update result data:', data, 'error:', error);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to update shipment' },
      { status: 500 }
    );
  }
} 
export async function GET(
  request: Request,
  { params }: { params: { shipmentId: string } }
) {
  try {
    console.log('GET /api/shipments/[shipmentId] called');
    const userId = await verifyUser(request);
    console.log('Verified userId:', userId);
    const { shipmentId } = params;
    console.log('shipmentId param:', shipmentId);

    // Fetch the shipment and ensure it belongs to the user
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .eq('user_id', userId)
      .single();
    console.log('Fetched shipment:', shipment, 'error:', error);

    if (error || !shipment) {
      console.log('Shipment not found or unauthorized');
      return NextResponse.json({ error: 'Shipment not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json(shipment);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipment' },
      { status: 500 }
    );
  }
}