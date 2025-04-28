import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/app/store';
import { addItem } from '@/app/redux/slices/quoteSlice';
import { InventoryItem } from '@/app/redux/slices/inventorySlice';

interface AddToQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

export function AddToQuoteModal({ isOpen, onClose, item }: AddToQuoteModalProps) {
  const [quantity, setQuantity] = useState(1);
  const dispatch = useDispatch<AppDispatch>();

  // Reset quantity when modal opens or closes
  useEffect(() => {
    setQuantity(1);
  }, [isOpen]);

  const handleConfirm = () => {
    if (!item) return;
    
    dispatch(addItem({
      id: Math.random().toString(36).substr(2, 9), // Generate a new ID for the quote item
      material_id: item.material_id,
      material_name: item.material_name,
      grade_name: item.grade_name,
      length: item.length,
      width: item.width,
      thickness: item.thickness,
      quantity,
    }));
    onClose();
  };

  if (!item) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Quote</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Material</Label>
            <div className="text-sm text-gray-500">{item.material_name}</div>
          </div>
          <div>
            <Label>Grade</Label>
            <div className="text-sm text-gray-500">{item.grade_name}</div>
          </div>
          <div>
            <Label>Dimensions</Label>
            <div className="text-sm text-gray-500">
              {item.length && `Length: ${item.length} `}
              {item.width && `Width: ${item.width} `}
              {item.thickness && `Thickness: ${item.thickness}`}
            </div>
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={item.on_hand_quantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(Number(e.target.value), item.on_hand_quantity))}
            />
            <div className="text-sm text-gray-500 mt-1">
              Available stock: {item.on_hand_quantity}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 