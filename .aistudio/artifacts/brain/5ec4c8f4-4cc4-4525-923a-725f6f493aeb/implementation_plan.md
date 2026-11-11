# Automated 1-Click Batch Inquiries Scheduling & Response System

Automate client inquiry responses from the Admin Messages dashboard with a 1-click batch workflow that auto-staggers non-overlapping meeting proposals based on your custom availability rules, provides per-client slot fine-tuning, and dispatches personalized schedule emails directly through Google Apps Script while syncing Firestore inquiry statuses.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX choices have been confirmed through Phase 1 clarification:
> - **Schedule Allocation Strategy**: **Auto-staggered time slots** calculated dynamically across your available working days and hours, ensuring no two clients are double-booked.
> - **Response Email Delivery**: **Automated email delivery via Google Apps Script** (`MailApp.sendEmail`) using the existing webhook integration so clients receive a professional branded invitation with their proposed slot.
> - **Trigger Workflow**: **Both 1-click auto-reply for all pending inquiries and multi-select checkboxes** for granular batch management.
> - **Schedule Flexibility**: Configurable availability settings (working days, daily hours, slot duration, buffer, and start date) with live slot overrides inside an interactive batch review modal before dispatching.

- **Confirmed Decision 1**: Auto-stagger slots starting on the next business day (e.g. 10:00 AM, 11:00 AM, 2:00 PM, 3:00 PM) skipping weekends and occupied hours.
- **Confirmed Decision 2**: Google Apps Script `doPost` receives an action payload (`action: "send_client_reply"`) to dispatch HTML-formatted meeting invitations to prospective clients.
- **Confirmed Decision 3**: Dual trigger model in `AdminMessagesPage.tsx`: a top-level "Auto-Schedule All Pending" quick button + checkboxes on individual inbox items with a floating selection toolbar.

---

### 1. Overview & Core Concept

- **What It Does**:
  1. Detects pending inquiries (`New` and `Read` status) in the Admin Messages panel.
  2. With 1 click (or via multi-select), opens the **Batch Auto-Scheduler & Response Console**.
  3. Automatically calculates staggered meeting slots (e.g., Client A @ Mon 10:00 AM, Client B @ Mon 2:00 PM, Client C @ Tue 10:00 AM) based on customizable working hours.
  4. Allows the administrator to adjust individual client dates/times or tweak the response template.
  5. Upon confirmation, dispatches personalized email invitations to each client via Google Apps Script and updates all corresponding Firestore message statuses to `Replied` with timestamps and scheduled appointment records.
- **Target Persona**: Portfolio owner (Rommel Belia) managing incoming client project inquiries, freelance requests, and job interview invitations with maximum efficiency.
- **Key Value**: Saves 15–30 minutes of manual email drafting and calendar coordination per batch of inquiries, completely eliminates double-booking, and responds to leads within seconds.

---

### 2. User Experience & Visual Design

#### A. Admin Messages Inbox (`AdminMessagesPage.tsx`)
- **Top Actions Bar**:
  - Primary button: `"Auto-Schedule All Pending"` with inquiry count badge.
  - Multi-select toggle to select all or individual inquiries.
- **Inbox Message Items**:
  - Square selection checkbox next to each message row.
  - Clear status chips (`New`, `Read`, `Replied`, `Archived`).
  - Shows assigned schedule slot timestamp if already scheduled.
- **Floating Batch Selection Toolbar**:
  - Appears smoothly at the bottom-center when $\ge 1$ inquiries are checked.
  - Displays `"3 inquiries selected"` with quick actions:
    - `"Schedule & Reply Batch"` (Primary)
    - `"Mark as Replied"`
    - `"Archive Selected"`
    - `"Clear Selection"`

#### B. Batch Auto-Scheduler Modal (`BatchScheduleModal.tsx`)
- **Header**: Clean title with target recipient count and quick availability toggle.
- **Availability & Scheduling Rules Bar**:
  - **Date Range / Start Date**: Default starting tomorrow or next business day.
  - **Daily Time Window**: e.g., 09:00 AM – 05:00 PM.
  - **Slot Duration**: 30 min / 45 min / 60 min.
  - **Action**: `"Re-stagger Slots"` button to re-roll schedule proposals.
- **Client Schedule Review Table**:
  - Dense, scannable rows with client name, email, project type, and inquiry summary.
  - **Interactive Date & Time Picker**: Allows one-click editing of each specific client's proposed schedule slot.
  - **Conflict Detector**: Alerts if two clients have identical proposed slots.
- **Email Template Preview**:
  - Customizable message template with smart tokens:
    - `{{name}}` -> Client's name
    - `{{scheduledTime}}` -> E.g., *"Tuesday, Nov 10, 2026 at 10:00 AM PHT"*
    - `{{projectType}}` -> Client's requested project type
    - `{{subject}}` -> Inquiry subject
