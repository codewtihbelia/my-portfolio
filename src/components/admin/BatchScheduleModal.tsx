import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  Send,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Eye,
  Edit3,
  User,
  Mail,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Layers,
  Video,
  FileText,
  ChevronDown,
  ChevronUp,
  CalendarCheck,
  Copy,
  Info,
} from "lucide-react";
import { ContactMessage, SchedulingAvailability } from "../../types";
import {
  DEFAULT_SCHEDULING_AVAILABILITY,
  generateStaggeredSlots,
  detectSlotConflicts,
  formatScheduleSlot,
  formatDateForInput,
  formatTimeForInput,
  parseDateAndTime,
  DEFAULT_EMAIL_REPLY_TEMPLATE,
  renderEmailTemplate,
  getNextBusinessDay,
  generateGoogleMeetLink,
  generateMeetingAgenda,
  generateCalendarEventTitle,
  generateGoogleCalendarUrl,
  generateIcsCalendarContent,
  buildInteractiveEmailCardHtml,
  getDateBookedCounts,
  getDateKey,
} from "../../utils/scheduling";
import { batchScheduleAndReplyMessages } from "../../services/messageService";
import { useSettings } from "../../context/SettingsContext";
import { useToast } from "../ui/Toast";
import { Spinner } from "../ui/Spinner";

interface BatchScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMessages: ContactMessage[];
  existingScheduledMessages?: ContactMessage[];
  onSuccess: () => void;
}

interface RecipientSlotItem {
  message: ContactMessage;
  slotDate: Date;
  meetLink: string;
  agenda: string;
  calendarEventTitle: string;
  calendarAddUrl: string;
  icsContent: string;
}

