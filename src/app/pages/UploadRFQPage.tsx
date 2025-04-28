"use client";
import React, { useCallback } from 'react';
import { useRfqParser } from '@/app/hooks/useRfqParser';
import RfqSummary from '@/components/ui/RfqSummary';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/app/store';
import { addItem } from '@/app/redux/slices/quoteSlice';
import { createAIDraftQuote } from '@/lib/services/openai';
import { selectInventory } from '@/app/redux/slices/inventorySlice';
import { useSelector } from 'react-redux';

export default function UploadRFQPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const inventory = useSelector(selectInventory);
  const { parseRfq, summary, isLoading, error } = useRfqParser();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      await parseRfq(file);
    }
  }, [parseRfq]);

  const handleBuildManually = () => {
    // Convert RFQ items to quote items and add them to the cart
    if (summary) {
      summary.materials.forEach(material => {
        dispatch(addItem({
          id: Math.random().toString(36).substr(2, 9),
          material_id: '', // We'll need to get this from the inventory
          material_name: material.name,
          grade_name: material.grade || '',
          length: material.dimensions?.length,
          width: material.dimensions?.width,
          thickness: material.dimensions?.thickness,
          quantity: material.quantity || 1,
          notes: material.notes || ''
        }));
      });
    }
  };

  const handleBuildWithAI = async () => {
    if (!summary) return;

    try {
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

      // Convert AI suggestions to quote items and add them to the cart
      aiDraft.forEach(item => {
        dispatch(addItem({
          id: Math.random().toString(36).substr(2, 9),
          material_id: '', // We'll need to get this from the inventory
          material_name: item.material_name,
          grade_name: item.grade,
          length: parseFloat(item.dimensions.match(/L:\s*(\d+)/)?.[1] || '0'),
          width: parseFloat(item.dimensions.match(/W:\s*(\d+)/)?.[1] || '0'),
          thickness: parseFloat(item.dimensions.match(/T:\s*(\d+\.?\d*)/)?.[1] || '0'),
          quantity: item.requested_quantity,
          notes: item.notes
        }));
      });
    } catch (error) {
      console.error('Error building quote with AI:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Upload RFQ</h1>
      </div>

      {/* File Upload Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload PDF RFQ
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF up to 10MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Processing RFQ...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error processing RFQ</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Display */}
      {summary && (
        <RfqSummary
          summary={summary}
          onBuildManually={handleBuildManually}
          onBuildWithAI={handleBuildWithAI}
        />
      )}
    </div>
  );
} 