// components/InventorySection.tsx
import React from "react";
import InventoryCard from "./inventoryCard";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectInventory, InventoryItem } from "@/app/redux/slices/inventorySlice";
import { selectGradeMap } from "@/app/redux/slices/gradesSlice";
import { selectMaterialMap } from "@/app/redux/slices/materialsSlice";

interface InventorySectionProps {
  onAddToQuote: (item: InventoryItem) => void;
  onInventoryChanged?: () => void;
}

export default function InventorySection({
  onAddToQuote,
  onInventoryChanged,
}: InventorySectionProps) {
  const inventory = useSelector(selectInventory);
  const materialMap = useSelector(selectMaterialMap);
  const gradeMap = useSelector(selectGradeMap);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {inventory.map((item) => (
        <InventoryCard
          key={item.id}
          item={item}
          material={item.material_name}
          grade={item.grade_name}
          onAddToQuote={onAddToQuote}
          onInventoryChanged={onInventoryChanged}
        />
      ))}
    </div>
  );
}
