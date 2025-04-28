import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { verifyUser } from '@/lib/authMiddleware';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const userId = await verifyUser(request);
    const { text } = await request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert quoting assistant. Given the raw text of an RFQ, extract the list of requested materials and summarize it in structured JSON format. 
          The JSON should have this structure:
          {
            "materials": [
              {
                "name": string,
                "grade": string (optional),
                "dimensions": {
                  "length": number (optional),
                  "width": number (optional),
                  "thickness": number (optional)
                },
                "quantity": number (optional),
                "notes": string (optional)
              }
            ],
            "customer": string (optional),
            "dueDate": string (optional),
            "notes": string (optional)
          }
          Only include fields that are explicitly mentioned in the RFQ. Do not guess or infer missing information.
          IMPORTANT: Your response must be valid JSON and nothing else. Do not include any explanatory text.`,
        },
        {
          role: "user",
          content: text,
        }
      ],
    });

    // Parse the JSON response
    const parsedResponse = JSON.parse(response.choices[0].message.content || '{}');
    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('Error parsing RFQ:', error);
    return NextResponse.json(
      { error: 'Failed to parse RFQ' },
      { status: 500 }
    );
  }
} 