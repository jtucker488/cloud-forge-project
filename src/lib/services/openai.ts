import { InventoryItem } from '@/app/redux/slices/inventorySlice';
import { supabase } from '@/lib/supabase';

export interface ParsedRfqItem {
  material_name: string;
  grade: string;
  dimensions: string;
  quantity: number;
}

export interface AIDraftQuoteItem {
  material_name: string;
  grade: string;
  dimensions: string;
  requested_quantity: number;
  available_quantity: number;
  match_status: 'exact' | 'substitute';
  notes: string;
}

export async function createAIDraftQuote(
  parsedRfqs: ParsedRfqItem[],
  inventoryList: InventoryItem[]
): Promise<AIDraftQuoteItem[]> {
  try {
    console.log('=== AI Draft Quote Request ===');
    console.log('Parsed RFQs:', JSON.stringify(parsedRfqs, null, 2));
    console.log('Inventory List:', JSON.stringify(inventoryList, null, 2));
    console.log('=============================');

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error('No access token found. Please log in.');

    const response = await fetch('/api/ai-draft-quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ parsedRfqs, inventoryList }),
    });

    console.log('=== AI Draft Quote Response ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    const data = await response.json();

    if (!response.ok) {
      console.error('API Error:', JSON.stringify(data, null, 2));
      throw new Error(
        data.error + (data.details ? `: ${data.details}` : '')
      );
    }

    // Validate the response structure
    if (!data || !Array.isArray(data.items)) {
      console.error('Invalid response structure:', JSON.stringify(data, null, 2));
      throw new Error('Invalid response format: expected an object with items array');
    }

    console.log('AI Draft Items:', JSON.stringify(data.items, null, 2));
    console.log('=============================');

    return data.items as AIDraftQuoteItem[];
  } catch (error: any) {
    // Log the full error details
    console.error('=== Error in createAIDraftQuote ===');
    console.error('Message:', error.message);
    console.error('Error:', JSON.stringify(error, null, 2));
    console.error('=============================');
    
    // Provide more specific error messages
    if (error.message.includes('Failed to parse OpenAI response')) {
      throw new Error('The AI generated an invalid response. Please try again.');
    } else if (error.message.includes('Invalid response format')) {
      throw new Error('Received invalid data format from the server. Please try again.');
    }
    
    throw error;
  }
} 