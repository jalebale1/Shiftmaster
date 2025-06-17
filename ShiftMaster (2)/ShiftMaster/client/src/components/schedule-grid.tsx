import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Maximize2, Phone, MessageCircle, Mail, Eye } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import ShiftBlock from "./shift-block";
import DailyTaskView from "./daily-task-view";
import { useDragDrop } from "@/hooks/use-drag-drop";
import type { Employee, Shift, TaskAssignment } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ScheduleGridProps {
  onAddEmployee: () => void;
  onAddShift: () => void;
}

const DAYS = ["pon", "uto", "sri", "čet", "pet", "sub", "ned"];
const WEEK_DATES = [
  "09.06.", "10.06.", "11.06.", "12.06.", "13.06.", "14.06.", "15.06.",
  "16.06.", "17.06.", "18.06.", "19.06.", "20.06.", "21.06.", "22.06."
];

export default function ScheduleGrid({ onAddEmployee, onAddShift }: ScheduleGridProps) {
  const { toast } = useToast();
  const [expandedView, setExpandedView] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
  });

  const { data: taskAssignments = [] } = useQuery<TaskAssignment[]>({
    queryKey: ["/api/task-assignments"],
  });

  const updateShiftMutation = useMutation({
    mutationFn: async ({ shiftId, updates }: { shiftId: number; updates: Partial<Shift> }) => {
      const response = await apiRequest("PUT", `/api/shifts/${shiftId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({
        title: "Shift updated",
        description: "Shift has been moved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update shift",
        variant: "destructive",
      });
    },
  });

  const { draggedShift, handleDragStart, handleDrop, isDragOver } = useDragDrop({
    onDrop: (shiftId: number, employeeId: number, dayOfWeek: number) => {
      updateShiftMutation.mutate({
        shiftId,
        updates: { employeeId, dayOfWeek },
      });
    },
  });

  const getShiftForEmployeeAndDay = (employeeId: number, dayIndex: number): Shift | undefined => {
    return shifts.find(shift => shift.employeeId === employeeId && shift.dayOfWeek === dayIndex);
  };

  const getTasksForShift = (shiftId: number) => {
    return taskAssignments.filter(task => task.shiftId === shiftId);
  };

  const getShiftTypeClass = (shiftType: string) => {
    switch (shiftType) {
      case "shift_8_16":
        return "shift-block-success";
      case "shift_10_18":
        return "shift-block-warning";
      case "shift_12_20":
        return "shift-block-error";
      default:
        return "shift-block-primary";
    }
  };

  const getShiftTypeLabel = (shiftType: string) => {
    switch (shiftType) {
      case "shift_8_16": return "08:00-16:00";
      case "shift_10_18": return "10:00-18:00";
      case "shift_12_20": return "12:00-20:00";
      default: return shiftType;
    }
  };

  const getDayShiftsCount = (dayIndex: number) => {
    return shifts.filter(shift => shift.dayOfWeek === dayIndex).length;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-neutral-900">
            Schedule Grid
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedView(!expandedView)}
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              {expandedView ? "Collapse" : "Expand"}
            </Button>
            <Button variant="outline" size="sm" onClick={onAddShift}>
              <Plus className="h-4 w-4 mr-1" />
              Add Slot
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-neutral-300">
                <th className="text-left py-3 px-4 font-medium text-neutral-900 w-32">
                  Employee
                </th>
                {DAYS.map((day, dayIndex) => (
                  <th key={day} className="text-center py-3 px-4 font-medium text-neutral-900 relative">
                    <div className="flex items-center justify-between">
                      <span>{day}</span>
                      <div className="flex items-center space-x-2">
                        {getDayShiftsCount(dayIndex) > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDay(dayIndex)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {getDayShiftsCount(dayIndex)}
                        </Badge>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: employee.color }}
                      >
                        {employee.initials}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{employee.name}</p>
                        <p className="text-xs text-neutral-500">{employee.role}</p>
                      </div>
                    </div>
                  </td>
                  {DAYS.map((day, dayIndex) => {
                    const shift = getShiftForEmployeeAndDay(employee.id, dayIndex);
                    const cellKey = `${employee.id}-${dayIndex}`;
                    
                    return (
                      <td
                        key={dayIndex}
                        className={`py-4 px-2 text-center relative ${
                          isDragOver === cellKey ? "drag-over" : ""
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add("drag-over");
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove("drag-over");
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove("drag-over");
                          if (draggedShift) {
                            handleDrop(draggedShift.id, employee.id, dayIndex);
                          }
                        }}
                      >
                        {shift ? (
                          <div className="space-y-2">
                            <ShiftBlock
                              shift={shift}
                              onDragStart={handleDragStart}
                              className={getShiftTypeClass(shift.shiftType)}
                            />
                            {/* Task summary indicators */}
                            {getTasksForShift(shift.id).length > 0 && (
                              <div className="flex justify-center space-x-1">
                                {getTasksForShift(shift.id).map((task) => {
                                  const iconMap = {
                                    telephone: Phone,
                                    chat: MessageCircle,
                                    email_other: Mail,
                                  };
                                  const colorMap = {
                                    telephone: "text-blue-500",
                                    chat: "text-green-500",
                                    email_other: "text-orange-500",
                                  };
                                  const Icon = iconMap[task.taskType as keyof typeof iconMap];
                                  const color = colorMap[task.taskType as keyof typeof colorMap];
                                  
                                  return Icon ? (
                                    <div
                                      key={task.id}
                                      title={`${task.taskType}: ${task.duration}h`}
                                      className="inline-block"
                                    >
                                      <Icon className={`h-3 w-3 ${color}`} />
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className="border-2 border-dashed border-neutral-300 rounded-lg p-4 text-neutral-400 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                            onClick={onAddShift}
                          >
                            <Plus className="h-4 w-4" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              
              {/* Add Employee Row */}
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <td colSpan={8} className="py-3 px-4">
                  <Button
                    variant="ghost"
                    onClick={onAddEmployee}
                    className="flex items-center space-x-2 text-primary hover:text-primary-dark"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">Add Employee</span>
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Daily Task View Modal */}
      {selectedDay !== null && (
        <DailyTaskView
          selectedDay={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </Card>
  );
}
