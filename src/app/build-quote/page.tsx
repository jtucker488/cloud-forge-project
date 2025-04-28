'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/app/store';
import { AddToQuoteModal } from '@/app/components/AddToQuoteModal';
import { QuoteCart } from '@/app/components/QuoteCart';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { fetchInventory, selectInventory, InventoryItem } from '@/app/redux/slices/inventorySlice';
import { selectMaterialMap } from '@/app/redux/slices/materialsSlice';
import { selectGradeMap } from '@/app/redux/slices/gradesSlice';
import { fetchMaterials } from '@/app/redux/slices/materialsSlice';
import { fetchGrades } from '@/app/redux/slices/gradesSlice';
import { useSearchParams } from 'next/navigation';
import RfqReferenceSummary from '@/components/ui/RfqReferenceSummary';

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
  }>;
  customer?: string;
  dueDate?: string;
  notes?: string;
}

export default function BuildQuotePage() {
  const dispatch = useDispatch<AppDispatch>();
  const inventory = useSelector(selectInventory);
  const materialMap = useSelector(selectMaterialMap);
  const gradeMap = useSelector(selectGradeMap);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const [rfqSummary, setRfqSummary] = useState<RfqSummary | null>(null);

  useEffect(() => {
    dispatch(fetchInventory());
    dispatch(fetchMaterials());
    dispatch(fetchGrades());
  }, [dispatch]);

  useEffect(() => {
    const summaryParam = searchParams.get('rfqSummary');
    if (summaryParam) {
      try {
        const parsedSummary = JSON.parse(summaryParam);
        setRfqSummary(parsedSummary);
      } catch (error) {
        console.error('Error parsing RFQ summary:', error);
      }
    }
  }, [searchParams]);


  const handleAddToQuote = (item: InventoryItem) => {
    console.log('Adding to quote:', item);
    console.log('Material name:', item.material_name);
    console.log('Grade name:', item.grade_name);
    
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Build Quote</h1>
      
      {/* RFQ Summary */}
      {rfqSummary && <RfqReferenceSummary summary={rfqSummary} />}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <h3 className="font-medium">{item.material_name}</h3>
                <p className="text-sm text-gray-500">Grade: {item.grade_name}</p>
                <p className="text-sm text-gray-500">
                  {item.length && `L: ${item.length} `}
                  {item.width && `W: ${item.width} `}
                  {item.thickness && `T: ${item.thickness}`}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  On-hand Stock: {item.on_hand_quantity}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Allocated Stock: {item.allocated_quantity}
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() => handleAddToQuote(item)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Quote
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-1">
          <QuoteCart />
        </div>
      </div>

      <AddToQuoteModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        item={selectedItem}
      />
    </div>
  );
} 