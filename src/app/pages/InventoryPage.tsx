"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { selectGradesByMaterialId } from "@/app/redux/slices/gradesSlice";
import InventorySection from "@/components/ui/inventorySection";
import {
  fetchGrades,
  selectGradeMap,
  selectGradesArray,
} from "@/app/redux/slices/gradesSlice";
import { RootState } from "@/app/store/index";
import InventoryModal from "@/components/ui/inventoryModal";
import {
  fetchMaterials,
  selectMaterialsArray,
} from "@/app/redux/slices/materialsSlice";
import {
  fetchInventory,
  selectInventory,
} from "@/app/redux/slices/inventorySlice";
import { useAppDispatch } from "@/app/store/hooks";
import { useSelector } from "react-redux";
import type { Grade } from "@/app/redux/slices/gradesSlice";

export default function InventoryPage() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchMaterials());
    dispatch(fetchInventory());
    dispatch(fetchGrades());
  }, [dispatch]);

  const handleInventoryAdded = () => {
    dispatch(fetchInventory());
  };

  const allGrades = useSelector(selectGradesArray);
  const materials = useSelector(selectMaterialsArray);
  const gradeMap = useSelector(selectGradeMap);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [gradeOptions, setGradeOptions] = useState<Grade[]>([]);
  const [form, setForm] = useState({
    material: "",
    length: "",
    width: "",
    thickness: "",
    grade: "",
    price: "",
    stock: "",
    allocated_stock: "",
  });

  const handleAddToQuote = () => {};

  const gradesForSelectedMaterial = useSelector(
    selectedMaterial
      ? selectGradesByMaterialId(Number(selectedMaterial))
      : () => []
  );

  useEffect(() => {
    if (selectedMaterial) {
      const materialId = Number(selectedMaterial);
      const filtered = allGrades.filter((g) => g.material_id === materialId);
      setGradeOptions(filtered);
    } else {
      setGradeOptions([]);
    }
  }, [selectedMaterial, allGrades]);

  const handleMaterialChange = async (materialId: string) => {
    setForm({ ...form, material: materialId, grade: "" });
    setSelectedMaterial(materialId);
  };

  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <Button onClick={() => setIsOpen(true)}>Add Inventory Item</Button>
      </div>
      
      <InventoryModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        materials={Object.values(materials)}
        selectedMaterial={selectedMaterial}
        setSelectedMaterial={setSelectedMaterial}
        gradeOptions={gradeOptions}
        handleMaterialChange={handleMaterialChange}
        form={form}
        setForm={setForm}
        handleChange={handleChange}
        onInventoryAdded={handleInventoryAdded}
      />
      <InventorySection onAddToQuote={handleAddToQuote} onInventoryChanged={handleInventoryAdded} />
    </div>
  );
} 