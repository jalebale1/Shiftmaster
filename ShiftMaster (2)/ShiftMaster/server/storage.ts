import type {
  Employee, 
  InsertEmployee,
  Shift, 
  InsertShift,
  TaskAssignment,
  InsertTaskAssignment,
  ShiftTemplate, 
  InsertShiftTemplate
} from "@shared/schema";

export interface IStorage {
  // Employee methods
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;

  // Shift methods
  getShifts(): Promise<Shift[]>;
  getShiftsByWeek(weekId: string): Promise<Shift[]>;
  getShiftsByEmployee(employeeId: number): Promise<Shift[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: number, shift: Partial<InsertShift>): Promise<Shift | undefined>;
  deleteShift(id: number): Promise<boolean>;

  // Task Assignment methods
  getTaskAssignments(): Promise<TaskAssignment[]>;
  getTaskAssignmentsByShift(shiftId: number): Promise<TaskAssignment[]>;
  createTaskAssignment(taskAssignment: InsertTaskAssignment): Promise<TaskAssignment>;
  updateTaskAssignment(id: number, taskAssignment: Partial<InsertTaskAssignment>): Promise<TaskAssignment | undefined>;
  deleteTaskAssignment(id: number): Promise<boolean>;

  // Shift Template methods (simplified, removing A/B testing)
  getShiftTemplates(): Promise<ShiftTemplate[]>;
  createShiftTemplate(template: InsertShiftTemplate): Promise<ShiftTemplate>;

  // Auto-scheduling method (simplified)
  generateSchedule(filters: {
    employees: number[];
    weekId: string;
    phoneHours: number;
    chatHours: number;
    emailHours: number;
    shiftDistribution: string[];
    minAgentsWeekdays: number;
    minWorkersWeekend: number;
    // Weekday shift minimums
    minAgents08_16Weekdays: number;
    minAgents10_18Weekdays: number;
    minAgents12_20Weekdays: number;
    // Weekend shift minimums
    minAgents08_16Weekend: number;
    minAgents10_18Weekend: number;
    minAgents12_20Weekend: number;
  }): Promise<{ shifts: Shift[]; taskAssignments: TaskAssignment[] }>;
}

export class MemStorage implements IStorage {
  private employees: Map<number, Employee>;
  private shifts: Map<number, Shift>;
  private taskAssignments: Map<number, TaskAssignment>;
  private shiftTemplates: Map<number, ShiftTemplate>;
  private currentEmployeeId: number;
  private currentShiftId: number;
  private currentTaskAssignmentId: number;
  private currentTemplateId: number;

  constructor() {
    this.employees = new Map();
    this.shifts = new Map();
    this.taskAssignments = new Map();
    this.shiftTemplates = new Map();
    this.currentEmployeeId = 1;
    this.currentShiftId = 1;
    this.currentTaskAssignmentId = 1;
    this.currentTemplateId = 1;

    // Initialize with default data
    this.initializeData();
  }

