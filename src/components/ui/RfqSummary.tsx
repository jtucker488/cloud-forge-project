import React from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

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

interface RfqSummaryProps {
  summary: RfqSummary;
  onBuildManually?: () => void;
  onBuildWithAI?: () => void;
  isAIProcessing?: boolean;
  onFileUpload?: (file: File) => void;
}

export default function RfqSummary({ 
  summary, 
  onBuildManually, 
  onBuildWithAI, 
  isAIProcessing = false,
  onFileUpload 
}: RfqSummaryProps) {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onFileUpload) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleBuildManually = () => {
    if (onBuildManually) {
      onBuildManually();
    } else {
      router.push('/build-quote');
    }
  };

  const handleBuildWithAI = () => {
    if (onBuildWithAI) {
      onBuildWithAI();
    } else {
      router.push('/build-quote?ai=true');
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      handleFileUpload({ target: { files: e.dataTransfer.files } } as any);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      handleFileUpload(e);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-4">
      {/* Header Information */}
      {(summary.customer || summary.dueDate) && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">RFQ Details</h2>
          <div className="grid grid-cols-2 gap-4">
            {summary.customer && (
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{summary.customer}</p>
              </div>
            )}
            {summary.dueDate && (
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-medium">{summary.dueDate}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Materials List */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Requested Materials</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dimensions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summary.materials.map((material, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {material.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {material.grade || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {material.dimensions
                      ? `${material.dimensions.length || '-'} x ${material.dimensions.width || '-'} x ${material.dimensions.thickness || '-'}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {material.quantity || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {material.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* General Notes */}
      {summary.notes && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Additional Notes</h2>
          <p className="text-gray-600">{summary.notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-6">
        <Button
          variant="outline"
          onClick={handleBuildManually}
          className="px-6"
          disabled={isAIProcessing}
        >
          Build Quote Manually
        </Button>
        <Button
          onClick={handleBuildWithAI}
          className="px-6"
          disabled={isAIProcessing}
        >
          {isAIProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Build Quote Using AI'
          )}
        </Button>
      </div>
    </div>
  );
} 