import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Wand2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Employee, TaskAssignment, Shift } from "@shared/schema";

interface DailyEditModalProps {
  selectedDay: number;
  onClose: () => void;
}

const HOURS = [
  "8-9", "9-10", "10-11", "11-12", "12-13", "13-14", "14-15", "15-16", 
  "16-17", "17-18", "18-19", "19-20"
];

const TASK_TYPES = [
  { value: "telephone", label: "Telefon", color: "bg-yellow-200" },
  { value: "chat", label: "Chat", color: "bg-pink-200" },
  { value: "email_other", label: "Email/Poziv", color: "bg-gray-300" },
  { value: "break", label: "Pauza", color: "bg-orange-200" },
  { value: "home", label: "Od doma", color: "bg-green-200" }
];

export default function DailyEditModal({ selectedDay, onClose }: DailyEditModalProps) {
  const { toast } = useToast();
  const [editingCells, setEditingCells] = useState<{[key: string]: string}>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragTaskType, setDragTaskType] = useState<string>("");
  const [isResetting, setIsResetting] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState<string>("telephone");
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());
  const [cellHistory, setCellHistory] = useState<{[key: string]: string}>({});
  const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
  });

  const { data: taskAssignments = [] } = useQuery<TaskAssignment[]>({
    queryKey: ["/api/task-assignments"],
  });

  const saveTasksMutation = useMutation({
    mutationFn: async (tasks: any[]) => {
      const response = await apiRequest("POST", "/api/save-daily-tasks", { tasks, dayOfWeek: selectedDay });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-assignments"] });
      toast({
        title: "Tasks saved",
        description: "Daily task assignments have been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save task assignments",
        variant: "destructive",
      });
    },
  });

  const autoGenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auto-generate-daily", { dayOfWeek: selectedDay });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-assignments"] });
      toast({
        title: "Auto-generated",
        description: "Daily schedule has been automatically generated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to auto-generate daily schedule",
        variant: "destructive",
      });
    },
  });

  const dayShifts = shifts.filter(shift => shift.dayOfWeek === selectedDay);
  
  const getTaskForEmployeeAtHour = (employeeId: number, hourIndex: number): TaskAssignment | undefined => {
    const employeeShift = dayShifts.find(shift => shift.employeeId === employeeId);
    if (!employeeShift) return undefined;
    
    const tasks = taskAssignments.filter(task => task.shiftId === employeeShift.id);
    const targetHour = hourIndex + 8;
    
    return tasks.find(task => {
      const startHour = parseInt(task.startTime.split(':')[0]);
      const duration = task.duration;
      return targetHour >= startHour && targetHour < startHour + duration;
    });
  };

  const getCellKey = (employeeId: number, hourIndex: number) => `${employeeId}-${hourIndex}`;

  const handleCellEdit = (employeeId: number, hourIndex: number, taskType: string) => {
    const cellKey = getCellKey(employeeId, hourIndex);
    setEditingCells(prev => ({
      ...prev,
      [cellKey]: taskType
    }));
  };

  const handleMouseDown = (employeeId: number, hourIndex: number, event: React.MouseEvent) => {
    event.preventDefault();
    const cellKey = getCellKey(employeeId, hourIndex);
    
    if (event.button === 1) { // Middle mouse button - cycle selected task type
      const currentIndex = TASK_TYPES.findIndex(t => t.value === selectedTaskType);
      const nextIndex = currentIndex < TASK_TYPES.length - 1 ? currentIndex + 1 : 0;
      setSelectedTaskType(TASK_TYPES[nextIndex].value);
    } else if (event.button === 2) { // Right mouse button - toggle between empty and last state
      const hasEditedValue = editingCells[cellKey];
      const originalTask = getTaskForEmployeeAtHour(employeeId, hourIndex);
      
      if (hasEditedValue || originalTask) {
        // If cell has a value (edited or original), clear it and store in history
        const currentValue = hasEditedValue || originalTask?.taskType || null;
        
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
      setDragTaskType(selectedTaskType);
      setEditingCells(prev => ({
        ...prev,
        [cellKey]: selectedTaskType
      }));
    }
  };

  const handleMouseEnter = (employeeId: number, hourIndex: number) => {
    if (isDragging && !isResetting) {
      const cellKey = getCellKey(employeeId, hourIndex);
      setEditingCells(prev => ({
        ...prev,
        [cellKey]: dragTaskType
      }));
    } else if (isResetting) {
      const cellKey = getCellKey(employeeId, hourIndex);
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
    setDragTaskType("");
    // Save changes only when user finishes dragging
    debouncedSave();
  };

  // Global mouse event listeners for drag functionality
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsResetting(false);
      setDragTaskType("");
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mouseleave', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleGlobalMouseUp);
    };
  }, []);

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault(); // Prevent right-click context menu
  };

  const debouncedSave = () => {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }

    const timeoutId = setTimeout(() => {
      const tasks: any[] = [];
      
      // Process all edited cells
      Object.entries(editingCells).forEach(([cellKey, taskType]) => {
        const [employeeId, hourIndex] = cellKey.split('-').map(Number);
        const employeeShift = dayShifts.find(shift => shift.employeeId === employeeId);
        
        if (employeeShift) {
          if (taskType === "") {
            // Handle cleared cells
            tasks.push({
              shiftId: employeeShift.id,
              employeeId,
              hourIndex,
              taskType: null,
              startTime: `${hourIndex + 8}:00`,
              duration: 1,
              action: "delete"
            });
          } else if (taskType && taskType !== "none") {
            // Handle assigned tasks
            tasks.push({
              shiftId: employeeShift.id,
              employeeId,
              hourIndex,
              taskType,
              startTime: `${hourIndex + 8}:00`,
              duration: 1,
              action: "upsert"
            });
          }
        }
      });

      if (tasks.length > 0 && !saveTasksMutation.isPending) {
        saveTasksMutation.mutate(tasks);
      }
    }, 1000);

    setSaveTimeoutId(timeoutId);
  };

  const clearAllTasks = () => {
    setEditingCells({});
    setCellHistory({});
    
    // Clear all tasks for this day
    const clearUpdates = dayShifts.flatMap(shift => 
      Array.from({ length: 12 }, (_, hourIndex) => ({
        shiftId: shift.id,
        employeeId: shift.employeeId,
        hourIndex,
        taskType: null,
        startTime: `${hourIndex + 8}:00`,
        duration: 1,
        action: "delete"
      }))
    );

    if (clearUpdates.length > 0) {
      saveTasksMutation.mutate(clearUpdates);
    }
    
    toast({
      title: "All tasks cleared",
      description: "All hourly tasks have been cleared for this day.",
    });
  };

  const handleAutoGenerate = () => {
    autoGenerateMutation.mutate();
  };

  // Warning detection logic
  const analyzeScheduleWarnings = () => {
    const allTelephoneCells: string[] = [];
    const allChatOverlapCells: string[] = [];
    const allNoChatCells: string[] = [];
    
    let hasTelephoneIssue = false;
    let hasChatOverlap = false;
    let hasNoChatIssue = false;
    
    // Check each hour for issues
    for (let hourIndex = 0; hourIndex < HOURS.length; hourIndex++) {
      let telephoneCount = 0;
      let chatCount = 0;
      let hasChat = false;
      const hourCells: string[] = [];
      
      employees.slice(0, 12).forEach(employee => {
        const cellKey = getCellKey(employee.id, hourIndex);
        const currentTask = editingCells[cellKey] || getTaskForEmployeeAtHour(employee.id, hourIndex)?.taskType;
        
        if (currentTask === "telephone") telephoneCount++;
        if (currentTask === "chat") {
          chatCount++;
          hasChat = true;
        }
        
        hourCells.push(cellKey);
      });
      
      // Check for too many people out of telephone (less than 2 on telephone)
      if (telephoneCount < 2) {
        hasTelephoneIssue = true;
        allTelephoneCells.push(...hourCells.filter(cellKey => {
          const [employeeId] = cellKey.split('-').map(Number);
          const task = editingCells[cellKey] || getTaskForEmployeeAtHour(employeeId, hourIndex)?.taskType;
          return task !== "telephone";
        }));
      }
      
      // Check for overlapping chat schedule (more than 1 person on chat)
      if (chatCount > 1) {
        hasChatOverlap = true;
        allChatOverlapCells.push(...hourCells.filter(cellKey => {
          const [employeeId] = cellKey.split('-').map(Number);
          const task = editingCells[cellKey] || getTaskForEmployeeAtHour(employeeId, hourIndex)?.taskType;
          return task === "chat";
        }));
      }
      
      // Check for no one in chat
      if (!hasChat) {
        hasNoChatIssue = true;
        allNoChatCells.push(...hourCells);
      }
    }
    
    const warnings: { type: string; message: string; cells: string[] }[] = [];
    
    if (hasTelephoneIssue) {
      warnings.push({
        type: "telephone",
        message: "Too many people out of the telephone",
        cells: allTelephoneCells
      });
    }
    
    if (hasChatOverlap) {
      warnings.push({
        type: "chat_overlap", 
        message: "Overlapping chat schedule",
        cells: allChatOverlapCells
      });
    }
    
    if (hasNoChatIssue) {
      warnings.push({
        type: "no_chat",
        message: "No one in chat", 
        cells: allNoChatCells
      });
    }
    
    return warnings;
  };

  const warnings = analyzeScheduleWarnings();

  const handleWarningClick = (warningCells: string[]) => {
    setHighlightedCells(new Set(warningCells));
    setTimeout(() => setHighlightedCells(new Set()), 3000); // Clear highlight after 3 seconds
  };

  const getTaskColor = (task: TaskAssignment | undefined, employeeId: number, hourIndex: number) => {
    const cellKey = getCellKey(employeeId, hourIndex);
    const editingTask = editingCells[cellKey];
    
    // Check if cell is highlighted for warnings
    if (highlightedCells.has(cellKey)) {
      return "bg-red-300 border-2 border-red-500";
    }
    
    // Handle explicitly cleared cells
    if (editingTask === "") {
      return "bg-gray-50 border-gray-200";
    }
    
    // Handle edited cells (always take priority)
    if (editingTask && editingTask !== "") {
      const taskType = TASK_TYPES.find(t => t.value === editingTask);
      return taskType?.color || "bg-white";
    }
    
    // Handle original/autogenerated tasks (only if not being edited)
    if (task && !editingTask) {
      const taskType = TASK_TYPES.find(t => t.value === task.taskType);
      return taskType?.color || "bg-gray-100";
    }
    
    return "bg-gray-50 border-gray-200";
  };

  const formatDate = new Date().toLocaleDateString('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold">
                Edit Daily Schedule - PON {formatDate}
              </DialogTitle>
              <div className="space-y-2">
                <div className="flex space-x-4 text-xs">
                  {TASK_TYPES.map(taskType => (
                    <div key={taskType.value} className="flex items-center space-x-1">
                      <div className={`w-4 h-4 border ${taskType.color}`}></div>
                      <span>{taskType.label}</span>
                    </div>
                  ))}
                </div>
                
                {/* Warning Messages - Compact */}
                {warnings.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {warnings.map((warning, index) => (
                      <span
                        key={`${warning.type}-${index}`}
                        className="bg-red-100 border border-red-300 text-red-700 px-2 py-0.5 rounded text-xs cursor-pointer hover:bg-red-200"
                        onClick={() => handleWarningClick(warning.cells)}
                      >
                        {warning.message}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-sm">
                  <span>Selected Task:</span>
                  <Select value={selectedTaskType} onValueChange={setSelectedTaskType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_TYPES.map(taskType => (
                        <SelectItem key={taskType.value} value={taskType.value}>
                          {taskType.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-gray-500">
                    Click & drag to paint | Middle-click to cycle brush | Right-click to reset/revert
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={clearAllTasks} disabled={saveTasksMutation.isPending}>
                Clear All
              </Button>
              <Button variant="outline" size="sm" onClick={handleAutoGenerate} disabled={autoGenerateMutation.isPending}>
                <Wand2 className="h-4 w-4 mr-1" />
                Auto-Generate
              </Button>

              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-100">
                <th className="border border-gray-300 p-2 text-left w-20">PON</th>
                {employees.slice(0, 12).map((employee) => (
                  <th key={employee.id} className="border border-gray-300 p-1 text-center min-w-[80px] text-[10px]">
                    {employee.name.split(' ').map(n => n.charAt(0)).join('')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour, hourIndex) => (
                <tr key={hour} className={hourIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 p-2 font-medium text-center">
                    {hour}
                  </td>
                  {employees.slice(0, 12).map((employee) => {
                    const task = getTaskForEmployeeAtHour(employee.id, hourIndex);
                    const cellKey = getCellKey(employee.id, hourIndex);
                    
                    return (
                      <td
                        key={employee.id}
                        className={`border border-gray-300 p-1 text-center h-8 cursor-pointer select-none ${getTaskColor(task, employee.id, hourIndex)}`}
                        onMouseDown={(e) => handleMouseDown(employee.id, hourIndex, e)}
                        onMouseEnter={() => handleMouseEnter(employee.id, hourIndex)}
                        onContextMenu={handleContextMenu}
                        style={{ userSelect: 'none' }}
                      >
                        <div className="text-[9px] font-medium pointer-events-none">
                          {(() => {
                            // Handle explicitly cleared cells
                            if (editingCells[cellKey] === "") {
                              return "-";
                            }
                            
                            // Handle edited cells
                            if (editingCells[cellKey] && editingCells[cellKey] !== "") {
                              const taskTypeData = TASK_TYPES.find(t => t.value === editingCells[cellKey]);
                              return taskTypeData ? taskTypeData.label.charAt(0) : "-";
                            }
                            
                            // Handle original/autogenerated tasks
                            if (task && !editingCells[cellKey]) {
                              const taskTypeData = TASK_TYPES.find(t => t.value === task.taskType);
                              return taskTypeData ? taskTypeData.label.charAt(0) : "-";
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
      </DialogContent>
    </Dialog>
  );
}