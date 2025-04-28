import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function verifyUser(request: Request): Promise<string> {
  // Get the Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new NextResponse(
      JSON.stringify({ error: 'Missing or invalid Authorization header' }),
      { status: 401 }
    );
  }

  // Extract the token
  const token = authHeader.replace('Bearer ', '').trim();

  // Verify the token with Supabase
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data?.user) {
    throw new NextResponse(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401 }
    );
  }

  // Return the user ID
  return data.user.id;
}

export async function GET(request: Request) {
  try {
    const userId = await verifyUser(request);
    // ... rest of your code
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error; // This will return the 401 as set in verifyUser
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 