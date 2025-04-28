import { NextRequest, NextResponse } from "next/server";
import OpenAI from 'openai';
import { verifyUser } from '@/lib/authMiddleware';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  console.log('=== AI Draft Quote API Route Called ===');
  console.log('Request received at:', new Date().toISOString());
  
  try {
    const userId = await verifyUser(req);
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { parsedRfqs, inventoryList } = body;

    if (!parsedRfqs || !inventoryList) {
      console.error('Missing required data:', { parsedRfqs, inventoryList });
      return NextResponse.json(
        { error: 'Missing required data in request body' },
        { status: 400 }
      );
    }

    // Filter inventory list to only include items owned by the user
    const userInventoryList = inventoryList.filter((item: any) => item.user_id === userId);

    const inventoryContext = userInventoryList.map((item: any) => {
      return `- ${item.material_name} | Grade: ${item.grade_name} | Dimensions: ${[
        item.length && `L: ${item.length}`,
        item.width && `W: ${item.width}`,
        item.thickness && `T: ${item.thickness}`
      ].filter(Boolean).join(', ')} | Available: ${item.on_hand_quantity}`;
    }).join('\n');

    const rfqContext = parsedRfqs.map((item: any) => {
      return `- ${item.material_name} | Grade: ${item.grade} | Dimensions: ${item.dimensions} | Requested Quantity: ${item.quantity}`;
    }).join('\n');

    console.log("=== RFQ Context ===");
    console.log(rfqContext);
    console.log("=== Inventory Context ===");
    console.log(inventoryContext);
    console.log("=========================");

    const prompt = `
You are an expert quoting assistant at a Metal Service Center.

You will receive two inputs:
- Customer's RFQ (Request for Quote)
- Current Inventory Availability

Your job:
1. For each requested item in the RFQ, suggest the closest available item from the inventory list provided.
2. If an exact match is available (same material name, grade, and dimensions), mark it as "exact".
3. If only a similar item is available (e.g., same material and grade, but different dimensions), mark it as "substitute" and explain the difference in 'notes'.
4. If nothing is even close, omit the item from the output.

=== Customer RFQ ===
${rfqContext}

=== Current Inventory ===
${inventoryContext}

Return the output as structured JSON like this:
[
  {
    "material_name": "...",
    "grade": "...",
    "dimensions": "...",
    "requested_quantity": ...,
    "available_quantity": ...,
    "match_status": "exact" | "substitute",
    "notes": "..."
  },
  ...
]
IMPORTANT: Only include items that are available in inventory. If you suggest a substitute, clearly explain why in 'notes'.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: [
        { 
          role: "system", 
          content: "You are a quoting assistant helping match RFQs to inventory. You must return a valid JSON object with an 'items' array containing the matches."
        },
        { 
          role: "user", 
          content: prompt + "\n\nIMPORTANT: Your response must be a JSON object with this exact structure:\n{\n  \"items\": [...array of matches...]\n}" 
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    console.log("OpenAI raw response:", JSON.stringify(response, null, 2));
    console.log("OpenAI message content:", response.choices[0]?.message?.content);

    const aiDraft = response.choices[0]?.message?.content;
    if (!aiDraft) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      );
    }

    try {
      const parsedResponse = JSON.parse(aiDraft);
      
      // Validate the response structure
      if (!parsedResponse || typeof parsedResponse !== 'object') {
        return NextResponse.json(
          { 
            error: 'Invalid response format from OpenAI', 
            details: 'Expected a JSON object',
            response: parsedResponse 
          },
          { status: 500 }
        );
      }

      if (!Array.isArray(parsedResponse.items)) {
        return NextResponse.json(
          { 
            error: 'Invalid response format from OpenAI', 
            details: 'Response missing items array',
            response: parsedResponse 
          },
          { status: 500 }
        );
      }

      // Validate each item in the array has the required fields
      const validItems = parsedResponse.items.every((item: any) => 
        item.material_name &&
        item.grade &&
        item.dimensions &&
        typeof item.requested_quantity === 'number' &&
        typeof item.available_quantity === 'number' &&
        (item.match_status === 'exact' || item.match_status === 'substitute') &&
        typeof item.notes === 'string'
      );

      if (!validItems) {
        return NextResponse.json(
          { 
            error: 'Invalid response format from OpenAI', 
            details: 'One or more items missing required fields',
            response: parsedResponse 
          },
          { status: 500 }
        );
      }

      return NextResponse.json(parsedResponse);
    } catch (parseError: unknown) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      return NextResponse.json(
        { 
          error: 'Failed to parse OpenAI response as JSON', 
          details: aiDraft,
          parseError: errorMessage 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Always return a Response, not the error object directly
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in AI Draft Quote API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
} 