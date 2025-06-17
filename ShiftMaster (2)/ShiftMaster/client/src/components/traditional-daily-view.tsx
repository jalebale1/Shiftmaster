import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Edit, Wand2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Shift, Employee, TaskAssignment } from "@shared/schema";
import DailyEditModal from "./daily-edit-modal";
import DailySettingsModal from "./daily-settings-modal";

interface TraditionalDailyViewProps {
  selectedDay: number;
  onClose: () => void;
}

const HOURS = [
  "8-9", "9-10", "10-11", "11-12", "12-13", "13-14", "14-15", "15-16", 
  "16-17", "17-18", "18-19", "19-20"
];

const TASK_COLORS = {
  telephone: "bg-yellow-200", // Snjenja (Yellow)
  chat: "bg-pink-200",       // Chat (Pink)  
  email_other: "bg-gray-300", // Poziv (Gray)
  break: "bg-orange-200",    // Ne radi (Orange)
  home: "bg-green-200"       // Od doma (Green)
};

export default function TraditionalDailyView({ selectedDay, onClose }: TraditionalDailyViewProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
  });

  const { data: taskAssignments = [] } = useQuery<TaskAssignment[]>({
    queryKey: ["/api/task-assignments"],
  });

  const dayShifts = shifts.filter(shift => shift.dayOfWeek === selectedDay);
  
  const getTaskForEmployeeAtHour = (employeeId: number, hourIndex: number) => {
    const employeeShift = dayShifts.find(shift => shift.employeeId === employeeId);
    if (!employeeShift) return null;
    
    const tasks = taskAssignments.filter(task => task.shiftId === employeeShift.id);
    const targetHour = hourIndex + 8; // Convert to 24h format (8-20)
    
    return tasks.find(task => {
      const startHour = parseInt(task.startTime.split(':')[0]);
      const duration = task.duration;
      return targetHour >= startHour && targetHour < startHour + duration;
    });
  };

  const getTaskColor = (task: TaskAssignment | null | undefined) => {
    if (!task) return "bg-white";
    return TASK_COLORS[task.taskType as keyof typeof TASK_COLORS] || "bg-gray-100";
  };

  const getTaskLabel = (taskType: string) => {
    switch (taskType) {
      case 'telephone': return 'Tel';
      case 'chat': return 'Chat';
      case 'email_other': return 'Email';
      default: return '';
    }
  };

  const formatDate = new Date().toLocaleDateString('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold">
                PON {formatDate}
              </DialogTitle>
              <div className="flex space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-yellow-200 border"></div>
                  <span>Snjenja</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-pink-200 border"></div>
                  <span>Chat</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-gray-300 border"></div>
                  <span>Poziv</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-orange-200 border"></div>
                  <span>Ne radi</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-green-200 border"></div>
                  <span>Od doma</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSettingsModal(true)}>
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-x-auto">
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
                    return (
                      <td
                        key={employee.id}
                        className={`border border-gray-300 p-1 text-center h-8 ${getTaskColor(task)}`}
                      >
                        {task && (
                          <div className="text-[9px] font-medium">
                            {getTaskLabel(task.taskType)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>

      {/* Edit Modal */}
      {showEditModal && (
        <DailyEditModal
          selectedDay={selectedDay}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <DailySettingsModal
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </Dialog>
  );
}