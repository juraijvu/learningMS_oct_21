// Time slot utility functions for schedule management

export interface TimeSlot {
  value: string; // "09:00-11:00"
  label: string; // "9:00 AM - 11:00 AM"
  startTime: string; // "09:00"
  endTime: string; // "11:00"
}

/**
 * Generates all available time slots from 9:00 AM to 9:00 PM
 * with 20-minute intervals and 2-hour duration
 */
export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // Start at 9:00 AM (540 minutes from midnight)
  // End at 9:00 PM (1260 minutes from midnight)
  // But last slot should start at 7:00 PM to end at 9:00 PM
  const startMinutes = 9 * 60; // 9:00 AM
  const endMinutes = 19 * 60; // 7:00 PM (last possible start time)
  const intervalMinutes = 20;
  const durationMinutes = 120; // 2 hours
  
  for (let minutes = startMinutes; minutes <= endMinutes; minutes += intervalMinutes) {
    const startHour = Math.floor(minutes / 60);
    const startMin = minutes % 60;
    
    const endTotalMinutes = minutes + durationMinutes;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMin = endTotalMinutes % 60;
    
    // Format times
    const startTime24 = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
    const endTime24 = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    
    const startTime12 = formatTo12Hour(startHour, startMin);
    const endTime12 = formatTo12Hour(endHour, endMin);
    
    slots.push({
      value: `${startTime24}-${endTime24}`,
      label: `${startTime12} - ${endTime12}`,
      startTime: startTime24,
      endTime: endTime24,
    });
  }
  
  return slots;
}

/**
 * Converts 24-hour format to 12-hour format with AM/PM
 */
function formatTo12Hour(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute === 0 ? '' : `:${minute.toString().padStart(2, '0')}`;
  
  return `${displayHour}${displayMinute} ${period}`;
}

/**
 * Parses a time slot string (e.g., "09:00-11:00") into start and end times
 */
export function parseTimeSlot(timeSlot: string): { startTime: string; endTime: string } | null {
  const match = timeSlot.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
  if (!match) return null;
  
  return {
    startTime: match[1],
    endTime: match[2],
  };
}

/**
 * Checks if two time slots overlap
 */
export function doTimeSlotsOverlap(slot1: string, slot2: string): boolean {
  const parsed1 = parseTimeSlot(slot1);
  const parsed2 = parseTimeSlot(slot2);
  
  if (!parsed1 || !parsed2) return false;
  
  const start1 = timeToMinutes(parsed1.startTime);
  const end1 = timeToMinutes(parsed1.endTime);
  const start2 = timeToMinutes(parsed2.startTime);
  const end2 = timeToMinutes(parsed2.endTime);
  
  // Two time slots overlap if one starts before the other ends
  return start1 < end2 && start2 < end1;
}

/**
 * Converts time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Validates if a time slot is in the correct format and within allowed hours
 */
export function isValidTimeSlot(timeSlot: string): boolean {
  const parsed = parseTimeSlot(timeSlot);
  if (!parsed) return false;
  
  const startMinutes = timeToMinutes(parsed.startTime);
  const endMinutes = timeToMinutes(parsed.endTime);
  
  // Check if start time is between 9:00 AM and 7:00 PM
  const minStart = 9 * 60; // 9:00 AM
  const maxStart = 19 * 60; // 7:00 PM
  
  // Check if duration is exactly 2 hours
  const duration = endMinutes - startMinutes;
  
  return startMinutes >= minStart && 
         startMinutes <= maxStart && 
         duration === 120 && 
         endMinutes <= 21 * 60; // End by 9:00 PM
}