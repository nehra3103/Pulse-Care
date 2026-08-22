/**
 * Google Calendar & iCal Integration Helper
 */

/**
 * Generate Direct Google Calendar Add Event URL
 */
export function generateGoogleCalendarUrl({ title, description, location = 'Healthcare Medical Clinic', startDateStr, timeSlot, durationMins = 30 }) {
  try {
    // Parse Date and Time (YYYY-MM-DD + HH:MM)
    const [year, month, day] = startDateStr.split('-').map(Number);
    const [hours, minutes] = timeSlot.split(':').map(Number);

    const start = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    const end = new Date(start.getTime() + durationMins * 60 * 1000);

    const formatUtc = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const datesParam = `${formatUtc(start)}/${formatUtc(end)}`;

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      details: description,
      location: location,
      dates: datesParam
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch (err) {
    console.error('Error generating Google Calendar URL:', err);
    return '#';
  }
}

/**
 * Generate standard iCal (.ics) file string for calendar export
 */
export function generateICalFile({ title, description, location = 'Healthcare Clinic', startDateStr, timeSlot, durationMins = 30 }) {
  const [year, month, day] = startDateStr.split('-').map(Number);
  const [hours, minutes] = timeSlot.split(':').map(Number);

  const start = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const end = new Date(start.getTime() + durationMins * 60 * 1000);

  const formatUtc = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Healthcare Manager//NONSGML v1.0//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@healthcare-manager.com`,
    `DTSTAMP:${formatUtc(new Date())}`,
    `DTSTART:${formatUtc(start)}`,
    `DTEND:${formatUtc(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}
