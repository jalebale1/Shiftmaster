const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/shiftmaster.db');

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  init() {
    // Create employees table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'Employee',
        department TEXT DEFAULT 'General'
      )
    `);

    // Create shifts table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS shifts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employeeId INTEGER NOT NULL,
        dayOfWeek INTEGER NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        FOREIGN KEY (employeeId) REFERENCES employees (id)
      )
    `);

    // Insert sample data
    this.seedData();
  }

  seedData() {
    const employees = [
      { name: 'John Doe', role: 'Manager', department: 'Operations' },
      { name: 'Jane Smith', role: 'Employee', department: 'Customer Service' },
      { name: 'Mike Johnson', role: 'Employee', department: 'Customer Service' },
      { name: 'Sarah Wilson', role: 'Supervisor', department: 'Operations' }
    ];

    employees.forEach(emp => {
      this.db.run(
        'INSERT OR IGNORE INTO employees (name, role, department) VALUES (?, ?, ?)',
        [emp.name, emp.role, emp.department]
      );
    });

    // Sample shifts
    const shifts = [
      { employeeId: 1, dayOfWeek: 0, startTime: '08:00', endTime: '16:00' },
      { employeeId: 2, dayOfWeek: 0, startTime: '10:00', endTime: '18:00' },
      { employeeId: 1, dayOfWeek: 1, startTime: '08:00', endTime: '16:00' },
      { employeeId: 3, dayOfWeek: 1, startTime: '12:00', endTime: '20:00' }
    ];

    shifts.forEach(shift => {
      this.db.run(
        'INSERT OR IGNORE INTO shifts (employeeId, dayOfWeek, startTime, endTime) VALUES (?, ?, ?, ?)',
        [shift.employeeId, shift.dayOfWeek, shift.startTime, shift.endTime]
      );
    });
  }

  getEmployees() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM employees', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getShifts() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM shifts', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  addEmployee(name, role = 'Employee', department = 'General') {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO employees (name, role, department) VALUES (?, ?, ?)',
        [name, role, department],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, name, role, department });
        }
      );
    });
  }

  addShift(employeeId, dayOfWeek, startTime, endTime) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO shifts (employeeId, dayOfWeek, startTime, endTime) VALUES (?, ?, ?, ?)',
        [employeeId, dayOfWeek, startTime, endTime],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, employeeId, dayOfWeek, startTime, endTime });
        }
      );
    });
  }
}

module.exports = new Database();