import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyUser } from "@/lib/authMiddleware";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(
  request: Request,
  context: any // <--- same here
) {
  try {
    const userId = await verifyUser(request);

    const quoteId = Number(context.params.id);
    console.log("[ACCEPT] quoteId:", quoteId);

    if (isNaN(quoteId)) {
      return NextResponse.json(
        { error: "Invalid quoteId parameter" },
        { status: 400 }
      );
    }
    // Parse payment_terms and delivery_terms from the request body
    const body = await request.json();
    const payment_terms = body.payment_terms || "Net 30";
    const delivery_terms = body.delivery_terms || "";
    console.log("[ACCEPT] payment_terms:", payment_terms);
    console.log("[ACCEPT] delivery_terms:", delivery_terms);

    // 1. Update quote status to 'accepted'
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .update({ status: "accepted" })
      .eq("id", quoteId)
      .select()
      .single();
    console.log("[ACCEPT] quote update result:", quote, quoteError);
    if (quoteError || !quote) {
      console.log(
        "[ACCEPT] Failed to update quote status:",
        quoteError?.message
      );
      return NextResponse.json(
        { error: quoteError?.message || "Failed to update quote status" },
        { status: 500 }
      );
    }

    // 2. Get quote line items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("quote_line_items")
      .select("*")
      .eq("quote_id", quoteId);
    console.log("[ACCEPT] lineItems:", lineItems, lineItemsError);
    if (lineItemsError) {
      console.log(
        "[ACCEPT] Failed to fetch quote line items:",
        lineItemsError.message
      );
      return NextResponse.json(
        { error: "Failed to fetch quote line items" },
        { status: 500 }
      );
    }

    // 3. Create sales order
    const { data: salesOrder, error: salesOrderError } = await supabase
      .from("sales_orders")
      .insert([
        {
          quote_id: quote.id,
          customer_name: quote.customer_name,
          created_at: new Date().toISOString(),
          status: "pending",
          total_price: quote.total_price,
          payment_terms,
          delivery_terms,
          user_id: userId,
        },
      ])
      .select()
      .single();
    console.log("[ACCEPT] salesOrder:", salesOrder, salesOrderError);
    if (salesOrderError || !salesOrder) {
      console.log(
        "[ACCEPT] Failed to create sales order:",
        salesOrderError?.message
      );
      return NextResponse.json(
        { error: "Failed to create sales order" },
        { status: 500 }
      );
    }

    // 4. Create draft shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .insert([
        {
          sales_order_id: salesOrder.id,
          customer_name: quote.customer_name,
          status: "pending",
          created_at: new Date().toISOString(),
          user_id: userId,
        },
      ])
      .select()
      .single();
    console.log("[ACCEPT] shipment:", shipment, shipmentError);
    if (shipmentError || !shipment) {
      console.log(
        "[ACCEPT] Failed to create shipment:",
        shipmentError?.message
      );
      return NextResponse.json(
        { error: "Failed to create shipment" },
        { status: 500 }
      );
    }

    // 5. Adjust inventory for each line item
    for (const item of lineItems) {
      console.log("[ACCEPT] Processing line item:", item);
      // Parse dimensions string (e.g., 'L: 3, W: 3, T: 3')
      let length, width, thickness;
      if (item.dimensions) {
        const match = item.dimensions.match(
          /L:\s*(\d+\.?\d*),\s*W:\s*(\d+\.?\d*),\s*T:\s*(\d+\.?\d*)/
        );
        if (match) {
          length = Number(match[1]);
          width = Number(match[2]);
          thickness = Number(match[3]);
        }
      }
      // 1. Look up grade_id from grades table
      const { data: gradeRow, error: gradeLookupError } = await supabase
        .from("grades")
        .select("id")
        .eq("material_id", item.material_id)
        .eq("grade_label", item.grade)
        .single();

      if (gradeLookupError || !gradeRow) {
        console.log(
          "[ACCEPT] Grade not found for material_id",
          item.material_id,
          "grade",
          item.grade
        );
        return NextResponse.json(
          {
            error: `Grade not found for material_id ${item.material_id}, grade ${item.grade}`,
          },
          { status: 500 }
        );
      }
      const grade_id = gradeRow.id;
      console.log("[ACCEPT] grade_id:", grade_id);
      console.log("material_id", item.material_id);

      // 2. Now look up inventory with material_id, grade_id, user_id, and dimensions
      let inventoryQuery = supabase
        .from("inventory")
        .select("*")
        .eq("material_id", item.material_id)
        .eq("grade_id", grade_id)
        .eq("user_id", userId);
      if (length !== undefined)
        inventoryQuery = inventoryQuery.eq("length", length);
      if (width !== undefined)
        inventoryQuery = inventoryQuery.eq("width", width);
      if (thickness !== undefined)
        inventoryQuery = inventoryQuery.eq("thickness", thickness);
      const { data: inventory, error: inventoryError } =
        await inventoryQuery.single();
      console.log("[ACCEPT] inventory:", inventory, inventoryError);
      if (inventoryError || !inventory) {
        console.log(
          "[ACCEPT] Inventory not found for material_id",
          item.material_id,
          "grade_id",
          grade_id,
          "user_id",
          userId,
          "length",
          length,
          "width",
          width,
          "thickness",
          thickness
        );
        return NextResponse.json(
          {
            error: `Inventory not found for material_id ${item.material_id}, grade_id ${grade_id}, user_id ${userId}, length ${length}, width ${width}, thickness ${thickness}`,
          },
          { status: 500 }
        );
      }

      // Update inventory
      const { error: updateError } = await supabase
        .from("inventory")
        .update({
          on_hand_quantity: inventory.on_hand_quantity - item.quantity,
          allocated_quantity:
            (inventory.allocated_quantity || 0) + item.quantity,
        })
        .eq("id", inventory.id);
      console.log("[ACCEPT] inventory update result:", updateError);
      if (updateError) {
        console.log(
          "[ACCEPT] Failed to update inventory for material_id",
          item.material_id,
          "grade_id",
          grade_id,
          "user_id",
          userId,
          "length",
          length,
          "width",
          width,
          "thickness",
          thickness,
          updateError.message
        );
        return NextResponse.json(
          {
            error: `Failed to update inventory for material_id ${item.material_id}, grade_id ${grade_id}, user_id ${userId}, length ${length}, width ${width}, thickness ${thickness}`,
          },
          { status: 500 }
        );
      }
    }

    console.log("[ACCEPT] Success!");
    return NextResponse.json({
      message:
        "Quote accepted, sales order and shipment created, inventory adjusted",
      salesOrder,
      shipment,
    });
  } catch (err) {
    console.error("Error in /api/quotes/[id]/accept:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
