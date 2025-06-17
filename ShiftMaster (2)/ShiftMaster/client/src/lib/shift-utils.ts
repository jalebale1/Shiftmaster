import type { Shift, Employee } from "@shared/schema";

export interface ConflictInfo {
  shift1: Shift;
  shift2: Shift;
  employee: Employee;
  type: "time_overlap" | "double_booking";
}

export function detectShiftConflicts(
  shifts: Shift[],
  employees: Employee[]
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];
  
  // Group shifts by employee and day
  const shiftsByEmployeeAndDay = new Map<string, Shift[]>();
  
  shifts.forEach(shift => {
    const key = `${shift.employeeId}-${shift.dayOfWeek}`;
    if (!shiftsByEmployeeAndDay.has(key)) {
      shiftsByEmployeeAndDay.set(key, []);
    }
    shiftsByEmployeeAndDay.get(key)!.push(shift);
  });
  
  // Check for conflicts within each employee's daily shifts
  shiftsByEmployeeAndDay.forEach((dayShifts, key) => {
    const [employeeId] = key.split('-').map(Number);
    const employee = employees.find(e => e.id === employeeId);
    
    if (!employee || dayShifts.length < 2) return;
    
    for (let i = 0; i < dayShifts.length; i++) {
      for (let j = i + 1; j < dayShifts.length; j++) {
        const shift1 = dayShifts[i];
        const shift2 = dayShifts[j];
        
        if (hasTimeOverlap(shift1, shift2)) {
          conflicts.push({
            shift1,
            shift2,
            employee,
            type: "time_overlap"
          });
        }
      }
    }
  });
  
  return conflicts;
}

function hasTimeOverlap(shift1: Shift, shift2: Shift): boolean {
  const start1 = timeToMinutes(shift1.startTime);
  const end1 = timeToMinutes(shift1.endTime);
  const start2 = timeToMinutes(shift2.startTime);
  const end2 = timeToMinutes(shift2.endTime);
  
  // Handle overnight shifts
  const end1Adjusted = end1 <= start1 ? end1 + 24 * 60 : end1;
  const end2Adjusted = end2 <= start2 ? end2 + 24 * 60 : end2;
  
  return start1 < end2Adjusted && end1Adjusted > start2;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function calculateWeeklyHours(shifts: Shift[], employeeId: number): number {
  return shifts
    .filter(shift => shift.employeeId === employeeId)
    .reduce((total, shift) => total + shift.duration, 0);
}

export function calculateCoverageStats(
  shifts: Shift[],
  employees: Employee[]
): {
  totalSlots: number;
  filledSlots: number;
  coverage: number;
  totalHours: number;
} {
  const totalSlots = employees.length * 7; // 7 days per week
  const filledSlots = shifts.length;
  const coverage = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
  const totalHours = shifts.reduce((sum, shift) => sum + shift.duration, 0);
  
  return {
    totalSlots,
    filledSlots,
    coverage,
    totalHours
  };
}

export function exportScheduleToCSV(shifts: Shift[], employees: Employee[]): string {
  const headers = ["Employee", "Day", "Start Time", "End Time", "Duration", "Shift Type"];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  const rows = shifts.map(shift => {
    const employee = employees.find(e => e.id === shift.employeeId);
    return [
      employee?.name || "Unknown",
      days[shift.dayOfWeek] || "Unknown",
      shift.startTime,
      shift.endTime,
      `${shift.duration}h`,
      shift.shiftType
    ];
  });
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(","))
    .join("\n");
    
  return csvContent;
}

export function getShiftColor(shiftType: string): string {
  switch (shiftType) {
    case "morning":
      return "#107C10"; // Green
    case "afternoon":
      return "#FF8C00"; // Orange
    case "evening":
      return "#D13438"; // Red
    default:
      return "#0078D4"; // Blue
  }
}
