// src/app/api/materials/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyUser } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  try {
    const userId = await verifyUser(request);
    
    const { data, error } = await supabase
      .from('materials')
      .select('*')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return error;
  }
}