  private initializeData() {
    // Create sample reservation center employees
    const sampleEmployees = [
      { name: "John Doe", role: "Customer Service Agent", department: "Reservations", initials: "JD", color: "#0078D4" },
      { name: "Maria Silva", role: "Senior Agent", department: "Reservations", initials: "MS", color: "#FF8C00" },
      { name: "Robert Johnson", role: "Team Lead", department: "Reservations", initials: "RJ", color: "#107C10" },
      { name: "Sarah Wilson", role: "Customer Service Agent", department: "Reservations", initials: "SW", color: "#D13438" },
      { name: "David Brown", role: "Customer Service Agent", department: "Reservations", initials: "DB", color: "#8764B8" },
      { name: "Ana Milanković", role: "Customer Service Agent", department: "Reservations", initials: "AM", color: "#EC4899" },
      { name: "Dominik Špićek", role: "Customer Service Agent", department: "Reservations", initials: "DS", color: "#06B6D4" },
      { name: "Ivana Grdan", role: "Customer Service Agent", department: "Reservations", initials: "IG", color: "#84CC16" },
      { name: "Ivana Tušek", role: "Customer Service Agent", department: "Reservations", initials: "IT", color: "#F97316" },
      { name: "Ines Kupus", role: "Customer Service Agent", department: "Reservations", initials: "IK", color: "#A855F7" },
      { name: "Tomislav Bogomolec", role: "Customer Service Agent", department: "Reservations", initials: "TB2", color: "#059669" },
      { name: "Jakov Torković", role: "Customer Service Agent", department: "Reservations", initials: "JT", color: "#DC2626" },
    ];

    sampleEmployees.forEach(emp => {
      const employee: Employee = { ...emp, id: this.currentEmployeeId++ };
      this.employees.set(employee.id, employee);
    });

    // Create sample shifts for reservation center (08:00-16:00, 10:00-18:00, 12:00-20:00)
    const sampleShifts = [
      // Week 1 - 12 employees with varied shifts
      { employeeId: 1, dayOfWeek: 0, startTime: "08:00", endTime: "16:00", shiftType: "shift_8_16", weekId: "current" },
      { employeeId: 1, dayOfWeek: 1, startTime: "10:00", endTime: "18:00", shiftType: "shift_10_18", weekId: "current" },
      { employeeId: 1, dayOfWeek: 3, startTime: "12:00", endTime: "20:00", shiftType: "shift_12_20", weekId: "current" },
      { employeeId: 2, dayOfWeek: 0, startTime: "10:00", endTime: "18:00", shiftType: "shift_10_18", weekId: "current" },
      { employeeId: 2, dayOfWeek: 2, startTime: "08:00", endTime: "16:00", shiftType: "shift_8_16", weekId: "current" },
      { employeeId: 2, dayOfWeek: 4, startTime: "12:00", endTime: "20:00", shiftType: "shift_12_20", weekId: "current" },
      { employeeId: 3, dayOfWeek: 1, startTime: "12:00", endTime: "20:00", shiftType: "shift_12_20", weekId: "current" },
      { employeeId: 3, dayOfWeek: 3, startTime: "08:00", endTime: "16:00", shiftType: "shift_8_16", weekId: "current" },
      { employeeId: 4, dayOfWeek: 0, startTime: "12:00", endTime: "20:00", shiftType: "shift_12_20", weekId: "current" },
      { employeeId: 4, dayOfWeek: 2, startTime: "10:00", endTime: "18:00", shiftType: "shift_10_18", weekId: "current" },
      { employeeId: 5, dayOfWeek: 1, startTime: "08:00", endTime: "16:00", shiftType: "shift_8_16", weekId: "current" },
      { employeeId: 5, dayOfWeek: 4, startTime: "10:00", endTime: "18:00", shiftType: "shift_10_18", weekId: "current" },
      { employeeId: 6, dayOfWeek: 0, startTime: "08:00", endTime: "16:00", shiftType: "shift_8_16", weekId: "current" },
      { employeeId: 6, dayOfWeek: 2, startTime: "12:00", endTime: "20:00", shiftType: "shift_12_20", weekId: "current" },
      { employeeId: 6, dayOfWeek: 5, startTime: "10:00", endTime: "18:00", shiftType: "shift_10_18", weekId: "current" },
      { employeeId: 7, dayOfWeek: 1, startTime: "10:00", endTime: "18:00", shiftType: "shift_10_18", weekId: "current" },
      { employeeId: 7, dayOfWeek: 3, startTime: "12:00", endTime: "20:00", shiftType: "shift_12_20", weekId: "current" },
      { employeeId: 8, dayOfWeek: 0, startTime: "12:00", endTime: "20:00", shiftType: "shift_12_20", weekId: "current" },
      { employeeId: 8, dayOfWeek: 2, startTime: "08:00", endTime: "16:00", shiftType: "shift_8_16", weekId: "current" },
      { employeeId: 8, dayOfWeek: 4, startTime: "10:00", endTime: "18:00", shiftType: "shift_10_18", weekId: "current" },
      { employeeId: 9, dayOfWeek: 1, startTime: "12:00", endTime: "20:00", shiftType: "shift_12_20", weekId: "current" },
      { employeeId: 9, dayOfWeek: 5, startTime: "08:00", endTime: "16:00", shiftType: "shift_8_16", weekId: "current" },
      { employeeId: 10, dayOfWeek: 0, startTime: "10:00", endTime: "18:00", shiftType: "shift_10_18", weekId: "current" },
      { employeeId: 10, dayOfWeek: 3, startTime: "08:00", endTime: "16:00", shiftType: "shift_8_16", weekId: "current" },
      { employeeId: 11, dayOfWeek: 2, startTime: "12:00", endTime: "20:00", shiftType: "shift_12_20", weekId: "current" },
      { employeeId: 11, dayOfWeek: 4, startTime: "08:00", endTime: "16:00", shiftType: "shift_8_16", weekId: "current" },
      { employeeId: 12, dayOfWeek: 1, startTime: "08:00", endTime: "16:00", shiftType: "shift_8_16", weekId: "current" },
      { employeeId: 12, dayOfWeek: 5, startTime: "12:00", endTime: "20:00", shiftType: "shift_12_20", weekId: "current" },
    ];

    sampleShifts.forEach(shift => {
      const newShift: Shift = { ...shift, id: this.currentShiftId++ };
      this.shifts.set(newShift.id, newShift);
    });

    // Create sample task assignments for each shift
    const sampleTaskAssignments = [
      // Shift 1 (John, Monday 08:00-16:00) - 4h phone, 1h chat, 3h email
      { shiftId: 1, taskType: "telephone", startTime: "08:00", endTime: "12:00", duration: 4 },
      { shiftId: 1, taskType: "chat", startTime: "12:00", endTime: "13:00", duration: 1 },
      { shiftId: 1, taskType: "email_other", startTime: "13:00", endTime: "16:00", duration: 3 },
      
      // Shift 2 (John, Tuesday 10:00-18:00) - 4h phone, 1h chat, 3h email
      { shiftId: 2, taskType: "telephone", startTime: "10:00", endTime: "14:00", duration: 4 },
      { shiftId: 2, taskType: "chat", startTime: "14:00", endTime: "15:00", duration: 1 },
      { shiftId: 2, taskType: "email_other", startTime: "15:00", endTime: "18:00", duration: 3 },
      
      // Shift 3 (John, Thursday 12:00-20:00) - 4h phone, 1h chat, 3h email
      { shiftId: 3, taskType: "telephone", startTime: "12:00", endTime: "16:00", duration: 4 },
      { shiftId: 3, taskType: "chat", startTime: "16:00", endTime: "17:00", duration: 1 },
      { shiftId: 3, taskType: "email_other", startTime: "17:00", endTime: "20:00", duration: 3 },
    ];

    sampleTaskAssignments.forEach(task => {
      const newTask: TaskAssignment = { ...task, id: this.currentTaskAssignmentId++ };
      this.taskAssignments.set(newTask.id, newTask);
    });



    // Create default shift templates for reservation center
    const defaultTemplates = [
      { name: "Morning Shift", startTime: "08:00", endTime: "16:00", duration: 8, color: "#107C10" },
      { name: "Midday Shift", startTime: "10:00", endTime: "18:00", duration: 8, color: "#FF8C00" },
      { name: "Evening Shift", startTime: "12:00", endTime: "20:00", duration: 8, color: "#D13438" },
    ];

    defaultTemplates.forEach(template => {
      const newTemplate: ShiftTemplate = { ...template, id: this.currentTemplateId++ };
      this.shiftTemplates.set(newTemplate.id, newTemplate);
    });
  }

