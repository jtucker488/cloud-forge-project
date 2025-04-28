"use client";
import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { InventoryItem } from '@/app/redux/slices/inventorySlice';
import { supabase } from '@/lib/supabase';

interface EditInventoryModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  item: InventoryItem;
  onInventoryChanged?: () => void;
}

export default function EditInventoryModal({ isOpen, setIsOpen, item, onInventoryChanged }: EditInventoryModalProps) {
  const [form, setForm] = useState({
    material: item.material_id,
    length: item.length,
    width: item.width,
    thickness: item.thickness,
    grade: item.grade_name, // This may need to be grade_id if available
    price: item.default_price, // No price in InventoryItem, so default to empty string
    stock: item.on_hand_quantity,
    allocated_stock: item.allocated_quantity,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleChange = (field: string, value: string | number) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('No access token found. Please log in.');

      let material_id: string;
      if (form.material) {
        material_id = form.material;
      } else {
        throw new Error('Material is required');
      }

      let grade_id: string;
      if (form.grade) {
        const { data: gradeRow, error: gradeLookupError } = await supabase
          .from('grades')
          .select('id')
          .eq('grade_label', form.grade)
          .eq('material_id', material_id)
          .single();
        if (gradeLookupError || !gradeRow) {
          throw new Error('Invalid grade selection');
        }
        grade_id = gradeRow.id;
      } else {
        throw new Error('Grade is required');
      }
      console.log("form:", form);

      const response = await fetch(`/api/inventory/${item.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          material_id,
          length: form.length,
          width: form.width,
          thickness: form.thickness,
          grade_id,
          default_price: form.price,
          on_hand_quantity: form.stock,
          allocated_quantity: form.allocated_stock,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update inventory item');
      }
      setIsOpen(false);
      if (onInventoryChanged) onInventoryChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('No access token found. Please log in.');
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete inventory item');
      }
      setIsOpen(false);
      if (onInventoryChanged) onInventoryChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-bold">
              Edit Inventory Item
            </Dialog.Title>
            <button onClick={() => setIsOpen(false)}>
              <X />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
              <Input
                placeholder="Length"
                type="number"
                value={form.length}
                onChange={(e) => handleChange("length", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
              <Input
                placeholder="Width"
                type="number"
                value={form.width}
                onChange={(e) => handleChange("width", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thickness</label>
              <Input
                placeholder="Thickness"
                type="number"
                value={form.thickness}
                onChange={(e) => handleChange("thickness", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <Input
                placeholder="Price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">On-hand Stock Quantity</label>
              <Input
                placeholder="On-hand Stock Quantity"
                type="number"
                value={form.stock}
                onChange={(e) => handleChange("stock", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allocated Stock Quantity</label>
              <Input
                placeholder="Allocated Stock Quantity"
                type="number"
                value={form.allocated_stock}
                onChange={(e) => handleChange("allocated_stock", e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
          <Button 
            type="button" 
            className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Inventory Item'}
          </Button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 