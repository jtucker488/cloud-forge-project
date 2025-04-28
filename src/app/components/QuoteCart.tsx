'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/app/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';
import { removeItem, updateQuantity, selectQuoteItems, QuoteItem } from '@/app/redux/slices/quoteSlice';
import { createQuote } from '@/app/redux/slices/quotesSlice';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function QuoteCart() {
  const router = useRouter();
  const items = useSelector(selectQuoteItems);
  const dispatch = useDispatch<AppDispatch>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');

  const handleQuantityChange = (id: string, quantity: number) => {
    dispatch(updateQuantity({ id, quantity }));
  };

  const handleRemoveItem = (id: string) => {
    dispatch(removeItem(id));
  };

  const handleSubmitQuote = async () => {
    if (!customerName.trim()) return;

    setIsSubmitting(true);
    try {
      // Format line items for the quote
      const lineItems = items.map(item => ({
        material_id: item.material_id,
        material_name: item.material_name,
        grade: item.grade_name,
        dimensions: [
          item.length && `L: ${item.length}`,
          item.width && `W: ${item.width}`,
          item.thickness && `T: ${item.thickness}`
        ].filter(Boolean).join(', '),
        quantity: item.quantity,
        // TODO: Add actual pricing logic
        unit_price: 100,
        subtotal_price: 100 * item.quantity
      }));

      const result = await dispatch(createQuote({
        customer_name: customerName,
        notes: notes,
        status: 'draft',
        line_items: lineItems
      })).unwrap();

      // Navigate to the quote summary page
      router.push(`/quote/${result.id}`);
    } catch (error) {
      console.error('Failed to create quote:', error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
      setShowDialog(false);
    }
  };

  return (
    <>
      <div className="w-80 border rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Quote Cart</h2>
        {items.length === 0 ? (
          <p className="text-gray-500">Your cart is empty</p>
        ) : (
          <div className="space-y-4">
            {items.map((item: QuoteItem) => (
              <div key={item.id} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Material: {item.material_name}</p>
                    <p className="text-sm text-gray-500">Grade: {item.grade_name}</p>
                    {item.length && <p className="text-sm text-gray-500">Length: {item.length}</p>}
                    {item.width && <p className="text-sm text-gray-500">Width: {item.width}</p>}
                    {item.thickness && <p className="text-sm text-gray-500">Thickness: {item.thickness}</p>}
                    {item.notes && (
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">Notes:</span> {item.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-sm">Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                    className="w-16 border rounded px-2 py-1"
                  />
                </div>
              </div>
            ))}

            <Button 
              className="w-full mt-4" 
              onClick={() => setShowDialog(true)}
              disabled={items.length === 0}
            >
              Build Quote
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Quote</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes"
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitQuote} 
                disabled={!customerName.trim() || isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Quote'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 