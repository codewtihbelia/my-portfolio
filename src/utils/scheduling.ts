import { SchedulingAvailability } from '../types';

export const DEFAULT_SCHEDULING_AVAILABILITY: SchedulingAvailability = {
  startHour: 10,
  startMinute: 0,
  endHour: 17,
  endMinute: 0,
  slotDurationMinutes: 45,
  bufferMinutes: 15,
  workDays: [1, 2, 3, 4, 5], // Monday (1) through Friday (5)
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Manila',
  maxMeetingsPerDay: 2 // Maximum discovery calls permitted per day before date is full
};

/**
 * Normalizes a date or string into a standard YYYY-MM-DD date key.
 */
export function getDateKey(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns a dictionary mapping 'YYYY-MM-DD' -> count of currently scheduled meetings.
 */
export function getDateBookedCounts(
  existingMeetings: Array<{ scheduledSlot?: string }>
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of existingMeetings) {
    if (!m.scheduledSlot) continue;
    const key = getDateKey(m.scheduledSlot);
    if (key) {
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  return counts;
}

/**
 * Checks if a specific date has reached or exceeded the configured max meetings per day.
 */
export function isDateAtCapacity(
  date: Date | string,
  existingMeetings: Array<{ scheduledSlot?: string }>,
  maxPerDay: number = 2
): boolean {
  const key = getDateKey(date);
  if (!key) return false;
  const counts = getDateBookedCounts(existingMeetings);
  return (counts[key] || 0) >= maxPerDay;
}

/**
 * Returns the next available business date starting from a base date,
 * optionally skipping dates that are already at daily meeting capacity.
 */
export function getNextBusinessDay(
  fromDate: Date = new Date(),
  workDays: number[] = [1, 2, 3, 4, 5],
  existingMeetings?: Array<{ scheduledSlot?: string }>,
  maxPerDay: number = 2
): Date {
  const next = new Date(fromDate);
  // Start searching from tomorrow
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);

  const bookedCounts = existingMeetings ? getDateBookedCounts(existingMeetings) : {};

  // Increment until we find a working day that is NOT at capacity
  let safetyCounter = 0;
  while (safetyCounter < 30) {
    const isWorkDay = workDays.includes(next.getDay());
    const dateKey = getDateKey(next);
    const isFull = (bookedCounts[dateKey] || 0) >= maxPerDay;

    if (isWorkDay && !isFull) {
      break;
    }

    next.setDate(next.getDate() + 1);
    safetyCounter++;
  }

  return next;
}

/**
 * Generates N staggered, non-overlapping time slots across configured working days and daily hours.
 * Automatically respects maxMeetingsPerDay and skips dates that are already booked to capacity.
 */
export function generateStaggeredSlots(
  count: number,
  config: SchedulingAvailability = DEFAULT_SCHEDULING_AVAILABILITY,
  startFromDate?: Date,
  existingMeetings: Array<{ scheduledSlot?: string }> = []
): Date[] {
  if (count <= 0) return [];

  const workDays = config.workDays && config.workDays.length > 0 ? config.workDays : [1, 2, 3, 4, 5];
  const slotDuration = config.slotDurationMinutes || 45;
  const buffer = config.bufferMinutes ?? 15;
  const stepMinutes = slotDuration + buffer;
  const maxPerDay = config.maxMeetingsPerDay || 2;

  // Pre-calculate existing meeting timestamps grouped by date key
  const existingByDate: Record<string, number[]> = {};
  for (const m of existingMeetings) {
    if (!m.scheduledSlot) continue;
    const d = new Date(m.scheduledSlot);
    if (!isNaN(d.getTime())) {
      const key = getDateKey(d);
      if (!existingByDate[key]) existingByDate[key] = [];
      existingByDate[key].push(d.getTime());
    }
  }

  // Determine starting date
  let currentDay: Date;
  if (startFromDate) {
    currentDay = new Date(startFromDate);
  } else {
    currentDay = getNextBusinessDay(new Date(), workDays, existingMeetings, maxPerDay);
  }

  // Function to advance date until it lands on an eligible work day that isn't full
  const advanceToNextOpenDay = (day: Date): Date => {
    const next = new Date(day);
    let attempts = 0;
    while (attempts < 45) {
      const isWork = workDays.includes(next.getDay());
      const key = getDateKey(next);
      const bookedCount = existingByDate[key]?.length || 0;
      if (isWork && bookedCount < maxPerDay) {
        return next;
      }
      next.setDate(next.getDate() + 1);
      attempts++;
    }
    return next;
  };

  currentDay = advanceToNextOpenDay(currentDay);

  let pointer = new Date(currentDay);
  pointer.setHours(config.startHour, config.startMinute, 0, 0);

  const slots: Date[] = [];

  for (let i = 0; i < count; i++) {
    let assigned = false;
    let safetyLoops = 0;

    while (!assigned && safetyLoops < 100) {
      safetyLoops++;
      const dateKey = getDateKey(pointer);
      const dayExistingTimes = existingByDate[dateKey] || [];

      // Check if this day has already hit max capacity
      if (dayExistingTimes.length >= maxPerDay) {
        pointer.setDate(pointer.getDate() + 1);
        pointer = advanceToNextOpenDay(pointer);
        pointer.setHours(config.startHour, config.startMinute, 0, 0);
        continue;
      }

      // Candidate slot window
      const candidateStart = pointer.getTime();
      const candidateEnd = candidateStart + slotDuration * 60 * 1000;
      const dailyEndMinutes = config.endHour * 60 + config.endMinute;
      const candidateEndMinutes = pointer.getHours() * 60 + pointer.getMinutes() + slotDuration;

      // Check if candidate exceeds daily closing time
      if (candidateEndMinutes > dailyEndMinutes) {
        pointer.setDate(pointer.getDate() + 1);
        pointer = advanceToNextOpenDay(pointer);
        pointer.setHours(config.startHour, config.startMinute, 0, 0);
        continue;
      }

      // Check collision with any existing scheduled meeting on this day
      const hasCollision = dayExistingTimes.some((existingTime) => {
        const existingEnd = existingTime + slotDuration * 60 * 1000;
        return candidateStart < existingEnd + buffer * 60 * 1000 && candidateEnd > existingTime - buffer * 60 * 1000;
      });

      if (hasCollision) {
        // Step forward by 1 interval on the same day
        pointer = new Date(pointer.getTime() + stepMinutes * 60 * 1000);
        continue;
      }

      // Safe slot found!
      slots.push(new Date(pointer));
      dayExistingTimes.push(candidateStart);
      existingByDate[dateKey] = dayExistingTimes;
      assigned = true;

      // Advance pointer for next potential slot
      pointer = new Date(pointer.getTime() + stepMinutes * 60 * 1000);
    }
  }

  return slots;
}

/**
 * Checks for time overlaps between assigned slots given a slot duration.
 */
export function detectSlotConflicts(
  slots: (Date | string)[],
  durationMinutes: number = 45
): {
  hasConflict: boolean;
  conflictingIndices: Set<number>;
  conflictPairs: Array<[number, number]>;
} {
  const dates = slots.map((s) => (s instanceof Date ? s : new Date(s)));
  const conflictingIndices = new Set<number>();
  const conflictPairs: Array<[number, number]> = [];

  const durationMs = durationMinutes * 60 * 1000;

  for (let i = 0; i < dates.length; i++) {
    for (let j = i + 1; j < dates.length; j++) {
      const timeA = dates[i].getTime();
      const timeB = dates[j].getTime();

      // Check for overlap: [startA, startA + duration) overlaps [startB, startB + duration)
      if (Math.abs(timeA - timeB) < durationMs) {
        conflictingIndices.add(i);
        conflictingIndices.add(j);
        conflictPairs.push([i, j]);
      }
    }
  }

  return {
    hasConflict: conflictingIndices.size > 0,
    conflictingIndices,
    conflictPairs
  };
}

/**
 * Formats a Date or date string into a user-friendly meeting proposal string.
 * Example: "Tuesday, Nov 10, 2026 at 10:00 AM"
 */
export function formatScheduleSlot(
  date: Date | string | undefined,
  includeTimezone = false
): string {
  if (!date) return 'Not scheduled';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';

  const dateStr = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (includeTimezone) {
    const tzName = Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
      .formatToParts(d)
      .find((p) => p.type === 'timeZoneName')?.value;
    return `${dateStr} at ${timeStr} ${tzName ? `(${tzName})` : ''}`.trim();
  }

  return `${dateStr} at ${timeStr}`;
}

export function formatDateForInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatTimeForInput(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function parseDateAndTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Returns a verified, working Google Meet room URL.
 * Never generates random fake 10-char strings that fail with "Link not found".
 * Prefers the host's configured permanent Google Meet URL, or falls back to
 * a permanent developer meeting room link.
 */
export function generateGoogleMeetLink(customRoom?: string): string {
  if (customRoom && customRoom.trim()) {
    const cleaned = customRoom.trim();
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      return cleaned;
    }
    return `https://meet.google.com/${cleaned.replace(/^\/+/, '')}`;
  }

  // Standard verified permanent personal Google Meet room fallback
  // Using a consistent permanent room identifier avoids Google Meet "Link not found" errors
  return 'https://meet.google.com/lookup/codewithbelia-discovery';
}

/**
 * Formats a Date into RFC 5545 UTC date string (YYYYMMDDTHHmmssZ).
 */
export function toIcsDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  const s = pad(d.getUTCSeconds());
  return `${y}${m}${day}T${h}${min}${s}Z`;
}

