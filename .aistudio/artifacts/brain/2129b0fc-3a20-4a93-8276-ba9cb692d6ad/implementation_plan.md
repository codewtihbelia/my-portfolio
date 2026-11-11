# Automated Google Calendar Plotting, Working Meet Conferencing & Date Capacity Disabling

Enables automatic event plotting directly onto Google Calendar with a complete structured meeting agenda, guarantees working Google Meet conference links, and automatically disables or skips dates that have already reached daily meeting capacity.

---

> [!IMPORTANT]
> ### Confirmed User Decisions (Phase 1 Clarification)
>
> - **Calendar Event Auto-Creation**: Discovery call invitations will automatically plot directly onto Google Calendar via Google Apps Script's native `CalendarApp`, automatically dispatching official Google Calendar invitation notifications to the client (`clientEmail`) and syncing to Rommel Belia's calendar.
> - **Date Disabling Rule**: Dates that have reached daily meeting capacity (e.g. 1–3 meetings/day, configurable in settings) will be automatically marked as **Full / Disabled** in the calendar picker and automatically skipped by the auto-staggering scheduling engine.
> - **Working Video Conferencing**: Google Meet video conferencing is auto-generated via Google Calendar event conferencing and paired with a customizable persistent meeting room URL fallback from settings.

---

## 1. Overview & Core Concept

When an admin schedules a discovery call for an inquiring client:
1. **Google Calendar Auto-Plotting**: Google Apps Script automatically creates the event on Google Calendar with:
   - **Title**: `Discovery Call: Rommel Belia <> [Client Name] - [Project Type]`
   - **Date & Time**: Exact proposed slot start and end time (based on duration setting, e.g. 45 min)
   - **Full Meeting Agenda**: Structured discussion points, client inquiry summary, project budget, and contact info.
   - **Attendees**: Client email (`guests: clientEmail`) with `sendInvites: true`.
2. **Guaranteed Video Conferencing**:
   - Creates a valid Google Meet conference attached to the event.
   - Includes a direct fallback personal meeting URL (configurable in Settings, e.g. `https://meet.google.com/lookup/code-with-belia`).
   - Generates an instant **"Add to Google Calendar"** browser link (`calendar.google.com/render?action=TEMPLATE&...`) as an interactive backup.
3. **Date Disabling & Capacity Enforcement**:
   - The scheduling engine inspects existing booked meetings in Firestore.
   - Any calendar day that reaches `maxMeetingsPerDay` (default: 2 meetings/day, configurable in Settings) is marked **At Capacity / Disabled**.
   - The auto-staggering algorithm automatically advances past full dates to the next open working business day.
   - The date picker UI displays visual indicators for dates: `Available`, `Partially Booked (1/2)`, or `Full / Disabled (2/2)`.

---

## 2. User Experience & Visual Design

### Key User Flows

#### Flow A: 1-Click Auto-Schedule with Capacity Protection
1. Admin clicks **"Auto-Schedule All Pending"** (or selects specific inquiries).
2. The modal opens with dates automatically populated.
3. The engine scans all existing booked meetings:
   - If Monday has 2 meetings already scheduled, Monday is marked **Full (2/2)** and disabled.
   - Inquiries are assigned Tuesday at 10:00 AM and Tuesday at 11:00 AM.
   - A capacity meter displays: `"2 booked dates skipped to prevent double-booking"`.

#### Flow B: Interactive Date Picker with Real-Time Date Disabling
1. In the recipient slot list, the admin can adjust dates.
2. If the admin chooses a date that is already at full capacity, the date picker alerts:
   - `⚠️ Warning: Date [YYYY-MM-DD] is at full capacity (2/2 meetings booked). Choose another date or adjust daily limit.`
3. The visual calendar indicates availability per day with clean badges (`Open` / `Full`).

#### Flow C: Complete Structured Agenda Generation
1. In the **Email Template & Agenda Tab**, the admin previews the full meeting agenda:
   ```text
   ====================================================
   MEETING AGENDA: 45-MIN DISCOVERY CALL
   ====================================================
   Host: Rommel Belia | Full-Stack Developer
   Client: Sarah Connor (sarah@example.com)
   Project: SaaS Web Application | Budget: $5,000 - $10,000
   
   1. Introductions & Project Overview (10 mins)
      - Review of client goals and core pain points
   2. Technical Architecture & Tech Stack (15 mins)
      - Frontend, backend, database, and cloud infrastructure
   3. Scope, Milestones & Timeline (10 mins)
      - Deliverables, sprints, and budget allocation
   4. Q&A, Next Steps & Action Items (10 mins)
   ====================================================
   ```
