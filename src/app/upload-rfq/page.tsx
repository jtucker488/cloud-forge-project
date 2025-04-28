'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/app/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Upload, FileText } from 'lucide-react';
import { selectInventory, InventoryItem } from '@/app/redux/slices/inventorySlice';
import { addItem, clearQuote } from '@/app/redux/slices/quoteSlice';
import { selectMaterialMap } from '@/app/redux/slices/materialsSlice';
import { selectGradeMap } from '@/app/redux/slices/gradesSlice';
import { createAIDraftQuote, ParsedRfqItem } from '@/lib/services/openai';
import { usePdfParser } from '@/lib/hooks/usePdfParser';
import RfqSummary from '@/components/ui/RfqSummary';
import pdfjsLib from 'pdfjs-dist';
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

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ') + '\\n';
  }
  return text;
}

export default function UploadRFQPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const inventory = useSelector(selectInventory);
  const materialMap = useSelector(selectMaterialMap);
  const gradeMap = useSelector(selectGradeMap);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<RfqSummary | null>(null);
  const { parseFile, parsedText } = usePdfParser();
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.includes('pdf')) {
      setError('Please upload a PDF file');
      return;
    }

    setFileName(file.name);
    await processFile(file);
  }, []);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setSummary(null);

    try {
      const text = await extractTextFromPDF(file);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('No access token found. Please log in.');
      const response = await fetch('/api/parse-rfq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text }),
      });
      const summary = await response.json();
      setSummary(summary);
    } catch (err) {
      setError('Failed to process RFQ. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    await processFile(file);
  };

  const handleBuildManually = () => {
    if (summary) {
      // Clear the quote cart
      dispatch(clearQuote());
      
      // Convert material names to IDs and grade names to IDs
      const processedSummary = {
        ...summary,
        materials: summary.materials.map(material => {
          // Find material ID from name
          const materialId = Object.entries(materialMap).find(
            ([id, name]) => name.toLowerCase() === material.name.toLowerCase()
          )?.[0] || '';

          // Find grade ID from name
          const gradeId = material.grade ? Object.entries(gradeMap).find(
            ([id, name]) => name.toLowerCase() === material.grade?.toLowerCase()
          )?.[0] || '' : '';

          return {
            ...material,
            material_id: materialId,
            grade_id: gradeId
          };
        })
      };

      // Pass the processed RFQ summary to the build quote page
      router.push(`/build-quote?rfqSummary=${encodeURIComponent(JSON.stringify(processedSummary))}`);
    }
  };

  const handleBuildWithAI = async () => {
    if (!summary) return;

    try {
      setIsAIProcessing(true);
      setError(null);

      // Convert RFQ items to the format expected by the AI service
      const parsedRfqs = summary.materials.map(material => ({
        material_name: material.name,
        grade: material.grade || '',
        dimensions: material.dimensions
          ? `L: ${material.dimensions.length || 0}, W: ${material.dimensions.width || 0}, T: ${material.dimensions.thickness || 0}`
          : '',
        quantity: material.quantity || 1
      }));

      // Get AI suggestions
      const aiDraft = await createAIDraftQuote(parsedRfqs, inventory);

      // Clear the quote cart first
      dispatch(clearQuote());

      // Convert AI suggestions to quote items and add them to the cart
      aiDraft.forEach(item => {
        // Find material ID from name
        const materialId = Object.entries(materialMap).find(
          ([id, name]) => name.toLowerCase() === item.material_name.toLowerCase()
        )?.[0] || '';

        // Find grade ID from name
        const gradeId = Object.entries(gradeMap).find(
          ([id, name]) => name.toLowerCase() === item.grade.toLowerCase()
        )?.[0] || '';

        dispatch(addItem({
          id: Math.random().toString(36).substr(2, 9),
          material_id: materialId,
          material_name: item.material_name,
          grade_name: item.grade,
          length: parseFloat(item.dimensions.match(/L:\s*(\d+)/)?.[1] || '0'),
          width: parseFloat(item.dimensions.match(/W:\s*(\d+)/)?.[1] || '0'),
          thickness: parseFloat(item.dimensions.match(/T:\s*(\d+\.?\d*)/)?.[1] || '0'),
          quantity: item.available_quantity || 0,
          notes: item.notes || `Original request: ${item.requested_quantity} units. ${item.match_status === 'substitute' ? 'Substituted with available stock.' : ''}`
        }));
      });

      // Process the summary to include material and grade IDs
      const processedSummary = {
        ...summary,
        materials: summary.materials.map(material => {
          // Find material ID from name
          const materialId = Object.entries(materialMap).find(
            ([id, name]) => name.toLowerCase() === material.name.toLowerCase()
          )?.[0] || '';

          // Find grade ID from name
          const gradeId = material.grade ? Object.entries(gradeMap).find(
            ([id, name]) => name.toLowerCase() === material.grade?.toLowerCase()
          )?.[0] || '' : '';

          return {
            ...material,
            material_id: materialId,
            grade_id: gradeId
          };
        })
      };

      // Navigate to build quote page with the RFQ summary
      router.push(`/build-quote?rfqSummary=${encodeURIComponent(JSON.stringify(processedSummary))}`);
    } catch (error) {
      console.error('Error building quote with AI:', error);
      setError('Failed to build quote with AI. Please try again.');
    } finally {
      setIsAIProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Upload RFQ</h1>
      
      <Card className="p-8 shadow-lg">
        <div className="space-y-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <Upload className="h-12 w-12 text-gray-400" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragging ? 'Drop your file here' : 'Drag and drop your RFQ PDF here'}
                </p>
                <p className="text-sm text-gray-500">or</p>
                <div className="relative">
                  <Input
                    id="rfq"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                    className="hidden"
                  />
                  <Label
                    htmlFor="rfq"
                    className="flex items-center justify-center cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Choose File
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {fileName && (
            <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-md">
              <FileText className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">{fileName}</span>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-blue-600 py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-medium">Processing RFQ...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="animate-in fade-in">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      {/* Summary Display */}
      {summary && (
        <div className="mt-8 animate-in fade-in">
          <RfqSummary
            summary={summary}
            onBuildManually={handleBuildManually}
            onBuildWithAI={handleBuildWithAI}
            isAIProcessing={isAIProcessing}
          />
        </div>
      )}
    </div>
  );
} 