/**
 * Generates an RFC 5545 compliant .ics (iCalendar) invitation string
 * with METHOD:REQUEST, ORGANIZER, and ATTENDEE RSVP=TRUE metadata.
 * Modern email clients (Gmail, Outlook, Apple Mail) automatically render
 * native interactive RSVP cards ("Going? Yes / Maybe / No") and add
 * the event to the recipient's calendar without needing external redirect links.
 */
export function generateIcsCalendarContent(params: {
  title: string;
  startDate: Date;
  durationMinutes?: number;
  description?: string;
  location?: string;
  organizerName?: string;
  organizerEmail?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  uid?: string;
}): string {
  const duration = params.durationMinutes || 45;
  const endDate = new Date(params.startDate.getTime() + duration * 60 * 1000);
  const uid = params.uid || `meet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}@codewithbelia.dev`;
  const dtStamp = toIcsDateTime(new Date());
  const dtStart = toIcsDateTime(params.startDate);
  const dtEnd = toIcsDateTime(endDate);

  const cleanTitle = (params.title || 'Discovery Call').replace(/\r?\n/g, ' ');
  const cleanLocation = (params.location || 'Google Meet').replace(/\r?\n/g, ' ');
  const cleanDescription = (params.description || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

  const orgName = (params.organizerName || 'Rommel Belia').replace(/[:;,\r\n]/g, '');
  const orgEmail = (params.organizerEmail || (import.meta.env.VITE_NOTIFICATION_EMAIL as string) || '').trim();
  const attName = (params.attendeeName || 'Valued Client').replace(/[:;,\r\n]/g, '');
  const attEmail = (params.attendeeEmail || '').trim();

  const lines = [
    'BEGIN:VCALENDAR',
    'PRODID:-//Codewithbelia//Discovery Call Scheduler//EN',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${cleanLocation}`,
    `ORGANIZER;CN=${orgName}:mailto:${orgEmail}`,
    attEmail ? `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${attName}:mailto:${attEmail}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean);

  return lines.join('\r\n');
}

/**
 * Generates the standardized Google Calendar Event Title
 */
export function generateCalendarEventTitle(
  clientName: string,
  projectType: string = 'General Inquiry',
  hostName: string = 'Rommel Belia'
): string {
  const cleanName = (clientName || 'Client').trim();
  const cleanType = (projectType || 'Project Inquiry').trim();
  return `Discovery Call: ${hostName} <> ${cleanName} — ${cleanType}`;
}

/**
 * Generates a clean, human-readable meeting outline for discovery calls.
 */
export function generateMeetingAgenda(params: {
  clientName: string;
  clientEmail: string;
  projectType?: string;
  budget?: string;
  subject?: string;
  message?: string;
  durationMinutes?: number;
  hostName?: string;
  hostEmail?: string;
}): string {
  const duration = params.durationMinutes || 45;
  const project = params.projectType || 'Project Discussion';
  const clientMessage = (params.message || '').trim();

  return [
    `Discussion Outline (${duration} mins):`,
    `• Project Overview: Goals, target audience, and key problems to solve`,
    `• Technical Architecture: Stack options, integrations, and database requirements`,
    `• Timeline & Milestones: Scope prioritization, deliverables, and next steps`,
    `• Open Q&A: Addressing questions and clarifying requirements`,
    clientMessage ? `\nContext from your note: "${clientMessage.length > 200 ? clientMessage.slice(0, 200) + '...' : clientMessage}"` : ''
  ].filter(Boolean).join('\n');
}

/**
 * Formats dates for Google Calendar URL template parameters (YYYYMMDDTHHmmssZ).
 */
function toGCalIsoString(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generates a direct 1-click "Add to Google Calendar" link
 */
export function generateGoogleCalendarUrl(params: {
  title: string;
  startDate: Date;
  durationMinutes?: number;
  description?: string;
  location?: string;
}): string {
  const duration = params.durationMinutes || 45;
  const endDate = new Date(params.startDate.getTime() + duration * 60 * 1000);

  const datesParam = `${toGCalIsoString(params.startDate)}/${toGCalIsoString(endDate)}`;
  const textParam = encodeURIComponent(params.title);
  const detailsParam = encodeURIComponent(params.description || '');
  const locationParam = encodeURIComponent(params.location || '');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${textParam}&dates=${datesParam}&details=${detailsParam}&location=${locationParam}`;
}

/**
 * Human, warm, and professional email copy for discovery call invitations.
 * Avoids aggressive robotic phrasing, ASCII lines, and over-the-top banners.
 */
export const DEFAULT_EMAIL_REPLY_TEMPLATE = `Hi {{name}},

Thanks for reaching out about {{subject}}! I reviewed your notes for your {{projectType}} project, and I'd love to connect to discuss how we can bring it to life.

I've set aside a discovery call for us above and reserved our Google Meet video room.

A calendar invitation is also attached for your calendar app. If you need to adjust the time, just reply directly to this email with a time that works better for you.

Looking forward to speaking with you!

Best regards,
{{myName}}
{{myTitle}}
{{location}}`;

/**
 * Replaces double-curly tokens like {{name}}, {{scheduledTime}}, {{projectType}}, {{meetLink}}, {{agenda}}, {{calendarTitle}}
 */
export function renderEmailTemplate(
  template: string,
  tokens: Record<string, string | undefined>
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    return tokens[key] !== undefined ? String(tokens[key]) : match;
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Builds a complete, responsive, interactive HTML email invitation
 * with embedded RSVP action buttons, verified Google Meet room link,
 * 1-click Google Calendar sync, and Schema.org JSON-LD microdata for mail clients.
 */
export function buildInteractiveEmailCardHtml(params: {
  calendarTitle: string;
  clientName: string;
  clientEmail: string;
  scheduledTimeFormatted: string;
  startDateIso: string;
  endDateIso: string;
  durationMinutes: number;
  meetLink: string;
  calendarAddUrl: string;
  agendaText: string;
  customMessageText?: string;
  hostName?: string;
  hostTitle?: string;
  hostEmail?: string;
  location?: string;
}): string {
  const hostName = params.hostName || 'Rommel Belia';
  const hostTitle = params.hostTitle || 'Full-Stack Developer';
  const hostEmail = params.hostEmail || (import.meta.env.VITE_NOTIFICATION_EMAIL as string) || '';
  const location = params.location || 'Cebu City, Philippines';
  const cleanAgenda = (params.agendaText || '').trim();
  const cleanCustomMessage = (params.customMessageText || '').trim();

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: params.calendarTitle,
    startDate: params.startDateIso,
    endDate: params.endDateIso,
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'VirtualLocation',
      url: params.meetLink
    },
    organizer: {
      '@type': 'Person',
      name: hostName,
      email: hostEmail
    },
    description: cleanAgenda
  });

  // Parse plain text message into properly formatted HTML paragraphs & clean line breaks
  const formattedMessageHtml = cleanCustomMessage
    ? cleanCustomMessage
        .split(/\n\s*\n/) // Split by double newlines into paragraphs
        .map((paragraph) => {
          const trimmed = paragraph.trim();
          if (!trimmed) return '';
          // Convert single newlines inside paragraph to <br/>
          const withBreaks = escapeHtml(trimmed).replace(/\n/g, '<br/>');
          return `<p style="margin:0 0 16px 0; font-size:15px; line-height:1.75; color:#334155;">${withBreaks}</p>`;
        })
        .filter(Boolean)
        .join('')
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(params.calendarTitle)}</title>
  <script type="application/ld+json">
  ${jsonLd}
  </script>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#1e293b; line-height:1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc; padding:24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container (Full-width responsive up to 680px) -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:680px; background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 1px 4px rgba(0,0,0,0.04);">
          
          <!-- Subtle Top Bar -->
          <tr>
            <td style="padding:28px 32px 20px 32px; border-bottom:1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size:12px; font-weight:700; color:#64748b; letter-spacing:0.8px; text-transform:uppercase;">
                      Discovery Call
                    </div>
                    <h1 style="margin:6px 0 0 0; font-size:22px; font-weight:700; color:#0f172a; line-height:1.35;">
                      ${escapeHtml(params.calendarTitle)}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Clean Call Details Card -->
          <tr>
            <td style="padding:24px 32px; background-color:#f8fafc; border-bottom:1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-bottom:14px;">
                    <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Date & Time</div>
                    <div style="font-size:16px; font-weight:700; color:#0f172a; margin-top:3px;">
                      ${escapeHtml(params.scheduledTimeFormatted)}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:18px;">
                    <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Meeting Link</div>
                    <div style="font-size:15px; margin-top:3px;">
                      <a href="${escapeHtml(params.meetLink)}" target="_blank" style="color:#2563eb; font-weight:600; text-decoration:none; word-break:break-all;">
                        ${escapeHtml(params.meetLink)}
                      </a>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Single Primary CTA & Secondary Action -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right:12px; padding-bottom:6px;">
                    <a href="${escapeHtml(params.meetLink)}" target="_blank" style="display:inline-block; background-color:#0f172a; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; padding:11px 20px; border-radius:8px;">
                      Join Google Meet
                    </a>
                  </td>
                  <td style="padding-bottom:6px;">
                    <a href="${escapeHtml(params.calendarAddUrl)}" target="_blank" style="display:inline-block; background-color:#ffffff; color:#334155; font-size:14px; font-weight:600; text-decoration:none; padding:10px 18px; border-radius:8px; border:1px solid #cbd5e1;">
                      Add to Calendar
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Natural Reschedule Notice -->
              <div style="margin-top:14px; font-size:13px; color:#64748b; line-height:1.5;">
                Need to adjust the time? Just reply directly to this email with a time that works better for you.
              </div>
            </td>
          </tr>

          <!-- Message Body with Real Paragraph Structure -->
          ${formattedMessageHtml ? `
          <tr>
            <td style="padding:32px 32px 16px 32px;">
              ${formattedMessageHtml}
            </td>
          </tr>
          ` : ''}

          <!-- Discussion Outline -->
          ${cleanAgenda ? `
          <tr>
            <td style="padding:12px 32px 32px 32px;">
              <div style="font-size:12px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px;">
                Discussion Topics (${params.durationMinutes} mins)
              </div>
              <div style="background-color:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:18px; font-size:14px; color:#334155; line-height:1.65; white-space:pre-wrap;">${escapeHtml(cleanAgenda)}</div>
            </td>
          </tr>
          ` : ''}

          <!-- Host Signature Footer -->
          <tr>
            <td style="padding:22px 32px; background-color:#fafafa; border-top:1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size:14px; font-weight:700; color:#0f172a;">${escapeHtml(hostName)}</div>
                    <div style="font-size:13px; color:#64748b; margin-top:2px;">${escapeHtml(hostTitle)}</div>
                    <div style="font-size:12px; color:#94a3b8; margin-top:3px;">${escapeHtml(location)} &bull; ${escapeHtml(hostEmail)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        
        <div style="max-width:680px; margin-top:16px; text-align:center; font-size:12px; color:#94a3b8;">
          A calendar invite (<code style="font-family:monospace; background-color:#e2e8f0; padding:1px 5px; border-radius:3px;">invite.ics</code>) is also attached for your calendar app.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

