import React, { useState, useEffect, useMemo } from "react";
import {
  Mail,
  MessageSquare,
  Check,
  Archive,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  CheckSquare,
  Square,
  MinusSquare,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Send,
  Users,
  FileSpreadsheet,
  RefreshCw,
  CalendarDays,
  Video,
  Copy,
  CalendarCheck,
  FileText,
} from "lucide-react";
import { ContactMessage } from "../../types";
import {
  getMessages,
  updateMessageStatus,
  deleteMessage,
  batchUpdateMessageStatus,
  batchDeleteMessages,
} from "../../services/messageService";
import {
  formatScheduleSlot,
  generateGoogleCalendarUrl,
} from "../../utils/scheduling";
import { BatchScheduleModal } from "../../components/admin/BatchScheduleModal";
import { CompleteMeetingModal } from "../../components/admin/CompleteMeetingModal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { useSettings } from "../../context/SettingsContext";

export const AdminMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Main View Switcher: 'inbox' vs 'meetings'
  const [mainTab, setMainTab] = useState<"inbox" | "meetings">("inbox");
  const [meetingsSubTab, setMeetingsSubTab] = useState<
    "upcoming" | "completed"
  >("upcoming");
  const [completingMessage, setCompletingMessage] =
    useState<ContactMessage | null>(null);

  // Filter & Search state for inbox
  const [filter, setFilter] = useState<
    "all" | "new" | "read" | "replied" | "archived"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null,
  );

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete dialogs
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isBatchDeleteConfirmOpen, setIsBatchDeleteConfirmOpen] =
    useState(false);
  const [deleting, setDeleting] = useState(false);

  // Batch scheduling modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleModalItems, setScheduleModalItems] = useState<
    ContactMessage[]
  >([]);

  // Reader pane state
  const [showReplyNotes, setShowReplyNotes] = useState(false);
  const [showAgendaPane, setShowAgendaPane] = useState(false);

  const { siteSettings } = useSettings();
  const { showToast } = useToast();

  const loadAllMessages = async () => {
    setLoading(true);
    try {
      const data = await getMessages();
      setMessages(data);
      if (data.length > 0 && !selectedMessage) {
        setSelectedMessage(data[0]);
      } else if (selectedMessage) {
        const updated = data.find((m) => m.id === selectedMessage.id);
        if (updated) setSelectedMessage(updated);
      }
    } catch (err) {
      console.error(err);
      showToast("Error loading messages.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllMessages();
  }, []);

  // Filter & Search for Inbox
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (filter !== "all") {
        if ((m.status || "").toLowerCase() !== filter.toLowerCase())
          return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = (m.name || "").toLowerCase().includes(query);
        const emailMatch = (m.email || "").toLowerCase().includes(query);
        const subjectMatch = (m.subject || "").toLowerCase().includes(query);
        const projectMatch = (m.projectType || "")
          .toLowerCase()
          .includes(query);
        const contentMatch = (m.message || "").toLowerCase().includes(query);
        if (
          !nameMatch &&
          !emailMatch &&
          !subjectMatch &&
          !projectMatch &&
          !contentMatch
        ) {
          return false;
        }
      }
      return true;
    });
  }, [messages, filter, searchQuery]);

  // Scheduled Meetings list
  const scheduledMeetings = useMemo(() => {
    return messages
      .filter((m) => Boolean(m.scheduledSlot))
      .sort((a, b) => {
        const timeA = new Date(a.scheduledSlot!).getTime() || 0;
        const timeB = new Date(b.scheduledSlot!).getTime() || 0;
        return timeA - timeB;
      });
  }, [messages]);

  // Segregated Upcoming vs Completed meetings
  const upcomingMeetings = useMemo(() => {
    return scheduledMeetings.filter((m) => m.status !== "Completed");
  }, [scheduledMeetings]);

  const completedMeetings = useMemo(() => {
    return messages
      .filter((m) => m.status === "Completed" || Boolean(m.meetingOutcome))
      .sort((a, b) => {
        const timeA =
          new Date(
            a.completedAt || a.scheduledSlot || a.createdAt || "",
          ).getTime() || 0;
        const timeB =
          new Date(
            b.completedAt || b.scheduledSlot || b.createdAt || "",
          ).getTime() || 0;
        return timeB - timeA;
      });
  }, [messages]);

  // Count pending messages (status 'New' or 'Read')
  const pendingMessages = useMemo(() => {
    return messages.filter((m) => {
      const s = (m.status || "").toLowerCase();
      return s === "new" || s === "read";
    });
  }, [messages]);

  // Single status change
  const handleStatusChange = async (
    id: string,
    status: "new" | "read" | "replied" | "archived",
  ) => {
    const formatted = (status.charAt(0).toUpperCase() +
      status.slice(1).toLowerCase()) as ContactMessage["status"];
    try {
      await updateMessageStatus(id, formatted);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: formatted } : m)),
      );
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage((prev) =>
          prev ? { ...prev, status: formatted } : null,
        );
      }
      showToast(`Marked as ${status}.`, "info");
    } catch (err) {
      console.error(err);
      showToast("Failed to update message status.", "error");
    }
  };

  // Remove meeting schedule
  const handleClearSchedule = async (id: string) => {
    try {
      await updateMessageStatus(id, "Read");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, scheduledSlot: undefined, status: "Read" } : m,
        ),
      );
      showToast("Meeting schedule cleared.", "info");
    } catch (err) {
      console.error(err);
      showToast("Failed to clear meeting schedule.", "error");
    }
  };

  // Single delete
  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await deleteMessage(deleteConfirmId);
      showToast("Message deleted.", "info");
      setMessages((prev) => prev.filter((m) => m.id !== deleteConfirmId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteConfirmId);
        return next;
      });
      if (selectedMessage?.id === deleteConfirmId) {
        const remaining = messages.filter((m) => m.id !== deleteConfirmId);
        setSelectedMessage(remaining.length > 0 ? remaining[0] : null);
      }
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      showToast("Error deleting message.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Multi-select toggle
  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (
      selectedIds.size === filteredMessages.length &&
      filteredMessages.length > 0
    ) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMessages.map((m) => m.id)));
    }
  };

  // 1-Click Auto-Schedule All Pending
  const handleOpenScheduleAllPending = () => {
    if (pendingMessages.length === 0) {
      showToast(
        "No pending inquiries to schedule. All inquiries are already replied or archived.",
        "info",
      );
      return;
    }
    setScheduleModalItems(pendingMessages);
    setIsScheduleModalOpen(true);
  };

  // Schedule selected messages from batch toolbar
  const handleScheduleSelected = () => {
    const selectedList = messages.filter((m) => selectedIds.has(m.id));
    if (selectedList.length === 0) return;
    setScheduleModalItems(selectedList);
    setIsScheduleModalOpen(true);
  };

  // Schedule single message from reader pane
  const handleScheduleSingle = (msg: ContactMessage) => {
    setScheduleModalItems([msg]);
    setIsScheduleModalOpen(true);
  };

  // Batch Status Update
  const handleBatchStatusUpdate = async (status: ContactMessage["status"]) => {
    const ids = Array.from(selectedIds) as string[];
    if (ids.length === 0) return;
    try {
      await batchUpdateMessageStatus(ids, status);
      setMessages((prev) =>
        prev.map((m) => (ids.includes(m.id) ? { ...m, status } : m)),
      );
      if (selectedMessage && ids.includes(selectedMessage.id)) {
        setSelectedMessage((prev) => (prev ? { ...prev, status } : null));
      }
      showToast(`Updated ${ids.length} messages to ${status}.`, "success");
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      showToast("Error updating batch status.", "error");
    }
  };

  // Batch Delete
  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds) as string[];
    if (ids.length === 0) return;
    setDeleting(true);
    try {
      await batchDeleteMessages(ids);
      setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
      if (selectedMessage && ids.includes(selectedMessage.id)) {
        const remaining = messages.filter((m) => !ids.includes(m.id));
        setSelectedMessage(remaining.length > 0 ? remaining[0] : null);
      }
      showToast(`Deleted ${ids.length} messages.`, "info");
      setSelectedIds(new Set());
      setIsBatchDeleteConfirmOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Error deleting selected messages.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const isAllFilteredSelected =
    filteredMessages.length > 0 && selectedIds.size === filteredMessages.length;
  const isPartiallySelected =
    selectedIds.size > 0 && selectedIds.size < filteredMessages.length;

  return (
    <div id="admin-messages-page" className="space-y-6 pb-20">
      {/* Top Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Inquiries & Meeting Management
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Track prospective client leads, manage scheduled discovery calls,
            and synchronize records with Google Sheets.
          </p>
        </div>

        {/* 1-Click Batch Scheduler Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenScheduleAllPending}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            title="Automatically assign non-overlapping discovery slots and prepare replies for all pending inquiries"
          >
            <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
            <span>Auto-Schedule All Pending</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-xs font-mono font-bold">
              {pendingMessages.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main View Switcher: Inquiries Inbox vs Scheduled Meetings */}
      <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setMainTab("inbox")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            mainTab === "inbox"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Inquiries Inbox</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            {messages.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("meetings")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            mainTab === "meetings"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Meetings & Schedules</span>
          <span
            className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
              scheduledMeetings.length > 0
                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
            }`}
          >
            {scheduledMeetings.length}
          </span>
        </button>
      </div>

      {/* =========================================================================
          VIEW 1: INQUIRIES INBOX TAB
          ========================================================================= */}
      {mainTab === "inbox" && (
        <div className="space-y-6">
          {/* Filter Tabs & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              {(["all", "new", "read", "replied", "archived"] as const).map(
                (tab) => {
                  const count =
                    tab === "all"
                      ? messages.length
                      : messages.filter(
                          (m) => (m.status || "").toLowerCase() === tab,
                        ).length;

                  return (
                    <button
                      key={tab}
                      onClick={() => setFilter(tab)}
                      className={`px-3 py-1.5 rounded-xl capitalize transition-all flex items-center gap-1.5 cursor-pointer ${
                        filter === tab
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                          : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                      }`}
                    >
                      <span>{tab}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                          filter === tab
                            ? "bg-white/20 dark:bg-zinc-900/20 text-current"
                            : tab === "new" && count > 0
                              ? "bg-rose-500 text-white"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                },
              )}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inquiries..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Two Column Layout: List & Reader */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-135">
            {/* Messages List Column */}
            <div className="lg:col-span-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col">
              {/* List Header Bar with Select-All Checkbox */}
              <div className="p-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs bg-zinc-50/60 dark:bg-zinc-900/60">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                    title={
                      isAllFilteredSelected
                        ? "Deselect all"
                        : "Select all visible"
                    }
                  >
                    {isAllFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : isPartiallySelected ? (
                      <MinusSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>
                  <span className="text-zinc-500 font-medium">
                    {selectedIds.size > 0 ? (
                      <strong className="text-indigo-600 dark:text-indigo-400">
                        {selectedIds.size} selected
                      </strong>
                    ) : (
                      `${filteredMessages.length} inquiries`
                    )}
                  </span>
                </div>

                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* List Items */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 overflow-y-auto flex-1 max-h-160">
                {loading ? (
                  <div className="p-12 text-center text-xs text-zinc-400">
                    Loading inbox...
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="p-12 text-center text-xs text-zinc-400 space-y-1">
                    <p>No messages match your criteria.</p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-indigo-600 text-[11px] underline"
                      >
                        Clear search query
                      </button>
                    )}
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const isChecked = selectedIds.has(msg.id);
                    const isSelected = selectedMessage?.id === msg.id;
                    const statusLower = (msg.status || "").toLowerCase();

                    return (
                      <div
                        key={msg.id}
                        onClick={() => {
                          setSelectedMessage(msg);
                          if (statusLower === "new") {
                            handleStatusChange(msg.id, "read");
                          }
                        }}
                        className={`w-full text-left p-4 transition-colors relative cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? "bg-indigo-50/80 dark:bg-indigo-950/40 border rounded-sm border-indigo-600"
                            : isChecked
                              ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                              : "hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                        }`}
                      >
                        {/* Item Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => toggleSelectOne(msg.id, e)}
                          className="mt-0.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                          )}
                        </button>

                        {/* Content Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                              {msg.name}
                            </span>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Scheduled Slot Badge */}
                              {msg.scheduledSlot && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center gap-1"
                                  title={`Scheduled: ${formatScheduleSlot(msg.scheduledSlot)}`}
                                >
                                  <Calendar className="w-2.5 h-2.5" />
                                  Call Set
                                </span>
                              )}

                              {/* Status Badge */}
                              <span
                                className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  statusLower === "new"
                                    ? "bg-rose-500 text-white"
                                    : statusLower === "replied"
                                      ? "bg-emerald-500 text-white"
                                      : statusLower === "read"
                                        ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                }`}
                              >
                                {msg.status}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                            {msg.subject || "(No Subject)"}
                          </div>

                          <div className="text-xs text-zinc-500 line-clamp-2">
                            {msg.message}
                          </div>

                          {/* Scheduled Slot Date Tag */}
                          {msg.scheduledSlot && (
                            <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 pt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {formatScheduleSlot(msg.scheduledSlot)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Reader Pane Column */}
            <div className="lg:col-span-7 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              {selectedMessage ? (
                <div className="space-y-6 flex-1">
                  {/* Header Info & Actions */}
                  <div className="flex items-start justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {selectedMessage.projectType || "General Inquiry"}
                        </span>
                        {selectedMessage.budget && (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                            Budget: {selectedMessage.budget}
                          </span>
                        )}
                      </div>

                      <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        {selectedMessage.subject || "(No Subject)"}
                      </h2>

                      <div className="text-xs text-zinc-500 space-y-0.5">
                        <div>
                          From:{" "}
                          <strong className="text-zinc-800 dark:text-zinc-200">
                            {selectedMessage.name}
                          </strong>{" "}
                          (
                          <a
                            href={`mailto:${selectedMessage.email}`}
                            className="text-indigo-600 hover:underline"
                          >
                            {selectedMessage.email}
                          </a>
                          )
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          Received:{" "}
                          {selectedMessage.createdAt
                            ? new Date(
                                selectedMessage.createdAt,
                              ).toLocaleString()
                            : ""}
                        </div>
                      </div>
                    </div>

                    {/* Status Toggle Icons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() =>
                          handleStatusChange(
                            selectedMessage.id,
                            selectedMessage.status?.toLowerCase() === "read"
                              ? "new"
                              : "read",
                          )
                        }
                        title="Toggle Read / New"
                        className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(selectedMessage.id, "archived")
                        }
                        title="Archive"
                        className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs transition-colors"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(selectedMessage.id)}
                        title="Delete Message"
                        className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 text-xs transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scheduled Discovery Call Banner */}
                  {selectedMessage.scheduledSlot && (
                    <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="flex items-center justify-between">
                            <strong className="font-bold text-indigo-950 dark:text-indigo-200 text-sm">
                              {selectedMessage.calendarEventTitle ||
                                "Reserved Meeting Slot"}
                            </strong>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                              Discovery Call
                            </span>
                          </div>
                          <p className="font-semibold text-indigo-900 dark:text-indigo-300 mt-0.5">
                            {formatScheduleSlot(
                              selectedMessage.scheduledSlot,
                              true,
                            )}
                          </p>
                          <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-1">
                            Status: Replied &bull; Plotted on Google Calendar
                            &bull; Stored in "Meetings & Schedules" Google Sheet
                          </p>
                        </div>
                      </div>

                      {/* Conference Actions & Calendar Sync */}
                      <div className="pt-2.5 border-t border-indigo-100 dark:border-indigo-900/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                        {selectedMessage.meetLink && (
                          <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                            <Video className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span className="font-mono text-[11px] text-indigo-700 dark:text-indigo-300 bg-white/70 dark:bg-zinc-900/70 px-2 py-0.5 rounded border border-indigo-200/50 dark:border-indigo-800 truncate max-w-50 sm:max-w-xs">
                              {selectedMessage.meetLink}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedMessage.meetLink && (
                            <>
                              <a
                                href={selectedMessage.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                              >
                                <span>Join Meet</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    selectedMessage.meetLink!,
                                  );
                                  showToast(
                                    "Google Meet link copied to clipboard",
                                    "success",
                                  );
                                }}
                                className="px-2 py-1 rounded-lg border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Copy Google Meet Link"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </button>
                            </>
                          )}

                          {/* 1-Click Add to Google Calendar */}
                          <a
                            href={generateGoogleCalendarUrl({
                              title:
                                selectedMessage.calendarEventTitle ||
                                `Discovery Call: Rommel Belia <> ${selectedMessage.name}`,
                              startDate: new Date(
                                selectedMessage.scheduledSlot,
                              ),
                              durationMinutes: 45,
                              description:
                                selectedMessage.agenda ||
                                selectedMessage.replyNotes ||
                                selectedMessage.message,
                              location:
                                selectedMessage.meetLink || "Google Meet",
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                            title="Open or Add to Google Calendar"
                          >
                            <CalendarCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>Add to GCal</span>
                          </a>

                          {/* Expand Agenda Toggle */}
                          {selectedMessage.agenda && (
                            <button
                              type="button"
                              onClick={() => setShowAgendaPane((p) => !p)}
                              className="px-2.5 py-1 rounded-lg border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Agenda</span>
                              {showAgendaPane ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Agenda View */}
                      {selectedMessage.agenda && showAgendaPane && (
                        <div className="mt-2 p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-indigo-100 dark:border-indigo-900/60 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed animate-fadeIn">
                          {selectedMessage.agenda}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inquiry Message Body */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Client Message
                    </span>
                    <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans p-5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 shadow-2xs">
                      {selectedMessage.message}
                    </div>
                  </div>

                  {/* Expandable Sent Reply Record if available */}
                  {selectedMessage.replyNotes && (
                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowReplyNotes((p) => !p)}
                        className="w-full p-3.5 bg-zinc-50/80 dark:bg-zinc-900/60 flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>View Outbound Invitation Sent to Client</span>
                        </span>
                        {showReplyNotes ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      {showReplyNotes && (
                        <div className="bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
                          {selectedMessage.replyNotes.startsWith(
                            "<!DOCTYPE html",
                          ) || selectedMessage.replyNotes.includes("<html") ? (
                            <div className="p-3">
                              <iframe
                                srcDoc={selectedMessage.replyNotes}
                                title="Outbound Email Preview"
                                className="w-full h-96 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white"
                                sandbox="allow-same-origin allow-popups"
                              />
                            </div>
                          ) : (
                            <div className="p-4 text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap font-sans leading-relaxed">
                              {selectedMessage.replyNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleScheduleSingle(selectedMessage)}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>
                          {selectedMessage.scheduledSlot
                            ? "Reschedule Call"
                            : "Schedule Discovery Call"}
                        </span>
                      </button>

                      <a
                        href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || "Portfolio Inquiry")}`}
                        onClick={() =>
                          handleStatusChange(selectedMessage.id, "replied")
                        }
                        className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-2 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email Client</span>
                        <ExternalLink className="w-3 h-3 text-zinc-400" />
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(selectedMessage.id, "replied")
                      }
                      className="text-xs font-semibold text-zinc-500 hover:text-emerald-600 transition-colors cursor-pointer"
                    >
                      Mark as Replied
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 text-zinc-400 text-xs">
                  <MessageSquare className="w-10 h-10 mb-3 stroke-[1.2]" />
                  <p className="font-semibold text-zinc-500">
                    No inquiry selected
                  </p>
                  <p className="text-zinc-400 mt-1">
                    Select an item from the list to preview and respond
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: DEDICATED MEETINGS & SCHEDULES TAB
          ========================================================================= */}
      {mainTab === "meetings" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Total Booked Discovery Calls
              </span>
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {scheduledMeetings.length}
              </div>
              <p className="text-[11px] text-zinc-400">
                Recorded in Google Sheet "Meetings & Schedules" tab
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Pending Discovery Proposals
              </span>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {pendingMessages.length}
              </div>
              <p className="text-[11px] text-zinc-400">
                Unaddressed inquiries awaiting a proposed slot
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Google Sheets Automation
              </span>
              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Multi-Tab Auto-Routing</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Separate tabs: "Inquiries" & "Meetings & Schedules"
              </p>
            </div>
          </div>

          {/* Scheduled Calls List Table */}
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs bg-zinc-50/60 dark:bg-zinc-900/60">
              {/* Sub-tab Switcher: Upcoming vs Completed */}
              <div className="flex items-center gap-1.5 p-1 bg-zinc-200/60 dark:bg-zinc-800/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMeetingsSubTab("upcoming")}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                    meetingsSubTab === "upcoming"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Upcoming Calls</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono">
                    {upcomingMeetings.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMeetingsSubTab("completed")}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                    meetingsSubTab === "completed"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Completed & Outcomes</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-mono">
                    {completedMeetings.length}
                  </span>
                </button>
              </div>

              {pendingMessages.length > 0 && meetingsSubTab === "upcoming" && (
                <button
                  type="button"
                  onClick={handleOpenScheduleAllPending}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Schedule {pendingMessages.length} Pending Inquiries
                  </span>
                </button>
              )}
            </div>

            {/* TAB 1: UPCOMING MEETINGS */}
            {meetingsSubTab === "upcoming" && (
              <>
                {upcomingMeetings.length === 0 ? (
                  <div className="p-16 text-center text-xs text-zinc-400 space-y-3">
                    <Calendar className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 stroke-[1.2]" />
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">
                        No upcoming discovery calls
                      </p>
                      <p className="text-zinc-500 max-w-sm mx-auto">
                        All calls are completed or waiting to be scheduled. Use
                        the button below to auto-schedule pending inquiries.
                      </p>
                    </div>
                    {pendingMessages.length > 0 && (
                      <button
                        type="button"
                        onClick={handleOpenScheduleAllPending}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer mt-2"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          Auto-Schedule {pendingMessages.length} Inquiries Now
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 overflow-x-auto">
                    {upcomingMeetings.map((call) => (
                      <div
                        key={call.id}
                        className="p-5 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        {/* Time & Client details */}
                        <div className="flex items-start gap-4">
                          {/* Date Badge */}
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-200/60 dark:border-indigo-800 flex flex-col items-center justify-center shrink-0 text-indigo-700 dark:text-indigo-300">
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {new Date(call.scheduledSlot!).toLocaleDateString(
                                "en-US",
                                { month: "short" },
                              )}
                            </span>
                            <span className="text-lg font-black leading-none">
                              {new Date(call.scheduledSlot!).getDate()}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                {call.name}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                {call.projectType || "Project Inquiry"}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                Invitation Sent
                              </span>
                            </div>

                            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {formatScheduleSlot(call.scheduledSlot, true)}
                              </span>
                            </div>

                            <div className="text-xs text-zinc-500 flex items-center gap-3">
                              <a
                                href={`mailto:${call.email}`}
                                className="hover:underline flex items-center gap-1"
                              >
                                <Mail className="w-3 h-3 text-zinc-400" />
                                {call.email}
                              </a>
                              <span className="text-zinc-300 dark:text-zinc-700">
                                &bull;
                              </span>
                              <span className="truncate max-w-70 italic text-zinc-400">
                                "{call.subject || call.message.slice(0, 45)}"
                              </span>
                            </div>

                            {/* Google Meet & Calendar Actions */}
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              {call.meetLink && (
                                <>
                                  <a
                                    href={call.meetLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold inline-flex items-center gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors shadow-2xs"
                                    title="Join Google Meet room"
                                  >
                                    <Video className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                    <span>Join Meet</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-indigo-400" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        call.meetLink!,
                                      );
                                      showToast(
                                        "Google Meet link copied",
                                        "success",
                                      );
                                    }}
                                    className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 inline-flex items-center gap-1 font-medium cursor-pointer"
                                    title="Copy Google Meet link"
                                  >
                                    <Copy className="w-2.5 h-2.5" />
                                    <span>Copy Link</span>
                                  </button>
                                </>
                              )}

                              <a
                                href={generateGoogleCalendarUrl({
                                  title:
                                    call.calendarEventTitle ||
                                    `Discovery Call: Rommel Belia <> ${call.name}`,
                                  startDate: new Date(call.scheduledSlot!),
                                  durationMinutes: 45,
                                  description:
                                    call.agenda ||
                                    call.replyNotes ||
                                    call.message,
                                  location: call.meetLink || "Google Meet",
                                })}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium inline-flex items-center gap-1 hover:bg-zinc-100 transition-colors"
                                title="Add or view on Google Calendar"
                              >
                                <CalendarCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                <span>GCal Event</span>
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Quick Row Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
                          {/* PRIMARY ACTION: Complete Call & Record Outcome */}
                          <button
                            type="button"
                            onClick={() => setCompletingMessage(call)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            title="Complete call and record outcome"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Complete Call</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleScheduleSingle(call)}
                            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Reschedule proposal"
                          >
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Reschedule</span>
                          </button>

                          <a
                            href={`mailto:${call.email}?subject=Re: Meeting Confirmation — ${encodeURIComponent(call.subject || "Portfolio Inquiry")}`}
                            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                            title="Email client directly"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleClearSchedule(call.id)}
                            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 transition-colors cursor-pointer"
                            title="Cancel meeting schedule"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(call.id)}
                            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors cursor-pointer"
                            title="Delete from records"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* TAB 2: COMPLETED MEETINGS & CRM OUTCOMES */}
            {meetingsSubTab === "completed" && (
              <>
                {completedMeetings.length === 0 ? (
                  <div className="p-16 text-center text-xs text-zinc-400 space-y-3">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 stroke-[1.2]" />
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">
                        No completed discovery calls yet
                      </p>
                      <p className="text-zinc-500 max-w-sm mx-auto">
                        When you finish a discovery call with a client, click{" "}
                        <strong>"Complete Call"</strong> on any scheduled
                        meeting to log notes, decisions, and agreements.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 overflow-x-auto">
                    {completedMeetings.map((call) => (
                      <div
                        key={call.id}
                        className="p-5 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors flex flex-col gap-3"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          {/* Client & Outcome Badge */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                {call.name}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                {call.projectType || "Project Inquiry"}
                              </span>

                              {/* Outcome Pill */}
                              {call.meetingOutcome && (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    call.meetingOutcome === "Project Agreed"
                                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                      : call.meetingOutcome === "Proposal Sent"
                                        ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                        : call.meetingOutcome ===
                                            "Follow-up Needed"
                                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                                  }`}
                                >
                                  {call.meetingOutcome}
                                </span>
                              )}

                              <span className="text-[11px] text-zinc-400">
                                Held on {formatScheduleSlot(call.scheduledSlot)}
                              </span>
                            </div>

                            <div className="text-xs text-zinc-500 flex items-center gap-3">
                              <a
                                href={`mailto:${call.email}`}
                                className="hover:underline flex items-center gap-1"
                              >
                                <Mail className="w-3 h-3 text-zinc-400" />
                                {call.email}
                              </a>
                              {call.followUpDate && (
                                <>
                                  <span className="text-zinc-300 dark:text-zinc-700">
                                    &bull;
                                  </span>
                                  <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Follow-up target:{" "}
                                    {new Date(
                                      call.followUpDate,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setCompletingMessage(call)}
                              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Edit Outcome & Notes</span>
                            </button>

                            {call.meetingOutcome === "Project Agreed" && (
                              <a
                                href="/administrator/projects"
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                              >
                                <span>Projects CMS</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            <a
                              href={`mailto:${call.email}?subject=Follow-up: Discovery Call Outcome — ${encodeURIComponent(call.subject || "Development")}`}
                              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                              title="Email client follow-up"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(call.id)}
                              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors cursor-pointer"
                              title="Delete from records"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Meeting Notes Box */}
                        {call.meetingNotes && (
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">
                            {call.meetingNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Batch Selection Toolbar (Only in Inbox View) */}
      {mainTab === "inbox" && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-4 animate-slideUp border border-zinc-700 dark:border-zinc-300">
          <div className="flex items-center gap-2 text-xs font-bold pr-2 border-r border-zinc-700 dark:border-zinc-300">
            <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[11px] flex items-center justify-center font-mono">
              {selectedIds.size}
            </span>
            <span>Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleScheduleSelected}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule & Reply Batch</span>
            </button>

            <button
              type="button"
              onClick={() => handleBatchStatusUpdate("Replied")}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-xs font-semibold text-zinc-200 dark:text-zinc-800 transition-colors cursor-pointer"
            >
              Mark Replied
            </button>

            <button
              type="button"
              onClick={() => handleBatchStatusUpdate("Archived")}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-xs font-semibold text-zinc-200 dark:text-zinc-800 transition-colors cursor-pointer"
            >
              Archive
            </button>

            <button
              type="button"
              onClick={() => setIsBatchDeleteConfirmOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-400 hover:text-white dark:hover:text-zinc-900 transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Batch Schedule Modal */}
      <BatchScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        selectedMessages={scheduleModalItems}
        existingScheduledMessages={messages.filter(
          (m) => !!m.scheduledSlot && m.status !== "Archived",
        )}
        onSuccess={() => {
          setSelectedIds(new Set());
          loadAllMessages();
        }}
      />

      {/* Single Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Message?"
        message="Are you sure you want to remove this inquiry from Firestore? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleting}
      />

      {/* Batch Delete Confirmation */}
      <ConfirmDialog
        isOpen={isBatchDeleteConfirmOpen}
        onClose={() => setIsBatchDeleteConfirmOpen(false)}
        onConfirm={handleBatchDelete}
        title={`Delete ${selectedIds.size} Messages?`}
        message={`Are you sure you want to delete these ${selectedIds.size} inquiries from Firestore? This action cannot be undone.`}
        confirmText="Delete All Selected"
        isDestructive={true}
        isLoading={deleting}
      />

      {/* Complete Meeting Modal */}
      <CompleteMeetingModal
        isOpen={!!completingMessage}
        onClose={() => setCompletingMessage(null)}
        message={completingMessage}
        onSuccess={(updatedMessage) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m)),
          );
          if (selectedMessage && selectedMessage.id === updatedMessage.id) {
            setSelectedMessage(updatedMessage);
          }
        }}
      />
    </div>
  );
};
