import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertShiftSchema, insertTaskAssignmentSchema, insertShiftTemplateSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Employee routes
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: "Invalid employee data" });
    }
  });

  app.put("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, updates);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Invalid employee data" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEmployee(id);
      if (!deleted) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Shift routes
  app.get("/api/shifts", async (req, res) => {
    try {
      const weekId = req.query.weekId as string || "current";
      const shifts = await storage.getShiftsByWeek(weekId);
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  app.get("/api/shifts/employee/:employeeId", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const shifts = await storage.getShiftsByEmployee(employeeId);
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee shifts" });
    }
  });

  app.post("/api/shifts", async (req, res) => {
    try {
      const validatedData = insertShiftSchema.parse(req.body);
      const shift = await storage.createShift(validatedData);
      res.status(201).json(shift);
    } catch (error) {
      res.status(400).json({ message: "Invalid shift data" });
    }
  });

  app.put("/api/shifts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertShiftSchema.partial().parse(req.body);
      const shift = await storage.updateShift(id, updates);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      res.json(shift);
    } catch (error) {
      res.status(400).json({ message: "Invalid shift data" });
    }
  });

  app.delete("/api/shifts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteShift(id);
      if (!deleted) {
        return res.status(404).json({ message: "Shift not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete shift" });
    }
  });

  // Bulk save shifts endpoint for drag-and-drop editing
  app.post("/api/save-shifts", async (req, res) => {
    try {
      const { shifts } = req.body;
      
      if (!Array.isArray(shifts)) {
        return res.status(400).json({ message: "Shifts must be an array" });
      }

      const results = [];
      const allShifts = await storage.getShifts();
      
      for (const shiftUpdate of shifts) {
        const { employeeId, dayOfWeek, startTime, endTime, action } = shiftUpdate;
        
        if (action === "delete") {
          // Find and delete existing shift for this employee and day
          const existingShift = allShifts.find(s => 
            s.employeeId === employeeId && s.dayOfWeek === dayOfWeek
          );
          
          if (existingShift) {
            await storage.deleteShift(existingShift.id);
            results.push({ action: "deleted", employeeId, dayOfWeek, id: existingShift.id });
          }
        } else if (action === "upsert" && startTime && endTime) {
          // Check if shift already exists for this employee and day
          const existingShift = allShifts.find(s => 
            s.employeeId === employeeId && s.dayOfWeek === dayOfWeek
          );
          
          const shiftData = {
            employeeId,
            dayOfWeek,
            startTime,
            endTime,
            shiftType: `shift_${startTime.replace(':', '_')}_${endTime.replace(':', '_')}`,
            weekId: "current"
          };
          
          if (existingShift) {
            // Update existing shift
            const updated = await storage.updateShift(existingShift.id, shiftData);
            results.push({ action: "updated", shift: updated });
          } else {
            // Create new shift
            const created = await storage.createShift(shiftData);
            results.push({ action: "created", shift: created });
          }
        }
      }
      
      res.json({ 
        message: "Shifts processed successfully", 
        results,
        totalProcessed: shifts.length 
      });
    } catch (error) {
      console.error("Error saving shifts:", error);
      res.status(500).json({ message: "Failed to save shifts" });
    }
  });

  // Clear all shifts endpoint
  app.post("/api/clear-all-shifts", async (req, res) => {
    try {
      const allShifts = await storage.getShifts();
      let deletedCount = 0;
      
      for (const shift of allShifts) {
        const deleted = await storage.deleteShift(shift.id);
        if (deleted) deletedCount++;
      }
      
      res.json({ 
        message: "All shifts cleared successfully", 
        deletedCount 
      });
    } catch (error) {
      console.error("Error clearing shifts:", error);
      res.status(500).json({ message: "Failed to clear shifts" });
    }
  });

  // Shift Template routes
  app.get("/api/shift-templates", async (req, res) => {
    try {
      const templates = await storage.getShiftTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shift templates" });
    }
  });

  app.post("/api/shift-templates", async (req, res) => {
    try {
      const validatedData = insertShiftTemplateSchema.parse(req.body);
      const template = await storage.createShiftTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ message: "Invalid shift template data" });
    }
  });

  // Analytics endpoint
  app.get("/api/analytics", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      const shifts = await storage.getShiftsByWeek("current");
      
      const totalHours = shifts.reduce((sum, shift) => {
        const startTime = shift.startTime.split(':').map(Number);
        const endTime = shift.endTime.split(':').map(Number);
        const duration = (endTime[0] - startTime[0]) + ((endTime[1] - startTime[1]) / 60);
        return sum + duration;
      }, 0);
      const totalEmployees = employees.length;
      const totalSlots = 7 * totalEmployees; // 7 days per week
      const filledSlots = shifts.length;
      const coverage = Math.round((filledSlots / totalSlots) * 100);
      
      // Simple conflict detection - check for overlapping shifts
      const conflicts = [];
      for (let i = 0; i < shifts.length; i++) {
        for (let j = i + 1; j < shifts.length; j++) {
          const shift1 = shifts[i];
          const shift2 = shifts[j];
          
          if (shift1.employeeId === shift2.employeeId && 
              shift1.dayOfWeek === shift2.dayOfWeek) {
            // Check time overlap
            const start1 = parseInt(shift1.startTime.replace(":", ""));
            const end1 = parseInt(shift1.endTime.replace(":", ""));
            const start2 = parseInt(shift2.startTime.replace(":", ""));
            const end2 = parseInt(shift2.endTime.replace(":", ""));
            
            if ((start1 < end2 && end1 > start2)) {
              conflicts.push({ shift1: shift1.id, shift2: shift2.id });
            }
          }
        }
      }

      const analytics = {
        totalHours,
        coverage,
        conflicts: conflicts.length,
        employees: totalEmployees,
      };

      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Export endpoint
  app.get("/api/export", async (req, res) => {
    try {
      const format = req.query.format as string || "json";
      const employees = await storage.getEmployees();
      const shifts = await storage.getShiftsByWeek("current");
      
      const data = {
        employees,
        shifts,
        exportedAt: new Date().toISOString(),
      };

      if (format === "csv") {
        // Simple CSV export
        let csv = "Employee,Day,Start Time,End Time,Duration\n";
        shifts.forEach(shift => {
          const employee = employees.find(e => e.id === shift.employeeId);
          const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
          const startTime = shift.startTime.split(':').map(Number);
          const endTime = shift.endTime.split(':').map(Number);
          const duration = (endTime[0] - startTime[0]) + ((endTime[1] - startTime[1]) / 60);
          csv += `${employee?.name || "Unknown"},${days[shift.dayOfWeek]},${shift.startTime},${shift.endTime},${duration}h\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="schedule.csv"');
        res.send(csv);
      } else {
        res.json(data);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Task Assignment routes
  app.get("/api/task-assignments", async (req, res) => {
    try {
      const taskAssignments = await storage.getTaskAssignments();
      res.json(taskAssignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task assignments" });
    }
  });

  app.get("/api/task-assignments/shift/:shiftId", async (req, res) => {
    try {
      const shiftId = parseInt(req.params.shiftId);
      const taskAssignments = await storage.getTaskAssignmentsByShift(shiftId);
      res.json(taskAssignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task assignments for shift" });
    }
  });

  app.post("/api/task-assignments", async (req, res) => {
    try {
      const validatedData = insertTaskAssignmentSchema.parse(req.body);
      const taskAssignment = await storage.createTaskAssignment(validatedData);
      res.status(201).json(taskAssignment);
    } catch (error) {
      res.status(400).json({ message: "Invalid task assignment data" });
    }
  });

  // Auto-schedule generation endpoint
  app.post("/api/generate-schedule", async (req, res) => {
    try {
      const { 
        employees, weekId, phoneHours, chatHours, emailHours, shiftDistribution, 
        minAgentsWeekdays, minWorkersWeekend,
        minAgents08_16Weekdays, minAgents10_18Weekdays, minAgents12_20Weekdays,
        minAgents08_16Weekend, minAgents10_18Weekend, minAgents12_20Weekend
      } = req.body;
      const result = await storage.generateSchedule({
        employees,
        weekId: weekId || "current",
        phoneHours: phoneHours || 4,
        chatHours: chatHours || 1,
        emailHours: emailHours || 3,
        shiftDistribution: shiftDistribution || ["shift_8_16", "shift_10_18", "shift_12_20"],
        minAgentsWeekdays: minAgentsWeekdays || 2,
        minWorkersWeekend: minWorkersWeekend || 1,
        // Weekday shift minimums
        minAgents08_16Weekdays: minAgents08_16Weekdays || 1,
        minAgents10_18Weekdays: minAgents10_18Weekdays || 1,
        minAgents12_20Weekdays: minAgents12_20Weekdays || 1,
        // Weekend shift minimums
        minAgents08_16Weekend: minAgents08_16Weekend || 0,
        minAgents10_18Weekend: minAgents10_18Weekend || 1,
        minAgents12_20Weekend: minAgents12_20Weekend || 0
      });
      
      // Store generated shifts and tasks
      for (const shift of result.shifts) {
        await storage.createShift(shift);
      }
      for (const task of result.taskAssignments) {
        await storage.createTaskAssignment(task);
      }
      
      res.json({ message: "Schedule generated successfully", ...result });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate schedule" });
    }
  });

  // Save daily tasks endpoint
  app.post("/api/save-daily-tasks", async (req, res) => {
    try {
      const { tasks, dayOfWeek } = req.body;
      
      // Clear existing tasks for the day
      const allTasks = await storage.getTaskAssignments();
      const shiftsForDay = (await storage.getShifts()).filter(shift => shift.dayOfWeek === dayOfWeek);
      const shiftIds = shiftsForDay.map(shift => shift.id);
      
      // Delete existing tasks for these shifts
      for (const task of allTasks) {
        if (shiftIds.includes(task.shiftId)) {
          await storage.deleteTaskAssignment(task.id);
        }
      }
      
      // Create new tasks
      for (const task of tasks) {
        if (task.shiftId && task.taskType) {
          await storage.createTaskAssignment({
            shiftId: task.shiftId,
            startTime: task.startTime,
            endTime: `${parseInt(task.startTime.split(':')[0]) + task.duration}:00`,
            duration: task.duration,
            taskType: task.taskType
          });
        }
      }
      
      res.json({ message: "Daily tasks saved successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to save daily tasks" });
    }
  });

  // Auto-generate daily schedule endpoint
  app.post("/api/auto-generate-daily", async (req, res) => {
    try {
      const { dayOfWeek } = req.body;
      
      // Get shifts for the day
      const shiftsForDay = (await storage.getShifts()).filter(shift => shift.dayOfWeek === dayOfWeek);
      
      // Clear existing tasks
      const allTasks = await storage.getTaskAssignments();
      const shiftIds = shiftsForDay.map(shift => shift.id);
      
      for (const task of allTasks) {
        if (shiftIds.includes(task.shiftId)) {
          await storage.deleteTaskAssignment(task.id);
        }
      }
      
      // Generate new tasks based on shift times
      for (const shift of shiftsForDay) {
        const startHour = parseInt(shift.startTime.split(':')[0]);
        const endHour = parseInt(shift.endTime.split(':')[0]);
        
        for (let hour = startHour; hour < endHour; hour++) {
          let taskType = 'telephone'; // Default to telephone
          
          // Assign chat task for one hour per shift
          if (hour === startHour + 2) {
            taskType = 'chat';
          }
          // Assign email/other task for last 2 hours
          else if (hour >= endHour - 2) {
            taskType = 'email_other';
          }
          
          await storage.createTaskAssignment({
            shiftId: shift.id,
            startTime: `${hour}:00`,
            endTime: `${hour + 1}:00`,
            duration: 1,
            taskType
          });
        }
      }
      
      res.json({ message: "Daily schedule auto-generated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to auto-generate daily schedule" });
    }
  });

  // Schedule settings endpoints
  app.get("/api/schedule-settings", async (req, res) => {
    try {
      // Return default settings for now - in a real app this would be stored in database
      res.json({
        warnings: {
          tooManyTelephone: true,
          tooFewTelephone: true,
          multipleChatUsers: true,
        },
        criteria: {
          minTelephoneUsers: 2,
          maxTelephoneUsers: 6,
          maxChatUsers: 1,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get schedule settings" });
    }
  });

  app.post("/api/schedule-settings", async (req, res) => {
    try {
      // In a real app, save settings to database
      res.json({ message: "Settings saved successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to save schedule settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
