import type { 
  Employee, 
  Shift, 
  TaskAssignment, 
  ShiftTemplate,
  InsertEmployee, 
  InsertShift, 
  InsertTaskAssignment, 
  InsertShiftTemplate 
} from "@shared/schema";
import { IStorage } from "./storage";

const Database = require('../models/database');

export class SQLiteStorage implements IStorage {
  private db: any;

  constructor() {
    this.db = new Database();
  }

  async getEmployees(): Promise<Employee[]> {
    return await this.db.getEmployees();
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const employees = await this.db.getEmployees();
    return employees.find((emp: Employee) => emp.id === id);
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    return await this.db.addEmployee(employee.name, employee.role, employee.department);
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    // Implementation for updating employee
    const existing = await this.getEmployee(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...employee };
    // Note: This would require implementing updateEmployee in database.js
    return updated;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    // Implementation for deleting employee
    // Note: This would require implementing deleteEmployee in database.js
    return true;
  }

  async getShifts(): Promise<Shift[]> {
    return await this.db.getShifts();
  }

  async getShiftsByWeek(weekId: string): Promise<Shift[]> {
    const shifts = await this.db.getShifts();
    return shifts.filter((shift: Shift) => shift.weekId === weekId);
  }

  async getShiftsByEmployee(employeeId: number): Promise<Shift[]> {
    const shifts = await this.db.getShifts();
    return shifts.filter((shift: Shift) => shift.employeeId === employeeId);
  }

  async createShift(shift: InsertShift): Promise<Shift> {
    return await this.db.addShift(
      shift.employeeId, 
      shift.dayOfWeek, 
      shift.startTime, 
      shift.endTime
    );
  }

  async updateShift(id: number, shift: Partial<InsertShift>): Promise<Shift | undefined> {
    // Implementation for updating shift
    const existing = await this.getShiftById(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...shift };
    return updated;
  }

  async deleteShift(id: number): Promise<boolean> {
    // Implementation for deleting shift
    return true;
  }

  async getTaskAssignments(): Promise<TaskAssignment[]> {
    // Simplified task assignments - return empty for now
    return [];
  }

  async getTaskAssignmentsByShift(shiftId: number): Promise<TaskAssignment[]> {
    const assignments = await this.getTaskAssignments();
    return assignments.filter(ta => ta.shiftId === shiftId);
  }

  async createTaskAssignment(taskAssignment: InsertTaskAssignment): Promise<TaskAssignment> {
    // Implementation for creating task assignment
    const id = Math.floor(Math.random() * 1000000);
    return { id, ...taskAssignment };
  }

  async updateTaskAssignment(id: number, taskAssignment: Partial<InsertTaskAssignment>): Promise<TaskAssignment | undefined> {
    // Implementation for updating task assignment
    return undefined;
  }

  async deleteTaskAssignment(id: number): Promise<boolean> {
    return true;
  }

  async getShiftTemplates(): Promise<ShiftTemplate[]> {
    // Return basic shift templates
    return [
      { id: 1, name: "Morning Shift", startTime: "08:00", endTime: "16:00", duration: 8, color: "#0078D4" },
      { id: 2, name: "Afternoon Shift", startTime: "10:00", endTime: "18:00", duration: 8, color: "#8A2BE2" },
      { id: 3, name: "Evening Shift", startTime: "12:00", endTime: "20:00", duration: 8, color: "#FF6347" }
    ];
  }

  async createShiftTemplate(template: InsertShiftTemplate): Promise<ShiftTemplate> {
    const id = Math.floor(Math.random() * 1000000);
    return { id, ...template };
  }

  async generateSchedule(filters: {
    employees: number[];
    weekId: string;
    phoneHours: number;
    chatHours: number;
    emailHours: number;
    shiftDistribution: string[];
  }): Promise<{ shifts: Shift[]; taskAssignments: TaskAssignment[] }> {
    // Simplified auto-scheduling logic
    const shifts: Shift[] = [];
    const taskAssignments: TaskAssignment[] = [];

    // Generate basic shifts for selected employees
    for (const employeeId of filters.employees) {
      for (let day = 0; day < 7; day++) {
        const shift: Shift = {
          id: Math.floor(Math.random() * 1000000),
          employeeId,
          dayOfWeek: day,
          startTime: "08:00",
          endTime: "16:00",
          shiftType: "shift_8_16",
          weekId: filters.weekId
        };
        shifts.push(shift);

        // Add basic task assignments
        const phoneTask: TaskAssignment = {
          id: Math.floor(Math.random() * 1000000),
          shiftId: shift.id,
          taskType: "telephone",
          startTime: "08:00",
          endTime: "12:00",
          duration: Math.floor(filters.phoneHours / filters.employees.length)
        };
        taskAssignments.push(phoneTask);
      }
    }

    return { shifts, taskAssignments };
  }

  private async getShiftById(id: number): Promise<Shift | undefined> {
    const shifts = await this.getShifts();
    return shifts.find(shift => shift.id === id);
  }
}

export const storage = new SQLiteStorage();