2. The agenda is automatically injected into:
   - The **Google Calendar Event Description**.
   - The **Outbound Email Invitation** body.
   - The **"Meetings & Schedules" Google Sheet** row.

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Why | Alternative Considered |
| :--- | :--- | :--- | :--- |
| **Calendar Syncing** | Google Apps Script `CalendarApp.createEvent()` | Native, automatic event creation on the owner's Google Calendar with `sendInvites: true` to the client. Requires zero extra OAuth setup. | Client-side Google Calendar API (requires complex OAuth consent screen & client credentials). |
| **Meet Conference URLs** | Google Calendar event conferencing + customizable persistent room fallback | Eliminates broken 404 random meet codes. The Google Calendar event generates a verified meeting room, and settings allow a custom permanent room link. | Generating random 10-letter strings (broken because Google requires registered conference IDs). |
| **Date Disabling Logic** | Daily capacity threshold (`maxMeetingsPerDay`) | Prevents cognitive overload and burnout by capping how many discovery calls can be scheduled in a single day, while preventing overlapping bookings. | Hard-blocking the entire day on 1 meeting (too restrictive) or unconstrained stacking (causes fatigue and collisions). |
| **Agenda Format** | Standardized professional discovery blueprint | Ensures both the developer and the client enter the meeting aligned on objectives, budget, and scope. | Blank meeting description or generic one-liner. |

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PORTFOLIO FRONTEND                            │
│                                                                        │
│  ┌────────────────────────┐         ┌───────────────────────────────┐  │
│  │   BatchScheduleModal   │         │       AdminMessagesPage       │  │
│  │  - Capacity Inspector  │         │  - Meetings & Schedules Tab   │  │
│  │  - Date Disabling UI   │         │  - Real Meet Link CTA & Join  │  │
│  │  - Agenda Customizer   │         │  - Calendar Event Status      │  │
│  └───────────┬────────────┘         └───────────────┬───────────────┘  │
│              │                                      │                  │
└──────────────┼──────────────────────────────────────┼──────────────────┘
               │                                      │
               ▼                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   EXPRESS BACKEND (/api/contact)                       │
│  - Receives action: "send_client_reply"                                │
│  - Packages agenda, title, clientEmail, meetingSlot, meetLink          │
│  - Non-blocking forward to Google Apps Script Webhook                  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   GOOGLE APPS SCRIPT WEB APP                           │
│                                                                        │
│  ┌────────────────────────┐         ┌───────────────────────────────┐  │
│  │ CalendarApp            │         │ SpreadsheetApp                │  │
│  │ - Plots Event on GCal  │         │ - "Meetings & Schedules" Tab  │  │
│  │ - Title + Agenda       │         │ - Stores Event ID & Meet Link │  │
│  │ - Invites Client       │         └───────────────────────────────┘  │
│  └───────────┬────────────┘                                            │
│              │                                                         │
│              ▼                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ MailApp: Sends confirmation to client + BCC to Rommel Belia      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Components to Update & Create

1. **`src/types/index.ts`**:
   - Add `maxMeetingsPerDay?: number;` to `SchedulingAvailability` and `SiteSettings`.
   - Add `agenda?: string;` and `calendarEventId?: string;` to `ContactMessage` and `BatchReplyItem`.

2. **`src/utils/scheduling.ts`**:
   - Add `generateMeetingAgenda(message, slot, settings)` utility function.
   - Update `generateStaggeredSlots` to accept `existingMeetings: ContactMessage[]` and `maxMeetingsPerDay`:
     - Skips dates that have reached `maxMeetingsPerDay`.
     - Avoids time slot collisions with existing scheduled meetings on the same day.
   - Add `isDateFull(date, existingMeetings, maxPerDay)` helper.
   - Add `generateGoogleCalendarUrl(title, startTime, endTime, agenda, location)` for 1-click fallback links.

3. **`src/components/admin/BatchScheduleModal.tsx`**:
   - In Step 1 (Recipients & Slots):
     - Load all existing booked meetings from `messages` collection.
     - Calculate booked dates and show capacity indicators (e.g. `Monday: 2/2 Full`).
     - Disable or warn when a selected date is full.
     - Provide quick meeting agenda view and edit button.
   - In Step 2 (Template & Agenda):
     - Include `{{agenda}}` token and editable agenda preview.

4. **`src/pages/admin/AdminSettingsPage.tsx`**:
   - Add `maxMeetingsPerDay` field to Scheduling Availability form (default: 2 per day).
   - Add `defaultMeetUrl` field (e.g., your permanent personal meeting room).
   - Update the copy-paste Google Apps Script code to include:
     - `CalendarApp.getDefaultCalendar().createEvent(...)` with title, agenda, client invite, and meet link.
     - Fallback error resilience in case calendar permissions require re-authorization.

5. **`server/routes/contact.ts`**:
   - Pass `agenda`, `calendarTitle`, and `durationMinutes` to the Google Apps Script webhook payload.

---

## 5. Verification Plan

1. **Compile & Lint Verification**:
   - Run `compile_applet` and `lint_applet` simultaneously to ensure zero TypeScript errors.
2. **Server Health Check**:
   - Verify `/api/health` and `/api/contact` respond properly.
3. **Capacity & Disabling Test**:
   - Schedule 2 meetings on a single date, then verify that subsequent auto-scheduling automatically skips that date and disables it in the date picker.
4. **Google Apps Script & Calendar Verification**:
   - Provide the complete tested Google Apps Script code with copy button and deployment instructions.