- **Execution Bar**:
  - Cancel button + Primary Action: `"Send All [N] Scheduled Replies"` with progress spinner and status toasts.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Smart Auto-Staggering vs. Static Booking Links**
  - *Chosen Approach*: Auto-generate specific, non-overlapping date and time proposals for each client, with an option to include a fallback booking link.
  - *Why*: Proposing a concrete time (e.g. "I have reserved Tuesday at 10:00 AM for our discovery call") results in a 3x higher meeting conversion rate than sending a cold link, while the staggering prevents calendar collisions.
  - *Alternatives Considered*: Sending a generic Calendly link only (less personalized, requires client friction).

- **Decision 2: Google Apps Script Webhook Email Dispatch**
  - *Chosen Approach*: Expand Google Apps Script `doPost(e)` to handle `{ action: 'send_client_reply', ... }`.
  - *Why*: Leverages the already working and verified Google Apps Script integration (`cebutitans06@gmail.com`) with zero new email provider subscriptions or API keys needed.
  - *Alternatives Considered*: Direct mailto links (requires opening and sending emails manually one by one; defeats 1-click batch goal).

- **Decision 3: Dual Trigger Flow (1-Click All vs Multi-Select)**
  - *Chosen Approach*: Provide both a 1-click button for all unhandled messages and checkboxes for selective batches.
  - *Why*: Gives total flexibility when the admin wants to respond to all new inquiries at once, or selectively triage specific project tiers.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                      ADMIN MESSAGES DASHBOARD                          │
│                     (src/pages/admin/AdminMessagesPage.tsx)            │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
         1-Click "Schedule All"              Select Checkboxes
                    │                                │
                    ▼                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BATCH AUTO-SCHEDULER MODAL                           │
│               (src/components/admin/BatchScheduleModal.tsx)            │
│  - Staggering Algorithm (calculates distinct working hour slots)       │
│  - Per-Client Editable Time Pickers                                    │
│  - Customizable HTML Template with dynamic tokens                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         "Send All [N] Responses"
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌──────────────────────────────────┐        ┌──────────────────────────────────┐
│         Cloud Firestore          │        │    Google Apps Script Webhook    │
│  - updateDoc(messageId, {        │        │   (doPost with action: reply)    │
│      status: 'Replied',          │        │  - Appends reply log to Sheet    │
│      scheduledSlot: '...',       │        │  - Sends HTML email invitation   │
│      repliedAt: ISOString        │        │    to client from owner email    │
│    })                            │        │                                  │
└──────────────────────────────────┘        └──────────────────────────────────┘
```

#### Data Model Extensions (`src/types/index.ts`)
```typescript
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  projectType?: string;
  budget?: string;
  message: string;
  status: 'New' | 'Read' | 'Replied' | 'Archived';
  createdAt: string;
  scheduledSlot?: string;       // Proposed meeting timestamp
  replySentAt?: string;         // Timestamp when automated response was dispatched
  replyNotes?: string;          // Copy of reply body sent to client
}

export interface SchedulingAvailability {
  startHour: number;            // E.g., 9 (09:00)
  endHour: number;              // E.g., 17 (17:00)
  slotDurationMinutes: number;  // E.g., 30 or 45
  bufferMinutes: number;        // E.g., 15
  workDays: number[];           // E.g., [1, 2, 3, 4, 5] (Mon-Fri)
  timezone: string;             // E.g., 'Asia/Manila' or local
}
```

#### Key Service Handlers (`src/services/messageService.ts`)
- `generateStaggeredSlots(count: number, config: SchedulingAvailability, startDate?: Date): Date[]`
  - Calculates non-overlapping consecutive business slots.
- `batchScheduleAndReplyMessages(replies: BatchReplyItem[]): Promise<BatchResult>`
  - Dispatches parallel webhook calls to Google Apps Script.
  - Updates Firestore documents in a batch write.
- `updateSiteSettings` & `getSiteSettings`:
  - Stores default scheduling availability and customizable email reply templates.

#### Apps Script Web App Template Enhancement
- Extend the 1-click copyable Apps Script code in `AdminSettingsPage.tsx` so `doPost(e)` supports:
  - `action: "send_client_reply"`: Sends an email directly to the client's email with the proposed meeting slot, professional greeting, project recap, and calendar RSVP note.

---

### 5. Implementation Sequence

1. **Scheduling Engine & Availability Utility (`src/utils/scheduling.ts`)**:
   - Pure algorithm for generating distinct, collision-free time slots based on user availability preferences.
2. **Batch Service Functions (`src/services/messageService.ts`)**:
   - `batchReplyMessages()` to coordinate Firestore status updates and Google Apps Script email dispatching.
3. **Batch Schedule & Response Modal (`src/components/admin/BatchScheduleModal.tsx`)**:
   - Clean UI with availability rules, per-client slot editing, token preview, and batch execution progress.
4. **Admin Messages View Integration (`src/pages/admin/AdminMessagesPage.tsx`)**:
   - Multi-select checkboxes, selection counter, floating batch bar, and 1-click "Auto-Schedule All Pending" trigger.
5. **Apps Script Code Template Update (`src/pages/admin/AdminSettingsPage.tsx`)**:
   - Include `action === "send_client_reply"` handling in the 1-click script copier.
6. **Verification & Testing**:
   - Build and lint validation, end-to-end multi-selection tests, slot conflict detection, and dev server reboot.
