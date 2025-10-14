// Simple iCal parser for meal calendar events
export interface ICalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

export const parseICalendar = (icalData: string): ICalEvent[] => {
  const events: ICalEvent[] = [];
  
  // Split by VEVENT blocks
  const eventBlocks = icalData.split('BEGIN:VEVENT');
  
  console.log('Parsing iCal, found event blocks:', eventBlocks.length - 1);
  
  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i];
    const endIndex = block.indexOf('END:VEVENT');
    if (endIndex === -1) continue;
    
    const eventData = block.substring(0, endIndex);
    
    // Extract fields - handle line breaks in iCal format
    const cleanData = eventData.replace(/\r\n\s+/g, ''); // Handle continued lines
    
    const uidMatch = cleanData.match(/UID:([^\r\n]+)/);
    const summaryMatch = cleanData.match(/SUMMARY:([^\r\n]+)/);
    const dtStartMatch = cleanData.match(/DTSTART(?:;[^:]+)?:([^\r\n]+)/);
    const dtEndMatch = cleanData.match(/DTEND(?:;[^:]+)?:([^\r\n]+)/);
    
    if (summaryMatch && dtStartMatch) {
      const uid = uidMatch ? uidMatch[1].trim() : `event-${i}`;
      const summary = summaryMatch[1].trim();
      const dtStart = dtStartMatch[1].trim();
      const dtEnd = dtEndMatch ? dtEndMatch[1].trim() : dtStart;
      
      console.log(`Event ${i}: ${summary}, Start: ${dtStart}, End: ${dtEnd}`);
      
      // Parse date/datetime
      const startDate = parseICalDate(dtStart);
      const endDate = parseICalDate(dtEnd);
      
      if (startDate && endDate) {
        events.push({
          id: uid,
          title: summary,
          start: startDate,
          end: endDate,
        });
        console.log(`  Parsed: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      } else {
        console.warn(`  Failed to parse dates for: ${summary}`);
      }
    }
  }
  
  console.log('Total events parsed:', events.length);
  return events;
};

const parseICalDate = (dateString: string): Date | null => {
  try {
    const trimmed = dateString.trim();
    
    // Check if it has a 'T' separator for time
    const hasTime = trimmed.includes('T');
    
    // Remove T and Z for parsing
    const cleanDate = trimmed.replace(/[TZ]/g, '');
    
    // Format: YYYYMMDD or YYYYMMDDHHMMSS
    if (cleanDate.length >= 8) {
      const year = parseInt(cleanDate.substring(0, 4));
      const month = parseInt(cleanDate.substring(4, 6)) - 1; // JS months are 0-indexed
      const day = parseInt(cleanDate.substring(6, 8));
      
      if (hasTime && cleanDate.length >= 14) {
        // Has time component
        const hour = parseInt(cleanDate.substring(8, 10));
        const minute = parseInt(cleanDate.substring(10, 12));
        const second = parseInt(cleanDate.substring(12, 14));
        return new Date(year, month, day, hour, minute, second);
      } else {
        // Date only - set to noon to avoid timezone issues
        return new Date(year, month, day, 12, 0, 0);
      }
    }
  } catch (error) {
    console.error('Error parsing iCal date:', dateString, error);
  }
  
  return null;
};