  // Employee methods
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = this.currentEmployeeId++;
    const employee: Employee = { 
      ...insertEmployee, 
      id,
      color: insertEmployee.color || "#0078D4"
    };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: number, updates: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;
    
    const updated = { ...employee, ...updates };
    this.employees.set(id, updated);
    return updated;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    return this.employees.delete(id);
  }

  // Shift methods
  async getShifts(): Promise<Shift[]> {
    return Array.from(this.shifts.values());
  }

  async getShiftsByWeek(weekId: string): Promise<Shift[]> {
    return Array.from(this.shifts.values()).filter(shift => shift.weekId === weekId);
  }

  async getShiftsByEmployee(employeeId: number): Promise<Shift[]> {
    return Array.from(this.shifts.values()).filter(shift => shift.employeeId === employeeId);
  }

  async createShift(insertShift: InsertShift): Promise<Shift> {
    const id = this.currentShiftId++;
    const shift: Shift = { 
      ...insertShift, 
      id,
      shiftType: insertShift.shiftType || "shift_8_16",
      weekId: insertShift.weekId || "current"
    };
    this.shifts.set(id, shift);
    return shift;
  }

  async updateShift(id: number, updates: Partial<InsertShift>): Promise<Shift | undefined> {
    const shift = this.shifts.get(id);
    if (!shift) return undefined;
    
    const updated = { ...shift, ...updates };
    this.shifts.set(id, updated);
    return updated;
  }

  async deleteShift(id: number): Promise<boolean> {
    return this.shifts.delete(id);
  }

  // Task Assignment methods
  async getTaskAssignments(): Promise<TaskAssignment[]> {
    return Array.from(this.taskAssignments.values());
  }

  async getTaskAssignmentsByShift(shiftId: number): Promise<TaskAssignment[]> {
    return Array.from(this.taskAssignments.values()).filter(task => task.shiftId === shiftId);
  }

  async createTaskAssignment(insertTaskAssignment: InsertTaskAssignment): Promise<TaskAssignment> {
    const id = this.currentTaskAssignmentId++;
    const taskAssignment: TaskAssignment = { ...insertTaskAssignment, id };
    this.taskAssignments.set(id, taskAssignment);
    return taskAssignment;
  }

  async updateTaskAssignment(id: number, updates: Partial<InsertTaskAssignment>): Promise<TaskAssignment | undefined> {
    const taskAssignment = this.taskAssignments.get(id);
    if (!taskAssignment) return undefined;
    
    const updated = { ...taskAssignment, ...updates };
    this.taskAssignments.set(id, updated);
    return updated;
  }

  async deleteTaskAssignment(id: number): Promise<boolean> {
    return this.taskAssignments.delete(id);
  }



  // Shift Template methods
  async getShiftTemplates(): Promise<ShiftTemplate[]> {
    return Array.from(this.shiftTemplates.values());
  }

  async createShiftTemplate(insertTemplate: InsertShiftTemplate): Promise<ShiftTemplate> {
    const id = this.currentTemplateId++;
    const template: ShiftTemplate = { ...insertTemplate, id };
    this.shiftTemplates.set(id, template);
    return template;
  }

  // Auto-scheduling method for reservation center
  async generateSchedule(filters: {
    employees: number[];
    weekId: string;
    phoneHours: number;
    chatHours: number;
    emailHours: number;
    shiftDistribution: string[];
    minAgentsWeekdays: number;
    minWorkersWeekend: number;
    // Weekday shift minimums
    minAgents08_16Weekdays: number;
    minAgents10_18Weekdays: number;
    minAgents12_20Weekdays: number;
    // Weekend shift minimums
    minAgents08_16Weekend: number;
    minAgents10_18Weekend: number;
    minAgents12_20Weekend: number;
  }): Promise<{ shifts: Shift[]; taskAssignments: TaskAssignment[] }> {
    const shifts: Shift[] = [];
    const taskAssignments: TaskAssignment[] = [];
    
    const shiftTypes = ["shift_8_16", "shift_10_18", "shift_12_20"];
    const shiftTimes = {
      "shift_8_16": { start: "08:00", end: "16:00" },
      "shift_10_18": { start: "10:00", end: "18:00" },
      "shift_12_20": { start: "12:00", end: "20:00" }
    };

    // Generate shifts with specific shift-type minimum requirements for 2 weeks
    for (let day = 0; day < 14; day++) {
      const dayOfWeek = day % 7; // Get day within the week (0-6)
      const isWeekend = dayOfWeek >= 5; // Saturday = 5, Sunday = 6
      
      // Get shift-specific minimums based on weekend/weekday
      const shiftMinimums = isWeekend ? {
        "shift_8_16": filters.minAgents08_16Weekend,
        "shift_10_18": filters.minAgents10_18Weekend,
        "shift_12_20": filters.minAgents12_20Weekend
      } : {
        "shift_8_16": filters.minAgents08_16Weekdays,
        "shift_10_18": filters.minAgents10_18Weekdays,
        "shift_12_20": filters.minAgents12_20Weekdays
      };
      
      const availableEmployees = [...filters.employees];
      const dayShifts: Shift[] = [];
      let employeeIndex = 0;
      
      // Create shifts to meet minimum requirements for each shift type
      for (const [shiftType, minRequired] of Object.entries(shiftMinimums)) {
        const times = shiftTimes[shiftType as keyof typeof shiftTimes];
        
        for (let i = 0; i < minRequired && employeeIndex < availableEmployees.length; i++) {
          const employeeId = availableEmployees[employeeIndex++];
          
          const shift: Shift = {
            id: this.currentShiftId++,
            employeeId,
            dayOfWeek: day,
            startTime: times.start,
            endTime: times.end,
            shiftType,
            weekId: filters.weekId
          };
          shifts.push(shift);
          dayShifts.push(shift);
        }
      }
      
      // Add additional shifts with overall minimum requirements if more employees available
      const generalMinWorkers = isWeekend ? filters.minWorkersWeekend : filters.minAgentsWeekdays;
      const currentShiftCount = dayShifts.length;
      
      if (currentShiftCount < generalMinWorkers && employeeIndex < availableEmployees.length) {
        const additionalNeeded = generalMinWorkers - currentShiftCount;
        
        for (let i = 0; i < additionalNeeded && employeeIndex < availableEmployees.length; i++) {
          const employeeId = availableEmployees[employeeIndex++];
          const shiftTypeIndex = i % shiftTypes.length;
          const shiftType = shiftTypes[shiftTypeIndex];
          const times = shiftTimes[shiftType as keyof typeof shiftTimes];
          
          const shift: Shift = {
            id: this.currentShiftId++,
            employeeId,
            dayOfWeek: day,
            startTime: times.start,
            endTime: times.end,
            shiftType,
            weekId: filters.weekId
          };
          shifts.push(shift);
          dayShifts.push(shift);
        }
      }
      
      // Generate task assignments for all shifts created this day
      dayShifts.forEach(shift => {
        const shiftTimes2 = shiftTimes[shift.shiftType as keyof typeof shiftTimes];
        
        // Create task assignments based on filter requirements
        const totalHours = filters.phoneHours + filters.chatHours + filters.emailHours;
        if (totalHours === 8) { // Standard 8-hour shift
          // Phone task
          const phoneTask: TaskAssignment = {
            id: this.currentTaskAssignmentId++,
            shiftId: shift.id,
            taskType: "telephone",
            startTime: shiftTimes2.start,
            endTime: this.addHours(shiftTimes2.start, filters.phoneHours),
            duration: filters.phoneHours
          };
          taskAssignments.push(phoneTask);

          // Chat task
          const chatTask: TaskAssignment = {
            id: this.currentTaskAssignmentId++,
            shiftId: shift.id,
            taskType: "chat",
            startTime: phoneTask.endTime,
            endTime: this.addHours(phoneTask.endTime, filters.chatHours),
            duration: filters.chatHours
          };
          taskAssignments.push(chatTask);

          // Email/Other task
          const emailTask: TaskAssignment = {
            id: this.currentTaskAssignmentId++,
            shiftId: shift.id,
            taskType: "email_other",
            startTime: chatTask.endTime,
            endTime: shiftTimes2.end,
            duration: filters.emailHours
          };
          taskAssignments.push(emailTask);
        }
      });
    }

    return { shifts, taskAssignments };
  }

  private addHours(time: string, hours: number): string {
    const [h, m] = time.split(':').map(Number);
    const newHour = h + hours;
    return `${newHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
}

export const storage = new MemStorage();
