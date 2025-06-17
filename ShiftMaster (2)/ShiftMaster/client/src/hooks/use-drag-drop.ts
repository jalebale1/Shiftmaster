import { useState, useCallback } from "react";
import type { Shift } from "@shared/schema";

interface UseDragDropProps {
  onDrop: (shiftId: number, employeeId: number, dayOfWeek: number) => void;
}

export function useDragDrop({ onDrop }: UseDragDropProps) {
  const [draggedShift, setDraggedShift] = useState<Shift | null>(null);
  const [isDragOver, setIsDragOver] = useState<string | null>(null);

  const handleDragStart = useCallback((shift: Shift) => {
    setDraggedShift(shift);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedShift(null);
    setIsDragOver(null);
  }, []);

  const handleDragOver = useCallback((employeeId: number, dayOfWeek: number) => {
    const key = `${employeeId}-${dayOfWeek}`;
    setIsDragOver(key);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(null);
  }, []);

  const handleDrop = useCallback((shiftId: number, employeeId: number, dayOfWeek: number) => {
    if (draggedShift) {
      onDrop(shiftId, employeeId, dayOfWeek);
    }
    setDraggedShift(null);
    setIsDragOver(null);
  }, [draggedShift, onDrop]);

  return {
    draggedShift,
    isDragOver,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
