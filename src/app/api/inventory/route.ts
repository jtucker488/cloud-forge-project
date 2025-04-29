import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyUser } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  try {
    const userId = await verifyUser(request);
    
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await verifyUser(request);
    const body = await request.json();
    
    if (!body.material || !body.grade || !body.length || !body.width || !body.thickness) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const inventoryData = {
      material_id: Number(body.material),
      grade_id: Number(body.grade),
      length: Number(body.length),
      width: Number(body.width),
      thickness: Number(body.thickness),
      default_price: Number(body.default_price) || 0,
      on_hand_quantity: Number(body.stock) || 0,
      allocated_quantity: Number(body.allocated_stock) || 0,
      user_id: userId
    };

    const { data: gradeData, error: gradeError } = await supabase
      .from('grades')
      .select('id, material_id')
      .eq('id', inventoryData.grade_id)
      .single();

    if (gradeError || !gradeData || gradeData.material_id !== inventoryData.material_id) {
      return NextResponse.json({ error: 'Invalid grade selection' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('inventory')
      .insert([inventoryData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await verifyUser(request);
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json({ error: 'Missing inventory item id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}