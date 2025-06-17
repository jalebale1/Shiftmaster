import { useState } from "react";
import type { Shift } from "@shared/schema";

interface ShiftBlockProps {
  shift: Shift;
  onDragStart: (shift: Shift) => void;
  className?: string;
}

export default function ShiftBlock({ shift, onDragStart, className = "" }: ShiftBlockProps) {
  const [isDragging, setIsDragging] = useState(false);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const hasConflict = false; // This would be calculated based on overlapping shifts

  return (
    <div
      className={`
        rounded-lg p-2 text-white text-xs cursor-move hover:shadow-md transition-all
        ${className}
        ${isDragging ? "dragging" : ""}
        relative
      `}
      draggable
      onDragStart={(e) => {
        setIsDragging(true);
        onDragStart(shift);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => {
        setIsDragging(false);
      }}
    >
      {hasConflict && (
        <div 
          className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full" 
          title="Schedule Conflict"
        />
      )}
      <div className="font-medium">{formatTime(shift.startTime)}</div>
      <div className="opacity-75">{formatTime(shift.endTime)}</div>
      <div className="text-xs opacity-60 mt-1">{shift.duration}h</div>
    </div>
  );
}
