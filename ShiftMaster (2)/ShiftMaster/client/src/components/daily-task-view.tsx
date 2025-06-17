import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Phone, MessageCircle, Mail } from "lucide-react";
import type { Employee, Shift, TaskAssignment } from "@shared/schema";

interface DailyTaskViewProps {
  selectedDay: number;
  onClose: () => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const taskIcons = {
  telephone: Phone,
  chat: MessageCircle,
  email_other: Mail,
};

const taskColors = {
  telephone: "bg-blue-500",
  chat: "bg-green-500",
  email_other: "bg-orange-500",
};

export default function DailyTaskView({ selectedDay, onClose }: DailyTaskViewProps) {
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
  });

  const { data: taskAssignments = [] } = useQuery<TaskAssignment[]>({
    queryKey: ["/api/task-assignments"],
  });

  // Filter shifts for the selected day
  const dayShifts = shifts.filter(shift => shift.dayOfWeek === selectedDay);

  // Get task assignments for each shift
  const getTasksForShift = (shiftId: number) => {
    return taskAssignments.filter(task => task.shiftId === shiftId);
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : "Unknown Employee";
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getShiftTypeLabel = (shiftType: string) => {
    switch (shiftType) {
      case "shift_8_16": return "08:00 - 16:00";
      case "shift_10_18": return "10:00 - 18:00";
      case "shift_12_20": return "12:00 - 20:00";
      default: return shiftType;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">
            {DAYS[selectedDay]} - Task Breakdown
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {dayShifts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No shifts scheduled for {DAYS[selectedDay]}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {dayShifts.map((shift) => {
                const tasks = getTasksForShift(shift.id);
                const employee = employees.find(e => e.id === shift.employeeId);
                
                return (
                  <Card key={shift.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                            style={{ backgroundColor: employee?.color || "#0078D4" }}
                          >
                            {employee?.initials || "??"}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{getEmployeeName(shift.employeeId)}</CardTitle>
                            <p className="text-sm text-gray-600">{employee?.role}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-sm">
                          {getShiftTypeLabel(shift.shiftType)}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {tasks.length === 0 ? (
                        <p className="text-gray-500 italic">No task assignments for this shift</p>
                      ) : (
                        <div className="space-y-3">
                          {tasks
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((task) => {
                              const IconComponent = taskIcons[task.taskType as keyof typeof taskIcons];
                              const colorClass = taskColors[task.taskType as keyof typeof taskColors];
                              
                              return (
                                <div
                                  key={task.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center`}>
                                      {IconComponent && <IconComponent className="h-4 w-4 text-white" />}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 capitalize">
                                        {task.taskType.replace('_', ' & ')}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {formatTime(task.startTime)} - {formatTime(task.endTime)}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="secondary">
                                    {task.duration}h
                                  </Badge>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}