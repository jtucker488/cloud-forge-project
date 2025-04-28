// components/InventoryCard.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InventoryItem } from '@/app/redux/slices/inventorySlice';
import EditInventoryModal from './EditInventoryModal';

interface InventoryCardProps {
  item: InventoryItem;
  material: string;
  grade: string;
  onAddToQuote: (item: InventoryItem) => void;
  onInventoryChanged?: () => void;
}

export default function InventoryCard({ item, material, grade, onAddToQuote, onInventoryChanged }: InventoryCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white flex flex-col justify-between h-full">
      <div>
        <h3 className="font-semibold text-lg mb-2">{material} - {grade}</h3>
        <p className="text-sm text-gray-600 mb-1">
          Dimensions: {item.length} x {item.width} x {item.thickness}
        </p>
        <p className="text-sm text-gray-600 mb-1">
          On-hand Stock: {item.on_hand_quantity}
        </p>
        <p className="text-sm text-gray-600 mb-1">
          Allocated Stock: {item.allocated_quantity}
        </p>
        <p className="text-sm text-gray-600 mb-1">
          Price per Item: ${item.default_price}
        </p>
      </div>
      <Button className="mt-2" variant="outline" onClick={() => setEditOpen(true)}>
        Edit
      </Button>
      <EditInventoryModal
        isOpen={editOpen}
        setIsOpen={setEditOpen}
        item={item}
        onInventoryChanged={onInventoryChanged}
      />
      {/* <Button className="mt-4" onClick={() => onAddToQuote(item)}>
        Add to Quote
      </Button> */}
    </div>
  );
}
