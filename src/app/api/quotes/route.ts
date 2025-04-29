import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyUser } from "@/lib/authMiddleware";


export async function GET(request: Request) {
  try {
    const userId = await verifyUser(request);

    const { data: quotes, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(quotes);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyUser(request);
    const body = await request.json();
    const { customer_name, status, notes, line_items } = body;

    // 1. Insert the quote (without line_items)
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        customer_name,
        status,
        notes,
        user_id: userId,
      })
      .select()
      .single();

    if (quoteError) throw quoteError;

    // 2. Insert line items with the new quote's id
    if (Array.isArray(line_items) && line_items.length > 0) {
      const itemsToInsert = line_items.map((item) => ({
        ...item,
        quote_id: quote.id,
        user_id: userId,
      }));
      const { error: lineItemsError } = await supabase
        .from("quote_line_items")
        .insert(itemsToInsert);
      if (lineItemsError) throw lineItemsError;
    }

    // 3. Optionally, sum the line item subtotals and update the quote's total_price
    let total_price = 0;
    if (Array.isArray(line_items) && line_items.length > 0) {
      total_price = line_items.reduce(
        (sum, item) => sum + (item.subtotal_price || 0),
        0
      );
      await supabase
        .from("quotes")
        .update({ total_price })
        .eq("id", quote.id)
        .eq("user_id", userId);
    }

    // 4. Return the created quote and its line items
    return NextResponse.json({
      ...quote,
      line_items: line_items || [],
      total_price,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
