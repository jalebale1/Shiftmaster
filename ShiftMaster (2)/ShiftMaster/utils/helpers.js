// Time utilities
const formatTime = (time) => {
  if (!time) return '';
  return time.slice(0, 5); // HH:MM format
};

const getDayName = (dayIndex) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayIndex] || 'Unknown';
};

const validateTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return false;
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);
  return start < end;
};

// Employee utilities
const formatEmployeeName = (name) => {
  if (!name) return '';
  return name.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

// Error handling
const handleError = (res, error, message = 'Internal server error') => {
  console.error('Error:', error);
  res.status(500).json({ error: message });
};

module.exports = {
  formatTime,
  getDayName,
  validateTimeRange,
  formatEmployeeName,
  handleError
};