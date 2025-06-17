import { z } from "zod";

// Core data types for ShiftMaster
export interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  initials?: string;
  color?: string;
  active?: number;
  created_at?: string;
}

export interface Shift {
  id: number;
  employeeId: number;
  dayOfWeek: number; // 0 = Monday, 6 = Sunday
  startTime: string; // "08:00"
  endTime: string; // "16:00"
  shiftType: string; // shift_8_16, shift_10_18, shift_12_20
  weekId: string;
}

export interface TaskAssignment {
  id: number;
  shiftId: number;
  taskType: string; // telephone, chat, email_other
  startTime: string; // "08:00"
  endTime: string; // "12:00"
  duration: number; // hours
}

export interface ShiftTemplate {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  color: string;
}

// Zod validation schemas for form inputs
export const insertEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  department: z.string().min(1, "Department is required"),
  initials: z.string().optional(),
  color: z.string().optional(),
});

export const insertShiftSchema = z.object({
  employeeId: z.number().min(1, "Employee is required"),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  shiftType: z.string().default("shift_8_16"),
  weekId: z.string().default("current"),
});

export const insertTaskAssignmentSchema = z.object({
  shiftId: z.number().min(1, "Shift is required"),
  taskType: z.string().min(1, "Task type is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  duration: z.number().min(1, "Duration must be at least 1 hour"),
});

export const insertShiftTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  duration: z.number().min(1, "Duration must be at least 1 hour"),
  color: z.string().min(1, "Color is required"),
});

// Type definitions for form inputs
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type InsertTaskAssignment = z.infer<typeof insertTaskAssignmentSchema>;
export type InsertShiftTemplate = z.infer<typeof insertShiftTemplateSchema>;