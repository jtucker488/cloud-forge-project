'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RfqReferenceSummaryProps {
  summary: {
    materials: Array<{
      name: string;
      grade?: string;
      dimensions?: {
        length?: number;
        width?: number;
        thickness?: number;
      };
      quantity?: number;
    }>;
    customer?: string;
    dueDate?: string;
    notes?: string;
  };
}

export default function RfqReferenceSummary({ summary }: RfqReferenceSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div>
      <Card className="p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">RFQ Reference</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {isExpanded && (
          <div className="space-y-4">
            {summary.customer && (
              <div>
                <span className="font-medium">Customer: </span>
                {summary.customer}
              </div>
            )}
            {summary.dueDate && (
              <div>
                <span className="font-medium">Due Date: </span>
                {summary.dueDate}
              </div>
            )}
            
            <div className="mt-2">
              <h3 className="font-medium mb-2">Requested Materials:</h3>
              <div className="space-y-2">
                {summary.materials.map((material, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-3">
                    <div className="font-medium">{material.name}</div>
                    {material.grade && (
                      <div><span className="text-gray-600">Grade:</span> {material.grade}</div>
                    )}
                    {material.dimensions && (
                      <div>
                        <span className="text-gray-600">Dimensions:</span>{' '}
                        {Object.entries(material.dimensions)
                          .filter(([_, value]) => value !== undefined)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(', ')}
                      </div>
                    )}
                    {material.quantity && (
                      <div><span className="text-gray-600">Quantity:</span> {material.quantity}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {summary.notes && (
              <div className="mt-2">
                <span className="font-medium">Notes: </span>
                {summary.notes}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
} 