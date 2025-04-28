// src/app/api/grades/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/authMiddleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    // Only check authentication, don't filter by user
    await verifyUser(request);

    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .order('grade_label', { ascending: true });

    if (error) {
      console.error('Error fetching grades:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in grades API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}