// components/InventoryModal.tsx
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
import { Material } from "@/app/redux/slices/materialsSlice";
import { Grade } from "@/app/redux/slices/gradesSlice";
import { supabase } from '@/lib/supabase';

interface InventoryModalProps {
  handleMaterialChange: (materialId: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  materials: Material[];
  selectedMaterial: string | null;
  setSelectedMaterial: (id: string) => void;
  gradeOptions: Grade[];
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  handleChange: (field: string, value: string) => void;
  onInventoryAdded?: () => void;
}

export default function InventoryModal({
  isOpen,
  setIsOpen,
  materials,
  selectedMaterial,
  setSelectedMaterial,
  gradeOptions,
  handleMaterialChange,
  form,
  setForm,
  handleChange,
  onInventoryAdded,
}: InventoryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("form", form);
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('No access token found. Please log in.');
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add inventory item');
      }

      // Reset form and close modal
      setForm({
        material: "",
        length: "",
        width: "",
        thickness: "",
        grade: "",
        default_price: "",
        stock: "",
        allocated_stock: "",
      });
      setIsOpen(false);
      if (onInventoryAdded) {
        onInventoryAdded();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
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
              Add Inventory Item
            </Dialog.Title>
            <button onClick={() => setIsOpen(false)}>
              <X />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Material dropdown */}
            <Select
              onValueChange={(val) => {
                setForm({ ...form, material: val, grade: "" });
                setSelectedMaterial(val);
                handleMaterialChange(val);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a material" />
              </SelectTrigger>
              <SelectContent>
                {materials?.map((mat) => (
                  <SelectItem key={mat.id} value={mat.id.toString()}>
                    {mat.name} ({mat.dimension_unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Dimensions */}
            <Input
              placeholder="Length"
              type="number"
              value={form.length}
              onChange={(e) => handleChange("length", e.target.value)}
              required
            />
            <Input
              placeholder="Width"
              type="number"
              value={form.width}
              onChange={(e) => handleChange("width", e.target.value)}
              required
            />
            <Input
              placeholder="Thickness"
              type="number"
              value={form.thickness}
              onChange={(e) => handleChange("thickness", e.target.value)}
              required
            />

            {/* Price and Stock fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per Item</label>
              <Input
                placeholder="Price"
                type="number"
                step="0.01"
                value={form.default_price}
                onChange={(e) => handleChange("default_price", e.target.value)}
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
                value={form.allocated_stock || ''}
                onChange={(e) => handleChange("allocated_stock", e.target.value)}
                required
              />
            </div>

            {/* Grade dropdown */}
            <Select
              onValueChange={(val) => handleChange("grade", val)}
              disabled={!selectedMaterial}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a grade" />
              </SelectTrigger>
              <SelectContent>
                {gradeOptions.map((grade) => (
                  <SelectItem key={grade.id} value={grade.id.toString()}>
                    {grade.grade_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Submit'}
            </Button>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
