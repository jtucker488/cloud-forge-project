import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const material = segments[segments.length - 2]; // Get the `[material]` param

    const materialId = Number(material);
    if (isNaN(materialId)) {
      return NextResponse.json({ error: 'Invalid material ID' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('material_id', materialId)
      .order('grade_label', { ascending: true });

    if (error) {
      console.error('Error fetching grades by material:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in grades by material API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}