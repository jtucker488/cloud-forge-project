import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyUser } from '@/lib/authMiddleware';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing inventory item id' }, { status: 400 });
  }
  const { error } = await supabase.from('inventory').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing inventory item id' }, { status: 400 });
  }
  const userId = await verifyUser(request);
  const body = await request.json();
  // Only allow update if the inventory item belongs to the user
  const { data: existing, error: fetchError } = await supabase
    .from('inventory')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Inventory item not found or unauthorized' }, { status: 404 });
  }
  const { error } = await supabase
    .from('inventory')
    .update({
      material_id: body.material_id,
      length: body.length,
      width: body.width,
      thickness: body.thickness,
      grade_id: body.grade_id,
      price: body.price,
      stock: body.stock,
      on_hand_quantity: body.on_hand_quantity,
      allocated_quantity: body.allocated_stock,
    })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}