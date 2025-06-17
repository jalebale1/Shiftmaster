import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TraditionalDailyView from "./traditional-daily-view";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Employee, Shift } from "@shared/schema";

interface TraditionalScheduleGridProps {
  onAddEmployee: () => void;
  onAddShift: () => void;
}

const DAYS = ["pon", "uto", "sri", "čet", "pet", "sub", "ned"];
const WEEK_DATES = [
  "09.06.", "10.06.", "11.06.", "12.06.", "13.06.", "14.06.", "15.06.",
  "16.06.", "17.06.", "18.06.", "19.06.", "20.06.", "21.06.", "22.06."
];

const SHIFT_TYPES = [
  { value: "08:00-16:00", startTime: "08:00", endTime: "16:00", color: "bg-yellow-200" },
  { value: "10:00-18:00", startTime: "10:00", endTime: "18:00", color: "bg-blue-200" },
  { value: "12:00-20:00", startTime: "12:00", endTime: "20:00", color: "bg-green-200" },
];

export default function TraditionalScheduleGrid({ onAddEmployee, onAddShift }: TraditionalScheduleGridProps) {
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedShift, setSelectedShift] = useState<string>("08:00-16:00");
  const [editingCells, setEditingCells] = useState<{[key: string]: string}>({});
  const [cellHistory, setCellHistory] = useState<{[key: string]: string}>({});
  const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
  });

  const saveShiftsMutation = useMutation({
    mutationFn: async (shiftUpdates: any[]) => {
      return await apiRequest("POST", "/api/save-shifts", { shifts: shiftUpdates });
    },
    onSuccess: () => {
      // Don't clear editing cells immediately to prevent visual flickering
      // Let the query invalidation handle the update
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      
      // Clear editing cells after a short delay to allow server update
      setTimeout(() => {
        setEditingCells({});
      }, 500);
      
      toast({
        title: "Shifts saved successfully",
        description: "The schedule has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to save shifts. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getShiftForEmployeeAndDay = (employeeId: number, dayIndex: number) => {
    return shifts.find(shift => 
      shift.employeeId === employeeId && shift.dayOfWeek === dayIndex
    );
  };

  const getCellKey = (employeeId: number, dayIndex: number) => `${employeeId}-${dayIndex}`;

  const handleMouseDown = (employeeId: number, dayIndex: number, event: React.MouseEvent) => {
    event.preventDefault();
    const cellKey = getCellKey(employeeId, dayIndex);
    
    if (event.button === 1) { // Middle mouse button - cycle selected shift type
      const shiftTypes = ["08:00-16:00", "10:00-18:00", "12:00-20:00"];
      const currentIndex = shiftTypes.findIndex(s => s === selectedShift);
      const nextIndex = currentIndex < shiftTypes.length - 1 ? currentIndex + 1 : 0;
      setSelectedShift(shiftTypes[nextIndex]);
    } else if (event.button === 2) { // Right mouse button - toggle between empty and last state
      const hasEditedValue = editingCells[cellKey];
      const originalShift = getShiftForEmployeeAndDay(employeeId, dayIndex);
      
      if (hasEditedValue || originalShift) {
        // If cell has a value (edited or original), clear it and store in history
        const currentValue = hasEditedValue || (originalShift ? `${originalShift.startTime}-${originalShift.endTime}` : null);
        
        if (currentValue) {
          setCellHistory(prev => ({
            ...prev,
            [cellKey]: currentValue
          }));
        }
        
        setEditingCells(prev => {
          const newCells = { ...prev };
          newCells[cellKey] = ""; // Mark as explicitly empty
          return newCells;
        });
      } else if (cellHistory[cellKey]) {
        // If cell is empty and we have history, restore the last known value
        setEditingCells(prev => ({
          ...prev,
          [cellKey]: cellHistory[cellKey]
        }));
      }
    } else if (event.button === 0) { // Left mouse button
      setIsDragging(true);
      setEditingCells(prev => ({
        ...prev,
        [cellKey]: selectedShift
      }));
    }
  };

  const handleMouseEnter = (employeeId: number, dayIndex: number) => {
    if (isDragging && !isResetting) {
      const cellKey = getCellKey(employeeId, dayIndex);
      setEditingCells(prev => ({
        ...prev,
        [cellKey]: selectedShift
      }));
    } else if (isResetting) {
      const cellKey = getCellKey(employeeId, dayIndex);
      setEditingCells(prev => {
        const newCells = { ...prev };
        delete newCells[cellKey];
        return newCells;
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResetting(false);
    // Save changes only when user finishes dragging
    debouncedSave();
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault(); // Prevent right-click context menu
  };

  // Global mouse event listeners for drag functionality
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsResetting(false);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mouseleave', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleGlobalMouseUp);
    };
  }, []);

  const debouncedSave = () => {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }

    const timeoutId = setTimeout(() => {
      if (Object.keys(editingCells).length === 0 || saveShiftsMutation.isPending) {
        return;
      }

      const shiftUpdates: any[] = [];
      
      Object.entries(editingCells).forEach(([cellKey, shiftType]) => {
        const [employeeId, dayIndex] = cellKey.split('-').map(Number);
        
        if (shiftType === "") {
          // Handle cleared cells
          shiftUpdates.push({
            employeeId,
            dayOfWeek: dayIndex,
            startTime: null,
            endTime: null,
            action: "delete"
          });
        } else {
          const shiftData = SHIFT_TYPES.find(s => s.value === shiftType);
          if (shiftData) {
            shiftUpdates.push({
              employeeId,
              dayOfWeek: dayIndex,
              startTime: shiftData.startTime,
              endTime: shiftData.endTime,
              action: "upsert"
            });
          }
        }
      });

      if (shiftUpdates.length > 0) {
        saveShiftsMutation.mutate(shiftUpdates);
      }
    }, 1000);

    setSaveTimeoutId(timeoutId);
  };

  const clearAllShiftsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/clear-all-shifts");
    },
    onSuccess: () => {
      setEditingCells({});
      setCellHistory({});
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      
      toast({
        title: "All shifts cleared",
        description: "The entire schedule has been cleared.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to clear shifts. Please try again.",
        variant: "destructive",
      });
    },
  });

  const clearAllShifts = () => {
    clearAllShiftsMutation.mutate();
  };

  const getShiftColor = (shift: Shift | undefined, employeeId: number, dayIndex: number) => {
    const cellKey = getCellKey(employeeId, dayIndex);
    const editingShift = editingCells[cellKey];
    
    // Handle explicitly cleared cells
    if (editingShift === "") {
      return "bg-gray-50 border-gray-200";
    }
    
    // Handle edited cells (always take priority)
    if (editingShift && editingShift !== "") {
      if (editingShift === "08:00-16:00") return "bg-yellow-100 border-yellow-300";
      if (editingShift === "10:00-18:00") return "bg-blue-100 border-blue-300";
      if (editingShift === "12:00-20:00") return "bg-green-100 border-green-300";
    }
    
    // Handle original/autogenerated shifts (only if not being edited)
    if (shift && !editingShift) {
      if (shift.startTime === "08:00") return "bg-yellow-200 border-yellow-400";
      if (shift.startTime === "10:00") return "bg-blue-200 border-blue-400";
      if (shift.startTime === "12:00") return "bg-green-200 border-green-400";
    }
    
    return "bg-gray-50 border-gray-200";
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Shift Selector */}
      <div className="flex items-center space-x-4 text-sm bg-white p-3 rounded-lg border">
        <span>Selected Shift:</span>
        <Select value={selectedShift} onValueChange={setSelectedShift}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SHIFT_TYPES.map(shiftType => (
              <SelectItem key={shiftType.value} value={shiftType.value}>
                {shiftType.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={clearAllShifts}
          className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={saveShiftsMutation.isPending || clearAllShiftsMutation.isPending}
        >
          {clearAllShiftsMutation.isPending ? "Clearing..." : "Clear All"}
        </button>
        <span className="text-xs text-gray-500">
          Click & drag to paint | Middle-click to cycle brush | Right-click to toggle empty/restore
        </span>
      </div>

      {/* First Week */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-green-100 border-b-2 border-green-300">
              <th className="text-left py-2 px-3 font-bold text-gray-800 w-32 border-r border-green-300">
                Agent
              </th>
              {DAYS.map((day, index) => (
                <th key={`week1-${day}`} className="text-center py-2 px-1 font-bold text-gray-800 border-r border-green-300 min-w-[70px]">
                  <div className="space-y-1">
                    <div className="text-xs">{day}, {WEEK_DATES[index]}</div>
                    <div className="flex justify-center items-center space-x-1">
                      <span className="text-xs">satnice</span>
                      <div className="flex space-x-1">
                        <Eye 
                          className="h-3 w-3 text-blue-600 cursor-pointer hover:text-blue-800" 
                          onClick={() => setSelectedDay(index)}
                        />
                      </div>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.slice(0, 15).map((employee, empIndex) => (
              <tr key={`week1-${employee.id}`} className={`border-b hover:bg-blue-50 ${empIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="py-1 px-3 font-medium text-gray-900 border-r border-gray-300 text-xs">
                  {employee.name}
                </td>
                {DAYS.map((_, dayIndex) => {
                  const shift = getShiftForEmployeeAndDay(employee.id, dayIndex);
                  return (
                    <td
                      key={dayIndex}
                      className={`py-1 px-1 text-center border-r border-gray-200 cursor-pointer h-8 select-none ${getShiftColor(shift, employee.id, dayIndex)}`}
                      onMouseDown={(e) => handleMouseDown(employee.id, dayIndex, e)}
                      onMouseEnter={() => handleMouseEnter(employee.id, dayIndex)}
                      onContextMenu={handleContextMenu}
                      style={{ userSelect: 'none' }}
                    >
                      <div className="text-xs font-medium pointer-events-none">
                        {(() => {
                          const cellKey = getCellKey(employee.id, dayIndex);
                          const editingShift = editingCells[cellKey];
                          
                          // Handle explicitly cleared cells
                          if (editingShift === "") {
                            return "-";
                          }
                          
                          // Handle edited cells
                          if (editingShift && editingShift !== "") {
                            return editingShift;
                          }
                          
                          // Handle original/autogenerated shifts
                          if (shift) {
                            return `${shift.startTime}-${shift.endTime}`;
                          }
                          
                          return "-";
                        })()}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Second Week */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-green-100 border-b-2 border-green-300">
              <th className="text-left py-2 px-3 font-bold text-gray-800 w-32 border-r border-green-300">
                Agent
              </th>
              {DAYS.map((day, index) => (
                <th key={`week2-${day}`} className="text-center py-2 px-1 font-bold text-gray-800 border-r border-green-300 min-w-[70px]">
                  <div className="space-y-1">
                    <div className="text-xs">{day}, {WEEK_DATES[index + 7]}</div>
                    <div className="flex justify-center items-center space-x-1">
                      <span className="text-xs">satnice</span>
                      <Eye 
                        className="h-3 w-3 text-blue-600 cursor-pointer hover:text-blue-800" 
                        onClick={() => setSelectedDay(index + 7)}
                      />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.slice(0, 15).map((employee, empIndex) => (
              <tr key={`week2-${employee.id}`} className={`border-b hover:bg-blue-50 ${empIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="py-1 px-3 font-medium text-gray-900 border-r border-gray-300 text-xs">
                  {employee.name}
                </td>
                {DAYS.map((_, dayIndex) => {
                  const adjustedDayIndex = dayIndex + 7; // Second week
                  const shift = getShiftForEmployeeAndDay(employee.id, adjustedDayIndex);
                  return (
                    <td
                      key={adjustedDayIndex}
                      className={`py-1 px-1 text-center border-r border-gray-200 cursor-pointer h-8 select-none ${getShiftColor(shift, employee.id, adjustedDayIndex)}`}
                      onMouseDown={(e) => handleMouseDown(employee.id, adjustedDayIndex, e)}
                      onMouseEnter={() => handleMouseEnter(employee.id, adjustedDayIndex)}
                      onContextMenu={handleContextMenu}
                      style={{ userSelect: 'none' }}
                    >
                      <div className="text-xs font-medium pointer-events-none">
                        {(() => {
                          const cellKey = getCellKey(employee.id, adjustedDayIndex);
                          const editingShift = editingCells[cellKey];
                          
                          // Handle explicitly cleared cells
                          if (editingShift === "") {
                            return "-";
                          }
                          
                          // Handle edited cells
                          if (editingShift && editingShift !== "") {
                            return editingShift;
                          }
                          
                          // Handle original/autogenerated shifts
                          if (shift) {
                            return `${shift.startTime}-${shift.endTime}`;
                          }
                          
                          return "-";
                        })()}
                      </div>
                    </td>
                  );
                })}
              </tr>  
            ))}
          </tbody>
        </table>
      </div>

      {/* Daily Task View Modal */}
      {selectedDay !== null && (
        <TraditionalDailyView
          selectedDay={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}


    </div>
  );
}