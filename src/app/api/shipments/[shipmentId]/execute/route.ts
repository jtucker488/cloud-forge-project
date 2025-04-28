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
      const userId = await verifyUser(request);
      const shipmentId = Number(params.shipmentId);
      console.log('[PATCH] shipmentId:', shipmentId);
  
      // 1. Find the shipment
      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', shipmentId)
        .single();
      console.log('[PATCH] shipment:', shipment, 'shipmentError:', shipmentError);
      if (shipmentError || !shipment) {
        return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
      }
  
      // 2. Find the sales order
      const { data: salesOrder, error: salesOrderError } = await supabase
        .from('sales_orders')
        .select('*')
        .eq('id', shipment.sales_order_id)
        .single();
      console.log('[PATCH] salesOrder:', salesOrder, 'salesOrderError:', salesOrderError);
      if (salesOrderError || !salesOrder) {
        return NextResponse.json({ error: 'Sales order not found' }, { status: 404 });
      }
  
      // 3. Find all quote_line_items for the sales order's quote_id
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('quote_line_items')
        .select('*')
        .eq('quote_id', salesOrder.quote_id);
      console.log('[PATCH] lineItems:', lineItems, 'lineItemsError:', lineItemsError);
      if (lineItemsError) {
        return NextResponse.json({ error: 'Failed to fetch quote line items' }, { status: 500 });
      }
  
      // 4. For each line item, decrease allocated_quantity in inventory
      for (const item of lineItems) {
        console.log('[PATCH] Processing line item:', item);
  
        // 1. Look up grade_id from grades table using material_id and grade label
        const { data: gradeRow, error: gradeLookupError } = await supabase
          .from('grades')
          .select('id')
          .eq('material_id', item.material_id)
          .eq('grade_label', item.grade) // item.grade is the label/name
          .single();
  
        if (gradeLookupError || !gradeRow) {
          console.log('[PATCH] Grade not found for material_id', item.material_id, 'grade', item.grade);
          return NextResponse.json({ error: `Grade not found for material_id ${item.material_id}, grade ${item.grade}` }, { status: 500 });
        }
        const grade_id = gradeRow.id;
        console.log('[PATCH] grade_id:', grade_id);
        // 2. Find the inventory item
        const { data: inventory, error: inventoryError } = await supabase
          .from('inventory')
          .select('*')
          .eq('material_id', item.material_id)
          .eq('grade_id', grade_id)
          .eq('user_id', userId)
          .single();
        console.log('[PATCH] inventory:', inventory, 'inventoryError:', inventoryError);
        if (inventoryError || !inventory) {
          return NextResponse.json({ error: `Inventory not found for material_id ${item.material_id}, grade_id ${grade_id}` }, { status: 500 });
        }
  
        // Decrease allocated_quantity
        const newAllocated = Math.max((inventory.allocated_quantity || 0) - item.quantity, 0);
        console.log('[PATCH] Updating inventory id:', inventory.id, 'newAllocated:', newAllocated);
        const { error: updateError } = await supabase
          .from('inventory')
          .update({ allocated_quantity: newAllocated })
          .eq('id', inventory.id);
        console.log('[PATCH] updateError:', updateError);
        if (updateError) {
          return NextResponse.json({ error: `Failed to update inventory for material_id ${item.material_id}, grade_id ${grade_id}` }, { status: 500 });
        }
      }
  
      console.log('[PATCH] Inventory adjusted after shipment execution');
      return NextResponse.json({ message: 'Inventory adjusted after shipment execution' });
    } catch (err) {
      console.error('Error in /api/shipments/[shipmentId]/execute:', err);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }