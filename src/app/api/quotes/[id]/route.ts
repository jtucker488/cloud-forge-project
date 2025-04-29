import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/authMiddleware';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1]; // ⚡ Get last segment

    const quoteId = Number(id);
    if (isNaN(quoteId)) {
      return NextResponse.json({ error: 'Invalid quote ID' }, { status: 400 });
    }

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();
    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const { data: line_items, error: lineItemsError } = await supabase
      .from('quote_line_items')
      .select('*')
      .eq('quote_id', quoteId);
    if (lineItemsError) {
      return NextResponse.json({ error: 'Failed to fetch line items' }, { status: 500 });
    }

    return NextResponse.json({ ...quote, line_items });
  } catch (err) {
    console.error('Error fetching quote:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await verifyUser(request);

    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1]; // ⚡

    const body = await request.json();

    // Verify the quote belongs to the user
    const { data: existingQuote, error: fetchError } = await supabase
      .from("quotes")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingQuote) {
      return NextResponse.json(
        { error: "Quote not found or unauthorized" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("quotes")
      .update({ ...body, user_id: userId })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}