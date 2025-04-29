import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from '@/lib/authMiddleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PATCH(
  request: Request,
  context:any
) {
  try {
    const userId = await verifyUser(request);
    const shipmentId = Number(context.params.shipmentId);
    console.log('[PATCH] shipmentId:', shipmentId);

    // 1. Find the shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single();

    if (shipmentError || !shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // 2. Find the sales order
    const { data: salesOrder, error: salesOrderError } = await supabase
      .from('sales_orders')
      .select('*')
      .eq('id', shipment.sales_order_id)
      .single();

    if (salesOrderError || !salesOrder) {
      return NextResponse.json({ error: 'Sales order not found' }, { status: 404 });
    }

    // 3. Find all quote_line_items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('quote_line_items')
      .select('*')
      .eq('quote_id', salesOrder.quote_id);

    if (lineItemsError) {
      return NextResponse.json({ error: 'Failed to fetch quote line items' }, { status: 500 });
    }

    for (const item of lineItems) {
      const { data: gradeRow, error: gradeLookupError } = await supabase
        .from('grades')
        .select('id')
        .eq('material_id', item.material_id)
        .eq('grade_label', item.grade)
        .single();

      if (gradeLookupError || !gradeRow) {
        return NextResponse.json({ error: `Grade not found for material_id ${item.material_id}` }, { status: 500 });
      }

      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('material_id', item.material_id)
        .eq('grade_id', gradeRow.id)
        .eq('user_id', userId)
        .single();

      if (inventoryError || !inventory) {
        return NextResponse.json({ error: `Inventory not found for material_id ${item.material_id}` }, { status: 500 });
      }

      const newAllocated = Math.max((inventory.allocated_quantity || 0) - item.quantity, 0);

      const { error: updateError } = await supabase
        .from('inventory')
        .update({ allocated_quantity: newAllocated })
        .eq('id', inventory.id);

      if (updateError) {
        return NextResponse.json({ error: `Failed to update inventory for material_id ${item.material_id}` }, { status: 500 });
      }
    }

    return NextResponse.json({ message: 'Inventory adjusted after shipment execution' });
  } catch (err) {
    console.error('Error in /api/shipments/[shipmentId]/execute:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}