export const BatchScheduleModal: React.FC<BatchScheduleModalProps> = ({
  isOpen,
  onClose,
  selectedMessages,
  existingScheduledMessages = [],
  onSuccess,
}) => {
  const { siteSettings, profile } = useSettings();
  const { showToast } = useToast();

  const maxMeetingsPerDay = siteSettings?.maxMeetingsPerDay || 2;

  // Availability Configuration State
  const [availability, setAvailability] = useState<SchedulingAvailability>({
    ...DEFAULT_SCHEDULING_AVAILABILITY,
    maxMeetingsPerDay,
  });

  const [startDateStr, setStartDateStr] = useState<string>(() => {
    const nextDay = getNextBusinessDay(
      new Date(),
      [1, 2, 3, 4, 5],
      existingScheduledMessages,
      maxMeetingsPerDay,
    );
    return formatDateForInput(nextDay);
  });

  // Recipient Slot Proposals State
  const [recipients, setRecipients] = useState<RecipientSlotItem[]>([]);

  // Accordion state to expand agenda editor per client
  const [expandedAgendaIndex, setExpandedAgendaIndex] = useState<number | null>(
    null,
  );

  // Template & Preview State
  const [emailSubject, setEmailSubject] = useState<string>(
    "Invitation: Discovery Call & Technical Architecture — {{projectType}}",
  );
  const [emailBodyTemplate, setEmailBodyTemplate] = useState<string>(
    DEFAULT_EMAIL_REPLY_TEMPLATE,
  );
  const [previewRecipientIndex, setPreviewRecipientIndex] = useState<number>(0);
  const [simulatedRsvp, setSimulatedRsvp] = useState<"yes" | "maybe" | "no">(
    "yes",
  );
  const [activeTab, setActiveTab] = useState<"slots" | "template" | "preview">(
    "slots",
  );

  // Execution & Progress State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    name: string;
  } | null>(null);

  // Calculate existing booked counts per calendar date
  const bookedCounts = useMemo(() => {
    return getDateBookedCounts(existingScheduledMessages);
  }, [existingScheduledMessages]);

  const fullDates = useMemo(() => {
    return Object.entries(bookedCounts)
      .filter(([_, count]) => count >= maxMeetingsPerDay)
      .map(([dateKey]) => dateKey);
  }, [bookedCounts, maxMeetingsPerDay]);

  // Initialize or re-roll staggered slots when modal opens or selectedMessages changes
  useEffect(() => {
    if (isOpen && selectedMessages.length > 0) {
      handleRegenerateSlots();
      setPreviewRecipientIndex(0);
      setExpandedAgendaIndex(null);
    }
  }, [isOpen, selectedMessages]);

  const handleRegenerateSlots = () => {
    if (selectedMessages.length === 0) return;

    let baseStartDate: Date;
    try {
      const [y, m, d] = startDateStr.split("-").map(Number);
      baseStartDate = new Date(y, m - 1, d);
    } catch {
      baseStartDate = getNextBusinessDay(
        new Date(),
        availability.workDays,
        existingScheduledMessages,
        maxMeetingsPerDay,
      );
    }

    const calculatedSlots = generateStaggeredSlots(
      selectedMessages.length,
      { ...availability, maxMeetingsPerDay },
      baseStartDate,
      existingScheduledMessages,
    );

    // Helper to generate full RecipientSlotItem with .ics and calendar content
    const createItem = (
      msg: ContactMessage,
      slot: Date,
      meetLink: string,
      agenda: string,
      calendarEventTitle: string,
    ): RecipientSlotItem => {
      const duration = availability.slotDurationMinutes || 45;
      const hostName = profile?.name || "Rommel Belia";
      const hostEmail =
        siteSettings?.notificationEmail ||
        profile?.email ||
        (import.meta.env.VITE_NOTIFICATION_EMAIL as string) ||
        "";
      const calendarAddUrl = generateGoogleCalendarUrl({
        title: calendarEventTitle,
        startDate: slot,
        durationMinutes: duration,
        description: agenda,
        location: meetLink,
      });
      const icsContent = generateIcsCalendarContent({
        title: calendarEventTitle,
        startDate: slot,
        durationMinutes: duration,
        description: agenda,
        location: meetLink,
        organizerName: hostName,
        organizerEmail: hostEmail,
        attendeeName: msg.name,
        attendeeEmail: msg.email,
      });

      return {
        message: msg,
        slotDate: slot,
        meetLink,
        agenda,
        calendarEventTitle,
        calendarAddUrl,
        icsContent,
      };
    };

    const items: RecipientSlotItem[] = selectedMessages.map((msg, idx) => {
      const slot = calculatedSlots[idx] || new Date(baseStartDate);
      const hostName = profile?.name || "Rommel Belia";
      const hostEmail =
        siteSettings?.notificationEmail ||
        profile?.email ||
        (import.meta.env.VITE_NOTIFICATION_EMAIL as string) ||
        "";
      const duration = availability.slotDurationMinutes || 45;
      const meetLink =
        msg.meetLink || generateGoogleMeetLink(siteSettings?.defaultMeetUrl);
      const calendarEventTitle = generateCalendarEventTitle(
        msg.name,
        msg.projectType,
        hostName,
      );
      const agenda = generateMeetingAgenda({
        clientName: msg.name,
        clientEmail: msg.email,
        projectType: msg.projectType,
        budget: msg.budget,
        subject: msg.subject,
        message: msg.message,
        durationMinutes: duration,
        hostName,
        hostEmail,
      });

      return createItem(msg, slot, meetLink, agenda, calendarEventTitle);
    });

    setRecipients(items);
  };

  // Helper to recompute an item when properties change
  const recomputeItem = (
    current: RecipientSlotItem,
    updates: Partial<{
      slotDate: Date;
      meetLink: string;
      agenda: string;
      calendarEventTitle: string;
    }>,
  ): RecipientSlotItem => {
    const slotDate = updates.slotDate || current.slotDate;
    const meetLink =
      updates.meetLink !== undefined ? updates.meetLink : current.meetLink;
    const agenda =
      updates.agenda !== undefined ? updates.agenda : current.agenda;
    const calendarEventTitle =
      updates.calendarEventTitle !== undefined
        ? updates.calendarEventTitle
        : current.calendarEventTitle;
    const duration = availability.slotDurationMinutes || 45;
    const hostName = profile?.name || "Rommel Belia";
    const hostEmail =
      siteSettings?.notificationEmail ||
      profile?.email ||
      (import.meta.env.VITE_NOTIFICATION_EMAIL as string) ||
      "";

    const calendarAddUrl = generateGoogleCalendarUrl({
      title: calendarEventTitle,
      startDate: slotDate,
      durationMinutes: duration,
      description: agenda,
      location: meetLink,
    });

    const icsContent = generateIcsCalendarContent({
      title: calendarEventTitle,
      startDate: slotDate,
      durationMinutes: duration,
      description: agenda,
      location: meetLink,
      organizerName: hostName,
      organizerEmail: hostEmail,
      attendeeName: current.message.name,
      attendeeEmail: current.message.email,
    });

    return {
      ...current,
      slotDate,
      meetLink,
      agenda,
      calendarEventTitle,
      calendarAddUrl,
      icsContent,
    };
  };

  // Conflict Detection
  const conflictReport = useMemo(() => {
    const slotDates = recipients.map((r) => r.slotDate);
    return detectSlotConflicts(slotDates, availability.slotDurationMinutes);
  }, [recipients, availability.slotDurationMinutes]);

  // Handle individual recipient slot date change
  const handleSlotDateChange = (index: number, newDateStr: string) => {
    setRecipients((prev) => {
      const next = [...prev];
      const current = next[index];
      const timeStr = formatTimeForInput(current.slotDate);
      try {
        const updatedDate = parseDateAndTime(newDateStr, timeStr);
        next[index] = recomputeItem(current, { slotDate: updatedDate });
      } catch (e) {
        console.warn("Invalid date parsing", e);
      }
      return next;
    });
  };

  // Handle individual recipient slot time change
  const handleSlotTimeChange = (index: number, newTimeStr: string) => {
    setRecipients((prev) => {
      const next = [...prev];
      const current = next[index];
      const dateStr = formatDateForInput(current.slotDate);
      try {
        const updatedDate = parseDateAndTime(dateStr, newTimeStr);
        next[index] = recomputeItem(current, { slotDate: updatedDate });
      } catch (e) {
        console.warn("Invalid time parsing", e);
      }
      return next;
    });
  };

  // Handle Google Meet room link change
  const handleMeetLinkChange = (index: number, newLink: string) => {
    setRecipients((prev) => {
      const next = [...prev];
      next[index] = recomputeItem(next[index], { meetLink: newLink });
      return next;
    });
  };

  // Handle Agenda Change
  const handleAgendaChange = (index: number, newAgenda: string) => {
    setRecipients((prev) => {
      const next = [...prev];
      next[index] = recomputeItem(next[index], { agenda: newAgenda });
      return next;
    });
  };

  // Handle Calendar Title Change
  const handleCalendarTitleChange = (index: number, newTitle: string) => {
    setRecipients((prev) => {
      const next = [...prev];
      next[index] = recomputeItem(next[index], {
        calendarEventTitle: newTitle,
      });
      return next;
    });
  };

  // Quick adjust time by minutes
  const handleShiftSlot = (index: number, deltaMinutes: number) => {
    setRecipients((prev) => {
      const next = [...prev];
      const current = next[index];
      const newSlot = new Date(
        current.slotDate.getTime() + deltaMinutes * 60 * 1000,
      );
      next[index] = recomputeItem(current, { slotDate: newSlot });
      return next;
    });
  };

  // Render preview for currently highlighted recipient
  const previewData = useMemo(() => {
    if (recipients.length === 0) return null;
    const activeItem = recipients[previewRecipientIndex] || recipients[0];
    const msg = activeItem.message;
    const formattedSlot = formatScheduleSlot(activeItem.slotDate, true);

    const tokens: Record<string, string | undefined> = {
      name: msg.name || "Valued Client",
      email: msg.email || "",
      subject: msg.subject || "Portfolio Inquiry",
      projectType: msg.projectType || "Software Development",
      budget: msg.budget || "Custom",
      message: msg.message || "",
      scheduledTime: formattedSlot,
      meetLink:
        activeItem.meetLink ||
        generateGoogleMeetLink(siteSettings?.defaultMeetUrl),
      agenda: activeItem.agenda,
      calendarTitle: activeItem.calendarEventTitle,
      calendarAddUrl: activeItem.calendarAddUrl,
      duration: `${availability.slotDurationMinutes || 45}-minute`,
      myName: profile?.name || "Rommel Belia",
      myTitle:
        profile?.professionalTitle ||
        "Full-Stack Developer & Software Engineer",
      location: profile?.location || "Cebu City, Philippines",
      contactEmail:
        profile?.email ||
        (import.meta.env.VITE_NOTIFICATION_EMAIL as string) ||
        "",
    };

    return {
      recipient: activeItem,
      subject: renderEmailTemplate(emailSubject, tokens),
      body: renderEmailTemplate(emailBodyTemplate, tokens),
      tokens,
    };
  }, [
    recipients,
    previewRecipientIndex,
    emailSubject,
    emailBodyTemplate,
    profile,
    siteSettings,
    availability.slotDurationMinutes,
  ]);

  // Execute Batch Scheduling & Reply Dispatch
  const handleExecuteBatch = async () => {
    if (recipients.length === 0) return;

    setIsSubmitting(true);
    setProgress({
      current: 0,
      total: recipients.length,
      name: recipients[0].message.name,
    });

    try {
      const itemsToDispatch = recipients.map((item) => {
        const tokens: Record<string, string | undefined> = {
          name: item.message.name,
          email: item.message.email,
          subject: item.message.subject || "Portfolio Inquiry",
          projectType: item.message.projectType || "Software Development",
          budget: item.message.budget || "Custom",
          message: item.message.message,
          scheduledTime: formatScheduleSlot(item.slotDate, true),
          meetLink: item.meetLink,
          agenda: item.agenda,
          calendarTitle: item.calendarEventTitle,
          calendarAddUrl: item.calendarAddUrl,
          duration: `${availability.slotDurationMinutes || 45}-minute`,
          myName: profile?.name || "Rommel Belia",
          myTitle: profile?.professionalTitle || "Full-Stack Developer",
          location: profile?.location || "Cebu City, Philippines",
          contactEmail:
            profile?.email ||
            (import.meta.env.VITE_NOTIFICATION_EMAIL as string) ||
            "",
        };

        const renderedSubject = renderEmailTemplate(emailSubject, tokens);
        const renderedBody = renderEmailTemplate(emailBodyTemplate, tokens);
        const durationMin = availability.slotDurationMinutes || 45;
        const endDate = new Date(
          item.slotDate.getTime() + durationMin * 60 * 1000,
        );

        const interactiveHtmlBody = buildInteractiveEmailCardHtml({
          calendarTitle: item.calendarEventTitle,
          clientName: item.message.name,
          clientEmail: item.message.email,
          scheduledTimeFormatted: formatScheduleSlot(item.slotDate, true),
          startDateIso: item.slotDate.toISOString(),
          endDateIso: endDate.toISOString(),
          durationMinutes: durationMin,
          meetLink: item.meetLink,
          calendarAddUrl: item.calendarAddUrl,
          agendaText: item.agenda,
          customMessageText: renderedBody,
          hostName: profile?.name || "Rommel Belia",
          hostTitle: profile?.professionalTitle || "Full-Stack Developer",
          hostEmail:
            siteSettings?.notificationEmail ||
            profile?.email ||
            (import.meta.env.VITE_NOTIFICATION_EMAIL as string) ||
            "",
          location: profile?.location || "Cebu City, Philippines",
        });

        return {
          messageId: item.message.id,
          clientEmail: item.message.email,
          clientName: item.message.name,
          replySubject: renderedSubject,
          htmlBody: interactiveHtmlBody,
          scheduledSlotIso: item.slotDate.toISOString(),
          scheduledSlotFormatted: formatScheduleSlot(item.slotDate, true),
          meetLink: item.meetLink,
          agenda: item.agenda,
          calendarEventTitle: item.calendarEventTitle,
          durationMinutes: durationMin,
          icsContent: item.icsContent,
        };
      });

      const result = await batchScheduleAndReplyMessages(itemsToDispatch, {
        webhookUrl: siteSettings?.googleSheetWebhookUrl,
        ownerEmail:
          siteSettings?.notificationEmail ||
          profile?.email ||
          (import.meta.env.VITE_NOTIFICATION_EMAIL as string) ||
          "",
        senderName: "Rommel Belia | Full-Stack Developer",
        onProgress: (current, total, name) => {
          setProgress({ current, total, name });
        },
      });

      if (result.failed === 0) {
        showToast(
          `Successfully scheduled and plotted all ${result.succeeded} calls on Google Calendar! Invitations sent.`,
          "success",
        );
        onSuccess();
        onClose();
      } else {
        showToast(
          `Processed ${result.succeeded} inquiries (${result.failed} had errors).`,
          "info",
        );
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error("Batch schedule error:", err);
      showToast(err.message || "Failed to dispatch batch responses.", "error");
    } finally {
      setIsSubmitting(false);
      setProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className="w-full max-w-4xl rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4 bg-zinc-50/70 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Google Calendar & Meet Batch Scheduler</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {selectedMessages.length} Inquiries Selected
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Auto-plots calls onto Google Calendar with complete meeting
                agenda, attendee invites, and date capacity protection.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-xs font-semibold bg-white dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setActiveTab("slots")}
            className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "slots"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>1. Review Slots & Agendas ({recipients.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("template")}
            className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "template"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>2. Invitation Template & Tokens</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "preview"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>3. Client Email & Calendar Preview</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Slots, Agendas & Capacity Rules */}
          {activeTab === "slots" && (
            <div className="space-y-6">
              {/* Capacity Banner */}
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-indigo-950 dark:text-indigo-200">
                    <CalendarCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>
                      Daily Capacity Protection: {maxMeetingsPerDay} discovery
                      calls max / day
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Dates reaching {maxMeetingsPerDay} scheduled meetings are
                    automatically disabled. The auto-staggering algorithm has
                    skipped all full dates.
                  </p>
                </div>
                {fullDates.length > 0 && (
                  <div className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800 font-mono text-[11px] text-zinc-600 dark:text-zinc-300 shrink-0">
                    {fullDates.length} full date(s) skipped
                  </div>
                )}
              </div>

              {/* Working Hours & Rules Controls */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Scheduling Horizon & Availability Rules
                  </span>
                  <button
                    type="button"
                    onClick={handleRegenerateSlots}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-Calculate Non-Conflicting Slots</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">
                      Starting Date
                    </label>
                    <input
                      type="date"
                      value={startDateStr}
                      onChange={(e) => setStartDateStr(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">
                      Call Duration
                    </label>
                    <select
                      value={availability.slotDurationMinutes}
                      onChange={(e) =>
                        setAvailability((p) => ({
                          ...p,
                          slotDurationMinutes: Number(e.target.value),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none"
                    >
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes (Recommended)</option>
                      <option value={60}>60 Minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">
                      Buffer Between Calls
                    </label>
                    <select
                      value={availability.bufferMinutes}
                      onChange={(e) =>
                        setAvailability((p) => ({
                          ...p,
                          bufferMinutes: Number(e.target.value),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none"
                    >
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">
                      Daily Limit
                    </label>
                    <div className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold flex items-center justify-between">
                      <span>{maxMeetingsPerDay} calls/day</span>
                      <span className="text-[10px] text-zinc-400 font-normal">
                        from settings
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conflict Alert Banner if any collision detected */}
              {conflictReport.hasConflict && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">
                      Overlapping Time Slots Detected:
                    </strong>
                    <p className="mt-0.5">
                      Some proposed client meeting slots overlap. Click{" "}
                      <strong>"Re-Calculate Non-Conflicting Slots"</strong> or
                      adjust the individual time pickers below to resolve
                      collisions.
                    </p>
                  </div>
                </div>
              )}

              {/* Recipients Slot Cards List */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
                {recipients.map((item, idx) => {
                  const isConflicting =
                    conflictReport.conflictingIndices.has(idx);
                  const isCurrentPreview = previewRecipientIndex === idx;
                  const isAgendaExpanded = expandedAgendaIndex === idx;
                  const dateKey = getDateKey(item.slotDate);
                  const existingCountOnDay = bookedCounts[dateKey] || 0;
                  const isDayFull = existingCountOnDay >= maxMeetingsPerDay;

                  return (
                    <div
                      key={item.message.id}
                      className={`p-4 transition-colors flex flex-col gap-3.5 ${
                        isConflicting
                          ? "bg-amber-50/60 dark:bg-amber-950/20"
                          : idx % 2 === 0
                            ? "bg-zinc-50/40 dark:bg-zinc-900/40"
                            : "bg-white dark:bg-zinc-950"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Client Info */}
                        <div className="space-y-1 min-w-65 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              {item.message.name}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                              {item.message.projectType || "Inquiry"}
                            </span>
                            {isDayFull && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Day at capacity ({existingCountOnDay}/
                                {maxMeetingsPerDay})
                              </span>
                            )}
                            {isConflicting && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Conflict
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-zinc-500 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-zinc-400" />
                              {item.message.email}
                            </span>
                            <span className="truncate max-w-70 italic text-zinc-400">
                              "
                              {item.message.subject ||
                                item.message.message.slice(0, 40)}
                              "
                            </span>
                          </div>
                        </div>

                        {/* Interactive Slot Pickers */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Date Input */}
                          <div>
                            <input
                              type="date"
                              value={formatDateForInput(item.slotDate)}
                              onChange={(e) =>
                                handleSlotDateChange(idx, e.target.value)
                              }
                              className={`px-2.5 py-1.5 rounded-xl text-xs bg-white dark:bg-zinc-900 border text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                isDayFull
                                  ? "border-amber-400 dark:border-amber-600 ring-1 ring-amber-400"
                                  : "border-zinc-200 dark:border-zinc-700"
                              }`}
                            />
                          </div>

                          {/* Time Input */}
                          <div>
                            <input
                              type="time"
                              value={formatTimeForInput(item.slotDate)}
                              onChange={(e) =>
                                handleSlotTimeChange(idx, e.target.value)
                              }
                              className="px-2.5 py-1.5 rounded-xl text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Quick +/- 15m buttons */}
                          <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden text-[11px] font-semibold bg-white dark:bg-zinc-900">
                            <button
                              type="button"
                              onClick={() => handleShiftSlot(idx, -15)}
                              className="px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                              title="Shift earlier by 15 mins"
                            >
                              -15m
                            </button>
                            <span className="border-r border-zinc-200 dark:border-zinc-700 h-4" />
                            <button
                              type="button"
                              onClick={() => handleShiftSlot(idx, 15)}
                              className="px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                              title="Shift later by 15 mins"
                            >
                              +15m
                            </button>
                          </div>

                          {/* Preview button */}
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewRecipientIndex(idx);
                              setActiveTab("preview");
                            }}
                            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                              isCurrentPreview
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                            title="Preview invitation for this client"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Formatted slot label */}
                        <div className="text-right text-xs font-semibold text-indigo-600 dark:text-indigo-400 min-w-52.5 hidden sm:block">
                          {formatScheduleSlot(item.slotDate)}
                        </div>
                      </div>

                      {/* Google Meet Call URL & Agenda Accordion Trigger */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
                        {/* Meet link row */}
                        <div className="flex items-center gap-2 flex-1 min-w-70">
                          <span className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1.5 shrink-0">
                            <Video className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>Video Room:</span>
                          </span>
                          <input
                            type="text"
                            value={item.meetLink}
                            onChange={(e) =>
                              handleMeetLinkChange(idx, e.target.value)
                            }
                            placeholder="https://meet.google.com/..."
                            className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <a
                            href={item.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
                            title="Test Google Meet link to verify it opens a valid meeting room"
                          >
                            <ExternalLink className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Test Room</span>
                          </a>
                          <a
                            href="https://meet.google.com/new"
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 text-[11px] font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors hidden sm:inline-flex items-center gap-1 cursor-pointer shrink-0"
                            title="Create a live Google Meet room directly on Google Meet"
                          >
                            <span>New Room</span>
                          </a>
                        </div>

                        {/* Toggle Agenda & Calendar Title Details */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedAgendaIndex(
                                isAgendaExpanded ? null : idx,
                              )
                            }
                            className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            <span>Agenda & Calendar Title</span>
                            {isAgendaExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>

                          <a
                            href={item.calendarAddUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Preview Google Calendar event creation"
                          >
                            <CalendarCheck className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Expandable Meeting Agenda & Calendar Title Editor */}
                      {isAgendaExpanded && (
                        <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-3 animate-fadeIn text-xs">
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                              Google Calendar Event Title
                            </label>
                            <input
                              type="text"
                              value={item.calendarEventTitle}
                              onChange={(e) =>
                                handleCalendarTitleChange(idx, e.target.value)
                              }
                              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                                Complete Meeting Agenda (Plotted to Google
                                Calendar & Sent in Email)
                              </label>
                              <span className="text-[10px] text-zinc-400">
                                Auto-generated based on client inquiry
                              </span>
                            </div>
                            <textarea
                              rows={8}
                              value={item.agenda}
                              onChange={(e) =>
                                handleAgendaChange(idx, e.target.value)
                              }
                              className="w-full p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-[11px] leading-relaxed"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Template & Tokens Editor */}
          {activeTab === "template" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Email Body Content (Markdown / Plain Text with Tokens)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEmailBodyTemplate(DEFAULT_EMAIL_REPLY_TEMPLATE)
                    }
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                  >
                    Reset to Default Template
                  </button>
                </div>
                <textarea
                  rows={12}
                  value={emailBodyTemplate}
                  onChange={(e) => setEmailBodyTemplate(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-mono"
                />
              </div>

              {/* Smart Tokens Bar */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 block mb-2">
                  Click a token to insert into template:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    "{{name}}",
                    "{{scheduledTime}}",
                    "{{meetLink}}",
                    "{{agenda}}",
                    "{{calendarAddUrl}}",
                    "{{calendarTitle}}",
                    "{{duration}}",
                    "{{projectType}}",
                    "{{subject}}",
                    "{{myName}}",
                    "{{myTitle}}",
                    "{{location}}",
                    "{{budget}}",
                  ].map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() =>
                        setEmailBodyTemplate((prev) => prev + ` ${token} `)
                      }
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] hover:border-indigo-500 transition-colors cursor-pointer"
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Client Inbox Preview */}
          {activeTab === "preview" && previewData && (
            <div className="space-y-4">
              {/* Recipient Picker Selector */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-zinc-500 font-medium">
                  Showing email invitation & agenda preview for:
                </span>
                <select
                  value={previewRecipientIndex}
                  onChange={(e) =>
                    setPreviewRecipientIndex(Number(e.target.value))
                  }
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  {recipients.map((r, i) => (
                    <option key={r.message.id} value={i}>
                      {i + 1}. {r.message.name} (
                      {r.message.projectType || "General"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Simulated Email Client Container */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm bg-white dark:bg-zinc-950">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">To:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {previewData.recipient.message.name} &lt;
                      {previewData.recipient.message.email}&gt;
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Subject:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {previewData.subject}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-semibold pt-1">
                    <span className="flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>Calendar Delivery:</span>
                    </span>
                    <span className="text-right text-[11px] text-zinc-500 font-medium">
                      Native .ics attached &bull; Google Calendar synced (No
                      redirection link needed)
                    </span>
                  </div>
                </div>

                {/* Refined Client Invitation Card Widget */}
                <div className="p-5 mx-4 my-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
                  <div>
                    <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Proposed Call Slot
                    </div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {formatScheduleSlot(previewData.recipient.slotDate, true)}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-sm">
                        {previewData.recipient.meetLink}
                      </span>
                    </div>
                  </div>

                  {/* Clean Action Buttons Strip */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <a
                      href={previewData.recipient.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition-colors"
                      title="Open Google Meet Room in new tab"
                    >
                      <Video className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-600" />
                      <span>Join Google Meet</span>
                    </a>

                    <a
                      href={previewData.recipient.calendarAddUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      title="Test direct Google Calendar event creation link"
                    >
                      <CalendarCheck className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Add to Calendar</span>
                    </a>

                    <span className="text-[11px] text-zinc-400 ml-auto hidden sm:inline-block">
                      Recipients can reply directly to adjust time
                    </span>
                  </div>
                </div>

                {/* Email Body Container */}
                <div className="p-6 space-y-4 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
                    {previewData.body}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="p-5 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/70 dark:bg-zinc-900/50">
          <div className="text-xs text-zinc-500">
            {isSubmitting && progress ? (
              <span className="flex items-center gap-2 text-indigo-600 font-semibold">
                <Spinner size="xs" />
                <span>
                  Sending invitation to {progress.name} ({progress.current} of{" "}
                  {progress.total})...
                </span>
              </span>
            ) : (
              <span>
                {recipients.length} client invitations ready &bull; Google
                Calendar auto-plotting enabled
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecuteBatch}
              disabled={isSubmitting || recipients.length === 0}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="xs" />
                  <span>Plotting Calendar & Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Plot Calendar & Send {recipients.length} Invites</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
