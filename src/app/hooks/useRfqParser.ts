import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface RfqSummary {
  materials: Array<{
    name: string;
    grade?: string;
    dimensions?: {
      length?: number;
      width?: number;
      thickness?: number;
    };
    quantity?: number;
    notes?: string;
  }>;
  customer?: string;
  dueDate?: string;
  notes?: string;
}

export function useRfqParser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<RfqSummary | null>(null);
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);

  useEffect(() => {
    const loadPdfjs = async () => {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
      const worker = await import('pdfjs-dist/legacy/build/pdf.worker.entry');
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      setPdfjsLib(pdfjs);
    };
    loadPdfjs();
  }, []);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    if (!pdfjsLib) {
      throw new Error('PDF.js is not loaded yet');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      return fullText;
    } catch (err) {
      console.error('Error extracting text from PDF:', err);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const parseRfq = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!pdfjsLib) {
        throw new Error('PDF.js is not loaded yet');
      }

      // Extract text from PDF
      const rawPdfText = await extractTextFromPdf(file);

      // Send to API route for parsing
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('No access token found. Please log in.');
      const response = await fetch('/api/parse-rfq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text: rawPdfText }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse RFQ');
      }

      const parsedSummary = await response.json();
      setSummary(parsedSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while parsing the RFQ');
      console.error('Error parsing RFQ:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    parseRfq,
    summary,
    isLoading,
    error
  };
} 