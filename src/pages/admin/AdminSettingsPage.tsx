import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Save,
  Sparkles,
  Download,
  ShieldCheck,
  Database,
  RefreshCw,
  Layers,
  CheckCircle2,
  Lock,
  Cloud,
  ExternalLink,
  Check,
  AlertCircle,
  Palette,
  RotateCcw,
  Image as ImageIcon,
  FileSpreadsheet,
  Mail,
  Copy,
  ChevronDown,
  ChevronUp,
  Video,
} from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { BrandLogo } from "../../components/ui/BrandLogo";
import { updateSiteSettings } from "../../services/settingsService";
import { forwardToGoogleSheetWebhook } from "../../services/messageService";
import { seedDatabaseIfEmpty } from "../../services/seedService";
import { getProjects } from "../../services/projectService";
import { getSkills } from "../../services/skillService";
import { getBlogPosts } from "../../services/blogService";
import {
  getCloudinaryConfig,
  saveCloudinaryConfig,
  testCloudinaryConnection,
} from "../../services/cloudinaryService";
import { useToast } from "../../components/ui/Toast";
import { Spinner } from "../../components/ui/Spinner";
import {
  BRAND_PRESETS,
  DEFAULT_BRAND_COLOR,
  normalizeHex,
} from "../../utils/brandTheme";

export const AdminSettingsPage: React.FC = () => {
  const {
    siteSettings,
    profile,
    reloadSettings,
    previewBrandColor,
    resetBrandColorPreview,
  } = useSettings();
  const { showToast } = useToast();

  const currentCloudinary = getCloudinaryConfig();

  const [formData, setFormData] = useState({
    siteTitle: "",
    siteDescription: "",
    primaryColor: "#6366f1",
    enableContactForm: true,
    enableBlogComments: false,
    enableHireMeBanner: true,
    metaKeywords:
      "Full-Stack Developer, React, TypeScript, Cloud Firestore, Firebase",
    analyticsId: "",
    cloudinaryCloudName: currentCloudinary.cloudName,
    cloudinaryUploadPreset: currentCloudinary.uploadPreset,
    googleSheetWebhookUrl:
      (import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL as string) || "",
    notificationEmail:
      (import.meta.env.VITE_NOTIFICATION_EMAIL as string) || "",
    defaultMeetUrl: "",
    maxMeetingsPerDay: 2,
    showBlog: true,
  });

  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [testingCloudinary, setTestingCloudinary] = useState(false);
  const [cloudinaryStatus, setCloudinaryStatus] = useState<{
    tested: boolean;
    success?: boolean;
    message?: string;
  }>({ tested: false });

  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<{
    tested: boolean;
    success?: boolean;
    message?: string;
  }>({ tested: false });
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptDetails, setShowScriptDetails] = useState(false);

  useEffect(() => {
    if (siteSettings) {
      const activeConfig = getCloudinaryConfig();
      setFormData({
        siteTitle:
          siteSettings.siteTitle ||
          "Codewithbelia | Full-Stack Developer & Software Engineer",
        siteDescription:
          siteSettings.siteDescription ||
          "High-performance web applications and cloud architecture.",
        primaryColor: siteSettings.primaryColor || "#6366f1",
        enableContactForm: siteSettings.enableContactForm ?? true,
        enableBlogComments: siteSettings.enableBlogComments ?? false,
        enableHireMeBanner: siteSettings.enableHireMeBanner ?? true,
        metaKeywords:
          siteSettings.metaKeywords ||
          "Full-Stack Developer, React, TypeScript, Cloud Firestore, Firebase",
        analyticsId: siteSettings.analyticsId || "",
        cloudinaryCloudName:
          siteSettings.cloudinaryCloudName || activeConfig.cloudName || "",
        cloudinaryUploadPreset:
          siteSettings.cloudinaryUploadPreset ||
          activeConfig.uploadPreset ||
          "",
        googleSheetWebhookUrl:
          siteSettings.googleSheetWebhookUrl ||
          (import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL as string) ||
          "",
        notificationEmail:
          siteSettings.notificationEmail ||
          profile?.email ||
          (import.meta.env.VITE_NOTIFICATION_EMAIL as string) ||
          "",
        defaultMeetUrl: siteSettings.defaultMeetUrl || "",
        maxMeetingsPerDay: siteSettings.maxMeetingsPerDay ?? 2,
        showBlog: siteSettings.showBlog ?? true,
      });
    }
  }, [siteSettings, profile]);

  // Clean up any unsaved temporary preview when leaving the settings page
  useEffect(() => {
    return () => {
      resetBrandColorPreview();
    };
  }, [resetBrandColorPreview]);

  const handleColorChange = (newColor: string) => {
    setFormData((p) => ({ ...p, primaryColor: newColor }));
    if (/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(newColor.trim())) {
      previewBrandColor(normalizeHex(newColor));
    }
  };

  const handleTestWebhook = async () => {
    const rawUrl = formData.googleSheetWebhookUrl
      ? formData.googleSheetWebhookUrl.trim().replace(/^["']|["']$/g, "")
      : "";
    if (!rawUrl) {
      showToast(
        "Please enter your Google Apps Script Web App URL first.",
        "error",
      );
      return;
    }

    if (rawUrl.includes("docs.google.com/spreadsheets")) {
      setWebhookStatus({
        tested: true,
        success: false,
        message:
          "This is a Google Sheets spreadsheet URL. You need the Web App URL from Extensions > Apps Script > Deploy > New deployment (ends in /exec).",
      });
      showToast(
        "Invalid URL: please provide the deployed Apps Script Web App URL.",
        "error",
      );
      return;
    }

    if (rawUrl.includes("/edit")) {
      setWebhookStatus({
        tested: true,
        success: false,
        message:
          "This is the script editor URL (/edit). Please click Deploy > New deployment (or Manage deployments) and copy the Web App URL ending in /exec.",
      });
      showToast(
        "Invalid URL: please provide the deployed Web App URL (/exec).",
        "error",
      );
      return;
    }

    if (!rawUrl.startsWith("https://script.google.com/")) {
      showToast(
        "Please enter a valid Google Apps Script Web App URL.",
        "error",
      );
      return;
    }

    setTestingWebhook(true);
    setWebhookStatus({ tested: false });
    try {
      const targetNotifEmail =
        formData.notificationEmail ||
        (import.meta.env.VITE_NOTIFICATION_EMAIL as string) ||
        "";
      const testPayload = {
        name: "Admin Test Inquiry",
        email: targetNotifEmail || "test@codewithbelia.dev",
        subject: "Test Connection from Admin Settings",
        projectType: "System Diagnostics",
        budget: "$1,000",
        message:
          "This is a test submission from your Codewithbelia portfolio admin settings to verify that Google Sheets appends this row and emails you an alert.",
        notificationEmail: targetNotifEmail || undefined,
        timestamp: new Date().toISOString(),
        source: "admin_settings_test",
      };

      const result = await forwardToGoogleSheetWebhook(testPayload, rawUrl);
      if (result.success) {
        setWebhookStatus({
          tested: true,
          success: true,
          message:
            "Test payload transmitted! Check your Google Sheet for the new row and your inbox for the notification email.",
        });
        showToast(
          "Webhook payload dispatched! Check Google Sheets & your email.",
          "success",
        );
      } else {
        setWebhookStatus({
          tested: true,
          success: false,
          message: result.note || "Failed to dispatch to webhook.",
        });
        showToast(result.note || "Webhook test failed", "error");
      }
    } catch (err: any) {
      setWebhookStatus({
        tested: true,
        success: false,
        message: err.message || "Connection error",
      });
      showToast("Error testing Google Sheet webhook.", "error");
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleCopyScript = () => {
    const script = `// ====================================================================
// Google Apps Script: Multi-Tab Inquiries & Meeting Scheduler Web App
// ====================================================================
// Features:
// 1. Inquiries Tab: Stores incoming visitor contact form submissions
// 2. Meetings & Schedules Tab: Stores scheduled discovery call proposals
// 3. Single Client Delivery: Dispatches unified branded invitation from Rommel Belia
// 4. Google Calendar Plotting: Plots directly on your calendar without duplicate Google invite emails
// 5. Conflict-Free Confirmation: Delivers booking confirmation without attachment UID collisions
// ====================================================================
// Setup / Update Instructions:
// 1. Open your Google Sheet
// 2. Click Extensions > Apps Script
// 3. Clear existing code, paste this entire script, and save (Ctrl+S / Cmd+S)
// 4. Click Deploy > Manage deployments
// 5. Click the Edit (pencil) icon on your Web App deployment
// 6. Under "Version", select "New version"
// 7. Make sure "Execute as" is "Me" and "Who has access" is "Anyone"
// 8. Click "Deploy" and copy your Web App URL (ends in /exec)!
// ====================================================================

const DEFAULT_RECIPIENT_EMAIL = "${formData.notificationEmail || (import.meta.env.VITE_NOTIFICATION_EMAIL as string) || ""}";

// Helper function to run once in Apps Script Editor to grant Calendar and Mail permissions:
function authorizeCalendarPermissions() {
  const cal = CalendarApp.getDefaultCalendar();
  Logger.log("Default Calendar Name: " + (cal ? cal.getName() : "None"));
  Logger.log("Google Calendar authorization verified.");
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: "Google Apps Script Multi-Tab Web App is active (Inquiries & Meetings & Schedules)."
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    const action = data.action || "send_inquiry";
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // =============================================================
    // ACTION 1: AUTO-PLOT ON GOOGLE CALENDAR, DISPATCH INVITATION & RECORD MEETING
    // =============================================================
    if (action === "send_client_reply") {
      const clientEmail = (data.clientEmail || data.email || "").trim();
      const clientName = (data.clientName || data.name || "Valued Client").trim();
      const replySubject = data.replySubject || data.subject || "Discovery Call Invitation";
      const rawBody = data.htmlBody || data.message || "";
      const ownerEmail = (data.ownerEmail || DEFAULT_RECIPIENT_EMAIL).trim();
      const senderName = data.senderName || "Rommel Belia | Full-Stack Developer";
      const meetLink = (data.meetLink || "").trim();
      const agenda = (data.agenda || rawBody || "").trim();
      const calendarTitle = (data.calendarEventTitle || ("Discovery Call: Rommel Belia | " + clientName)).trim();

      if (!clientEmail) {
        throw new Error("Missing client email address.");
      }

      // Preserve rich HTML email card if present, otherwise format plain text
      const finalHtmlBody = (rawBody && rawBody.indexOf("<") !== -1)
        ? rawBody 
        : rawBody.replace(/\\n/g, "<br/>");

      // 1. Automatically plot event onto Rommel Belia's Google Calendar with Title & Agenda
      let calendarEventId = "";
      let calendarNotice = "";
      let startTime = new Date();
      let endTime = new Date(startTime.getTime() + 45 * 60 * 1000);
      try {
        const slotStr = data.scheduledSlot || "";
        if (slotStr) {
          const parsed = new Date(slotStr);
          if (!isNaN(parsed.getTime())) startTime = parsed;
        }
        const durationMin = Number(data.durationMinutes) || 45;
        endTime = new Date(startTime.getTime() + durationMin * 60 * 1000);

        const cal = CalendarApp.getDefaultCalendar();
        if (cal) {
          const eventOptions = {
            description: agenda,
            location: meetLink || "Google Meet",
            guests: clientEmail,
            sendInvites: false // Prevents Google from sending a duplicate automated invite from account name
          };
          const newEvent = cal.createEvent(calendarTitle, startTime, endTime, eventOptions);
          if (newEvent) {
            calendarEventId = newEvent.getId();
          }
        }
      } catch (calErr) {
        calendarNotice = calErr.toString();
        console.warn("CalendarApp notice: " + calendarNotice);
      }

      // 2. Generate RFC 5545 native calendar invite (.ics) with METHOD:REQUEST & RSVP=TRUE
      let icsAttachment = null;
      try {
        let icsRaw = data.icsContent || "";
        if (!icsRaw) {
          function pad(n) { return (n < 10 ? "0" : "") + n; }
          function toIcsUtc(d) {
            return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" +
                   pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z";
          }
          const dtStamp = toIcsUtc(new Date());
          const dtStart = toIcsUtc(startTime);
          const dtEnd = toIcsUtc(endTime);
          const uid = "meet_" + new Date().getTime() + "_" + Math.floor(Math.random() * 100000) + "@codewithbelia.dev";
          const safeTitle = calendarTitle.replace(/[\\r\\n]/g, " ");
          const safeDesc = (agenda || rawBody).replace(/\\r\\n/g, "\\\\n").replace(/\\n/g, "\\\\n").replace(/,/g, "\\\\,").replace(/;/g, "\\\\;");
          const safeLoc = (meetLink || "Google Meet").replace(/[\\r\\n]/g, " ");
          const icsLines = [
            "BEGIN:VCALENDAR",
            "PRODID:-//Codewithbelia//Discovery Call Scheduler//EN",
            "VERSION:2.0",
            "CALSCALE:GREGORIAN",
            "METHOD:REQUEST",
            "BEGIN:VEVENT",
            "UID:" + uid,
            "DTSTAMP:" + dtStamp,
            "DTSTART:" + dtStart,
            "DTEND:" + dtEnd,
            "SUMMARY:" + safeTitle,
            "DESCRIPTION:" + safeDesc,
            "LOCATION:" + safeLoc,
            "ORGANIZER;CN=" + senderName + ":mailto:" + ownerEmail,
            "ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=" + clientName + ":mailto:" + clientEmail,
            "STATUS:CONFIRMED",
            "SEQUENCE:0",
            "TRANSP:OPAQUE",
            "END:VEVENT",
            "END:VCALENDAR"
          ];
          icsRaw = icsLines.join("\\r\\n");
        }
        icsAttachment = Utilities.newBlob(icsRaw, "text/calendar; charset=UTF-8; method=REQUEST", "invite.ics");
      } catch (icsErr) {
        console.warn("ICS attachment notice: " + icsErr.toString());
      }

      // 3. Dispatch SINGLE branded invitation email directly to Client from Rommel Belia (with interactive card & native .ics attachment)
      const clientMailOptions = {
        to: clientEmail,
        replyTo: ownerEmail,
        name: senderName,
        subject: replySubject,
        htmlBody: finalHtmlBody
      };
      if (icsAttachment) {
        clientMailOptions.attachments = [icsAttachment];
      }
      MailApp.sendEmail(clientMailOptions);

      // 4. Send booking confirmation to Organizer without attaching the conflicting .ics UID
      if (ownerEmail && ownerEmail.toLowerCase() !== clientEmail.toLowerCase()) {
        try {
          MailApp.sendEmail({
            to: ownerEmail,
            subject: "🗓️ Plotted on Google Calendar: " + calendarTitle,
            htmlBody: "<div style='font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif; color:#1e293b; max-width:600px;'>" +
              "<h3 style='color:#4f46e5; margin-bottom:12px;'>Discovery Call Plotted & Invitation Dispatched</h3>" +
              "<p style='font-size:14px; line-height:1.6;'>A single branded invitation from <strong>" + senderName + "</strong> was dispatched to <strong>" + clientName + " (" + clientEmail + ")</strong>.</p>" +
              "<div style='background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin:16px 0;'>" +
              "<p style='margin:0 0 8px 0; font-size:14px;'><strong>Scheduled Time:</strong> " + (data.scheduledSlot || "Not specified") + "</p>" +
              "<p style='margin:0 0 8px 0; font-size:14px;'><strong>Meeting Link:</strong> <a href='" + (meetLink || "#") + "' target='_blank' style='color:#2563eb;'>" + (meetLink || "Google Meet") + "</a></p>" +
              "<p style='margin:0; font-size:14px;'><strong>Project:</strong> " + (data.projectType || "General") + "</p>" +
              "</div>" +
              "<p style='font-size:12px; color:#64748b;'>The event has been placed directly onto your Google Calendar. Attendees will see you as the host.</p>" +
              "</div>"
          });
        } catch (ownerMailErr) {
          console.warn("Owner notification notice: " + ownerMailErr.toString());
        }
      }

      // 5. Target or Auto-Create dedicated "Meetings & Schedules" sheet tab
      let meetingsSheet = ss.getSheetByName("Meetings & Schedules");
      if (!meetingsSheet) {
        meetingsSheet = ss.insertSheet("Meetings & Schedules");
        meetingsSheet.appendRow([
          "Timestamp", "Client Name", "Client Email", "Scheduled Meeting Slot", 
          "Google Meet Link", "Google Calendar Title", "Calendar Event ID", "Project Type", "Status", "Meeting Agenda"
        ]);
        meetingsSheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#e0e7ff");
        meetingsSheet.setFrozenRows(1);
      }

      meetingsSheet.appendRow([
        new Date().toLocaleString(),
        clientName,
        clientEmail,
        data.scheduledSlot || "Not specified",
        meetLink || "Auto-generated",
        calendarTitle,
        calendarEventId || (calendarNotice ? ("GCal notice: " + calendarNotice) : "Plotted on GCal"),
        data.projectType || "General",
        "Invitation Dispatched & GCal Plotted",
        agenda || rawBody
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        calendarEventId: calendarEventId || null,
        calendarNotice: calendarNotice || null,
        message: "Meeting plotted on Google Calendar, recorded in Sheet, and invitation sent to " + clientEmail + " (BCC to " + ownerEmail + ")"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // =============================================================
    // ACTION 2: STANDARD CONTACT FORM INQUIRY SUBMISSION (Target "Inquiries" Tab)
    // =============================================================
    let inquiriesSheet = ss.getSheetByName("Inquiries");
    if (!inquiriesSheet) {
      // If "Inquiries" doesn't exist, use the first sheet and rename it or create it
      const sheets = ss.getSheets();
      if (sheets.length > 0 && sheets[0].getName() !== "Meetings & Schedules") {
        inquiriesSheet = sheets[0];
        try { inquiriesSheet.setName("Inquiries"); } catch (nameErr) {}
      } else {
        inquiriesSheet = ss.insertSheet("Inquiries", 0);
      }
    }

    // Auto-create header row if sheet is brand new
    if (inquiriesSheet.getLastRow() === 0) {
      inquiriesSheet.appendRow([
        "Timestamp", "Name", "Email", "Subject", "Project Type", "Budget", "Message"
      ]);
      inquiriesSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#f3f4f6");
      inquiriesSheet.setFrozenRows(1);
    }

    const timestamp = new Date().toLocaleString();
    const name = data.name || "Anonymous";
    const email = data.email || "No email";
    const subject = data.subject || "Portfolio Inquiry";
    const projectType = data.projectType || "General";
    const budget = data.budget || "Not specified";
    const message = data.message || "No content";

    // 1. Append row to Inquiries sheet
    inquiriesSheet.appendRow([
      timestamp, name, email, subject, projectType, budget, message
    ]);

    // 2. Dispatch email alert to owner
    const targetEmail = (data.notificationEmail || DEFAULT_RECIPIENT_EMAIL).trim();
    const emailSubject = "📬 New Portfolio Inquiry from " + name + ": " + subject;

    function escapeHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeProjectType = escapeHtml(projectType);
    const safeBudget = escapeHtml(budget);
    const safeMessage = escapeHtml(message).replace(/\\n/g, "<br/>");
    const safeTimestamp = escapeHtml(timestamp);

    const emailBody = 
      "<div style='font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif; max-width:620px; margin:0 auto; padding:24px; color:#1e293b; background-color:#ffffff; border:1px solid #e2e8f0; border-radius:16px;'>" +
        "<div style='margin-bottom:20px; border-bottom:1px solid #f1f5f9; padding-bottom:16px;'>" +
          "<div style='display:inline-block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#4f46e5; margin-bottom:6px;'>Portfolio Inquiry</div>" +
          "<h2 style='margin:0; font-size:20px; font-weight:800; color:#0f172a; line-height:1.3;'>New Message from " + safeName + "</h2>" +
          "<p style='margin:6px 0 0 0; font-size:13px; color:#64748b;'>Received via your Codewithbelia contact form &bull; " + safeTimestamp + "</p>" +
        "</div>" +
        
        "<div style='background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:18px; margin-bottom:20px;'>" +
          "<table style='width:100%; border-collapse:collapse; font-size:13px;'>" +
            "<tr><td style='padding:6px 0; font-weight:600; color:#64748b; width:110px;'>From:</td><td style='padding:6px 0; font-weight:700; color:#0f172a;'>" + safeName + "</td></tr>" +
            "<tr><td style='padding:6px 0; font-weight:600; color:#64748b;'>Email:</td><td style='padding:6px 0;'><a href='mailto:" + safeEmail + "' style='color:#4f46e5; font-weight:600; text-decoration:none;'>" + safeEmail + "</a></td></tr>" +
            "<tr><td style='padding:6px 0; font-weight:600; color:#64748b;'>Subject:</td><td style='padding:6px 0; color:#1e293b; font-weight:600;'>" + safeSubject + "</td></tr>" +
            "<tr><td style='padding:6px 0; font-weight:600; color:#64748b;'>Project:</td><td style='padding:6px 0; color:#1e293b;'>" + safeProjectType + "</td></tr>" +
            "<tr><td style='padding:6px 0; font-weight:600; color:#64748b;'>Budget:</td><td style='padding:6px 0; color:#0f172a; font-weight:600;'>" + safeBudget + "</td></tr>" +
          "</table>" +
        "</div>" +

        "<div style='margin-bottom:24px;'>" +
          "<div style='font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#475569; margin-bottom:8px;'>Inquiry Details</div>" +
          "<div style='background-color:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:16px; font-size:14px; line-height:1.6; color:#1e293b;'>" +
            safeMessage +
          "</div>" +
        "</div>" +

        "<div style='margin-bottom:24px; text-align:center;'>" +
          "<a href='mailto:" + safeEmail + "?subject=" + encodeURIComponent("Re: " + (subject || "Your Inquiry")) + "' style='display:inline-block; background-color:#0f172a; color:#ffffff; font-size:13px; font-weight:600; text-decoration:none; padding:11px 24px; border-radius:10px;'>Reply Directly to " + safeName + " &rarr;</a>" +
        "</div>" +

        "<div style='border-top:1px solid #f1f5f9; padding-top:14px; font-size:11px; color:#94a3b8; text-align:center;'>" +
          "Logged automatically to your Google Sheet (tab: <strong>Inquiries</strong>). To reply, click the button above or hit reply directly to this email." +
        "</div>" +
      "</div>";

    MailApp.sendEmail({
      to: targetEmail,
      subject: emailSubject,
      htmlBody: emailBody,
      replyTo: email
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Row added to Inquiries sheet and alert sent"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    showToast("Apps Script code copied to clipboard!", "success");
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Save to Firestore
      await updateSiteSettings(formData);
      // Persist Cloudinary config locally as well
      saveCloudinaryConfig(
        formData.cloudinaryCloudName,
        formData.cloudinaryUploadPreset,
      );
      await reloadSettings();
      showToast("Settings & Cloudinary configuration saved.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestCloudinary = async () => {
    if (!formData.cloudinaryCloudName || !formData.cloudinaryUploadPreset) {
      showToast("Please enter both Cloud Name and Upload Preset.", "error");
      return;
    }

    setTestingCloudinary(true);
    try {
      const result = await testCloudinaryConnection(
        formData.cloudinaryCloudName,
        formData.cloudinaryUploadPreset,
      );
      setCloudinaryStatus({
        tested: true,
        success: result.success,
        message: result.message,
      });
      if (result.success) {
        showToast(result.message, "success");
        saveCloudinaryConfig(
          formData.cloudinaryCloudName,
          formData.cloudinaryUploadPreset,
        );
      } else {
        showToast(result.message, "error");
      }
    } catch (err: any) {
      setCloudinaryStatus({
        tested: true,
        success: false,
        message: err.message || "Connection test failed.",
      });
      showToast("Cloudinary test failed: " + err.message, "error");
    } finally {
      setTestingCloudinary(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedDatabaseIfEmpty();
      if (res.seeded) {
        showToast("Sample data seeded successfully!", "success");
      } else {
        showToast("Database already contains records.", "info");
      }
      await reloadSettings();
    } catch (err) {
      console.error(err);
      showToast("Failed to seed database.", "error");
    } finally {
      setSeeding(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      const [projects, skills, blogs] = await Promise.all([
        getProjects(true),
        getSkills(),
        getBlogPosts(true),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        siteSettings: formData,
        projects,
        skills,
        blogs,
      };

      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `portfolio_backup_${new Date().toISOString().split("T")[0]}.json`,
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast("Portfolio JSON exported successfully.", "success");
    } catch (err) {
      console.error(err);
      showToast("Export failed.", "error");
    }
  };

  return (
    <div id="admin-settings-page" className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          System & Site Settings
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Configure global site metadata, branding parameters, SEO tags, and
          database operations.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6"
      >
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          General Configuration & SEO
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Site Title *
            </label>
            <input
              type="text"
              required
              value={formData.siteTitle}
              onChange={(e) =>
                setFormData((p) => ({ ...p, siteTitle: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        {/* Primary Brand Color System */}
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: formData.primaryColor }}
              >
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Primary Brand Color
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Defines the primary buttons, accent highlights, badges, and
                  interactive focus states across the portfolio.
                </p>
              </div>
            </div>

            {formData.primaryColor.toLowerCase() !==
              DEFAULT_BRAND_COLOR.toLowerCase() && (
              <button
                type="button"
                onClick={() => handleColorChange(DEFAULT_BRAND_COLOR)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors self-start sm:self-auto"
                title="Reset to default brand indigo"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to Indigo
              </button>
            )}
          </div>

          {/* Curated Brand Presets */}
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Curated Theme Presets
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {BRAND_PRESETS.map((preset) => {
                const isActive =
                  formData.primaryColor.toLowerCase() ===
                  preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleColorChange(preset.hex)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left border text-xs font-medium transition-all ${
                      isActive
                        ? "border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-800 shadow-sm ring-2 ring-zinc-900/10 dark:ring-zinc-100/20 text-zinc-900 dark:text-zinc-100 font-semibold"
                        : "border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-xs flex items-center justify-center text-white"
                      style={{ backgroundColor: preset.hex }}
                    >
                      {isActive && <Check className="w-2.5 h-2.5 stroke-3" />}
                    </span>
                    <span className="truncate">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Hex Picker & Input */}
          <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center gap-4">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Custom Color Picker
              </span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="color"
                    id="brandColorPicker"
                    value={
                      formData.primaryColor.startsWith("#")
                        ? formData.primaryColor
                        : `#${formData.primaryColor}`
                    }
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-1"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    id="brandColorHexInput"
                    value={formData.primaryColor}
                    placeholder="#6366f1"
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-28 px-3 py-2 text-xs font-mono uppercase rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Reactive UI Elements Preview */}
            <div className="grow min-w-65 bg-white dark:bg-zinc-800/80 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/80">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Live Theme Preview
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  Primary CTA
                </button>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60">
                  Featured Pill
                </span>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  Accent Link
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-indigo-500/20" />
                  Status
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Logo & Browser Tab Icon Sync */}
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-xs shrink-0 flex items-center justify-center bg-white dark:bg-zinc-800">
              <BrandLogo
                image={profile?.profileImage}
                name={profile?.name || "Portfolio"}
                sizeClass="w-full h-full"
                textSizeClass="text-sm"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Brand Logo & Browser Favicon
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Synced with Profile Photo
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                The brand logo across the navbar, footer, and admin panel, plus
                your browser tab favicon, are dynamically sourced from your
                profile photo.
              </p>
            </div>
          </div>

          <Link
            to="/administrator/profile"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-colors shrink-0"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Manage Photo & Logo</span>
          </Link>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
            Meta Description
          </label>
          <textarea
            rows={2}
            value={formData.siteDescription}
            onChange={(e) =>
              setFormData((p) => ({ ...p, siteDescription: e.target.value }))
            }
            className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
            Meta Keywords (comma separated)
          </label>
          <input
            type="text"
            value={formData.metaKeywords}
            onChange={(e) =>
              setFormData((p) => ({ ...p, metaKeywords: e.target.value }))
            }
            className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        {/* Cloudinary Integration Section */}
        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Cloudinary Image Hosting & Delivery
                </h3>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                All uploaded portfolio images, project covers, and avatars are
                processed, optimized, and served via Cloudinary CDN.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {formData.cloudinaryCloudName &&
              formData.cloudinaryUploadPreset ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-3.5 h-3.5" />
                  <span>Cloudinary Configured</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Setup Required</span>
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 text-xs text-zinc-600 dark:text-zinc-300 space-y-2">
            <div className="font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
              <span>Quick Cloudinary Setup Guide:</span>
              <a
                href="https://cloudinary.com/users/register_free"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 underline ml-1"
              >
                <span>Free Cloudinary Account</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-zinc-600 dark:text-zinc-400">
              <li>
                Log into your Cloudinary Dashboard and find your{" "}
                <strong>Cloud Name</strong> at the top.
              </li>
              <li>
                Go to <strong>Settings</strong> (gear icon) &rarr;{" "}
                <strong>Upload</strong> tab &rarr; scroll down to{" "}
                <strong>Upload presets</strong>.
              </li>
              <li>
                Click <strong>Add upload preset</strong>, set Signing Mode to{" "}
                <strong>Unsigned</strong>, name it (e.g.{" "}
                <code>portfolio_uploads</code>), and click <strong>Save</strong>
                .
              </li>
              <li>
                Paste your <strong>Cloud Name</strong> and{" "}
                <strong>Upload Preset</strong> below, test connection, and save!
              </li>
            </ol>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Cloud Name (e.g. dxyz123)
              </label>
              <input
                type="text"
                placeholder="Your Cloudinary Cloud Name"
                value={formData.cloudinaryCloudName}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    cloudinaryCloudName: e.target.value.trim(),
                  }))
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Unsigned Upload Preset
              </label>
              <input
                type="text"
                placeholder="e.g. portfolio_uploads"
                value={formData.cloudinaryUploadPreset}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    cloudinaryUploadPreset: e.target.value.trim(),
                  }))
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestCloudinary}
              disabled={
                testingCloudinary ||
                !formData.cloudinaryCloudName ||
                !formData.cloudinaryUploadPreset
              }
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {testingCloudinary ? (
                <Spinner size="xs" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>
                {testingCloudinary
                  ? "Testing Connection..."
                  : "Test Cloudinary Connection"}
              </span>
            </button>

            {cloudinaryStatus.tested && (
              <div
                className={`text-xs font-medium flex items-center gap-1.5 ${
                  cloudinaryStatus.success
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {cloudinaryStatus.success ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>{cloudinaryStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Google Sheets & Automated Email Notifications Integration */}
        <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Google Sheets & Email Notifications</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    Live Webhook
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Directly append incoming client inquiries into Google Sheets
                  and trigger instant email alerts.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowScriptDetails(!showScriptDetails)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>
                {showScriptDetails ? "Hide Setup Guide" : "View Setup Guide"}
              </span>
              {showScriptDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Google Apps Script Web App URL
              </label>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={formData.googleSheetWebhookUrl}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    googleSheetWebhookUrl: e.target.value.trim(),
                  }))
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
              />
              {formData.googleSheetWebhookUrl &&
                formData.googleSheetWebhookUrl.includes(
                  "docs.google.com/spreadsheets",
                ) && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-start gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      This is a Google Sheet URL. Deploy Apps Script (Deploy
                      &gt; New deployment &gt; Web app) and use the URL ending
                      in /exec.
                    </span>
                  </p>
                )}
              {formData.googleSheetWebhookUrl &&
                formData.googleSheetWebhookUrl.includes("/edit") && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-start gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      This is the script editor URL. Please deploy as Web app
                      and use the deployed URL ending in /exec.
                    </span>
                  </p>
                )}
              {formData.googleSheetWebhookUrl &&
                formData.googleSheetWebhookUrl.includes("/exec") && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Valid deployed Web App URL format detected.</span>
                  </p>
                )}
              {(!formData.googleSheetWebhookUrl ||
                (!formData.googleSheetWebhookUrl.includes("docs.google.com") &&
                  !formData.googleSheetWebhookUrl.includes("/edit") &&
                  !formData.googleSheetWebhookUrl.includes("/exec"))) && (
                <p className="text-[11px] text-zinc-400 mt-1">
                  The deployed Web App URL from your Google Sheet's Apps Script
                  (ends in /exec).
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Notification Recipient Email
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Configured via .env
                </span>
              </div>
              <input
                type="email"
                placeholder="name@domain.com (loaded from VITE_NOTIFICATION_EMAIL in .env)"
                value={formData.notificationEmail}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    notificationEmail: e.target.value.trim(),
                  }))
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Secured in your{" "}
                <code className="font-mono text-zinc-600 dark:text-zinc-300">
                  .env
                </code>{" "}
                file. Excluded from git commits and repository source code.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Default Google Meet Room URL (Recommended)</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold lowercase">
                  guarantees working video room
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="e.g. https://meet.google.com/lookup/codewithbelia-discovery"
                  value={formData.defaultMeetUrl}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      defaultMeetUrl: e.target.value.trim(),
                    }))
                  }
                  className="flex-1 px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
                />
                <a
                  href={
                    formData.defaultMeetUrl ||
                    "https://meet.google.com/lookup/codewithbelia-discovery"
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="Test Meet Room link (opens in new tab)"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Test Link</span>
                </a>
                <a
                  href="https://meet.google.com/new"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-bold text-indigo-700 dark:text-indigo-300 inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="Create a live permanent Google Meet room"
                >
                  <Video className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Create on Meet</span>
                </a>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Enter your permanent Google Meet room URL (or click "Create on
                Meet" to start one). All discovery call proposals will use this
                verified link, ensuring recipients never see "Link not found".
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Daily Meeting Limit / Capacity (Meetings Per Day)</span>
                <span className="text-[10px] text-zinc-400 font-normal">
                  dates reaching this limit are automatically disabled
                </span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={formData.maxMeetingsPerDay}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      maxMeetingsPerDay: Math.max(
                        1,
                        Math.min(6, Number(e.target.value) || 2),
                      ),
                    }))
                  }
                  className="w-28 px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                />
                <span className="text-xs text-zinc-500">
                  discovery calls max per business day (Default: 2 calls/day)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                When a calendar date has reached this number of scheduled
                meetings, it is marked <strong>Full</strong> and disabled in the
                date picker, and auto-scheduling will skip directly to the next
                open business day.
              </p>
            </div>
          </div>

          {/* Test Action & Live Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={testingWebhook || !formData.googleSheetWebhookUrl}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {testingWebhook ? (
                <Spinner size="xs" />
              ) : (
                <Mail className="w-3.5 h-3.5" />
              )}
              <span>
                {testingWebhook
                  ? "Transmitting Fast Test Payload..."
                  : "Test Webhook & Email Notification"}
              </span>
            </button>

            {webhookStatus.tested && (
              <div
                className={`text-xs font-medium flex items-center gap-1.5 ${
                  webhookStatus.success
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {webhookStatus.success ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{webhookStatus.message}</span>
              </div>
            )}
          </div>

          {/* Collapsible Setup Guide & Code Snippet */}
          {showScriptDetails && (
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    How to Setup in Your Google Sheet (2 Minutes)
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Follow these 4 simple steps to connect your Sheet:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copiedScript ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedScript ? "Copied!" : "Copy Apps Script"}</span>
                </button>
              </div>

              <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 font-medium space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                    <Sparkles className="w-4 h-4" />
                    <span>How to Update Your Deployed Script:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    1. In Apps Script, replace your code with the updated script
                    above and click <strong>Save</strong> (Ctrl+S / Cmd+S).
                    <br />
                    2. In the toolbar function dropdown, select{" "}
                    <strong>authorizeCalendarPermissions</strong> and click{" "}
                    <strong>Run</strong> (grants permission to plot Google
                    Calendar events and send invites).
                    <br />
                    3. Click{" "}
                    <strong>
                      Deploy &rarr; Manage deployments &rarr; Edit (pencil icon)
                      &rarr; under Version select "New version" &rarr; Deploy
                    </strong>
                    .
                  </p>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300 pl-1">
                  <li>
                    Open your <strong>Google Sheet</strong> (e.g.{" "}
                    <em>Portfolio Inquiries & Bookings</em>).
                  </li>
                  <li>
                    Click <strong>Extensions &rarr; Apps Script</strong>.
                  </li>
                  <li>
                    Clear old code, click <strong>Copy Apps Script</strong>{" "}
                    above, and paste it into the editor.
                  </li>
                  <li>
                    Select <strong>authorizeCalendarPermissions</strong> in the
                    toolbar dropdown and click <strong>Run</strong> to
                    authorize.
                  </li>
                  <li>
                    Click{" "}
                    <strong>
                      Deploy &rarr; Manage deployments &rarr; Edit (pencil)
                      &rarr; New version &rarr; Deploy
                    </strong>{" "}
                    (or <em>New deployment &gt; Web app</em>).
                  </li>
                  <li>
                    Set <strong>Execute as</strong>: <em>Me</em> and{" "}
                    <strong>Who has access</strong>: <em>Anyone</em>.
                  </li>
                  <li>
                    Ensure the Web App URL (/exec) is saved in the field above.
                  </li>
                </ol>
              </div>

              <div className="relative rounded-lg bg-zinc-950 p-3 overflow-x-auto text-[11px] font-mono text-zinc-300 max-h-48">
                <pre>{`// Multi-Tab Inquiries & Meeting Scheduler Preview
const DEFAULT_RECIPIENT_EMAIL = "${formData.notificationEmail || (import.meta.env.VITE_NOTIFICATION_EMAIL as string) || ""}";

function doPost(e) {
  // If action === "send_client_reply":
  //   1. Sends meeting invitation directly to client email (with BCC to owner)
  //   2. Auto-creates & appends to "Meetings & Schedules" tab
  // If action === "send_inquiry":
  //   1. Appends visitor message to "Inquiries" tab
  //   2. Dispatches new inquiry alert to owner
}`}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Feature Toggles
          </h3>

          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableContactForm}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    enableContactForm: e.target.checked,
                  }))
                }
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                Enable Public Contact Inquiries Form
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableHireMeBanner}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    enableHireMeBanner: e.target.checked,
                  }))
                }
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                Display "Open to Work / Available for Projects" status banner
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showBlog}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, showBlog: e.target.checked }))
                }
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                Enable Public Blog & Technical Articles Section
              </span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Saving..." : "Save Site Settings"}</span>
          </button>
        </div>
      </form>

      {/* Database Management & ABAC status */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-500" />
            <span>Database & Cloud Architecture</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Manage data persistence, sample blueprints, and backup exports.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="hidden p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Seed Sample Data</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Populate empty Firestore collections with realistic case studies,
              engineering skills, and articles.
            </p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {seeding ? (
                <Spinner size="xs" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>{seeding ? "Seeding Database..." : "Run Seed Script"}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
              <Download className="w-4 h-4 text-emerald-500" />
              <span>Export Portfolio JSON</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Download a complete JSON snapshot of all your projects, blog
              posts, skills, and configuration.
            </p>
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON Backup</span>
            </button>
          </div>
        </div>

        {/* Firestore Security Rules Display */}
        <div className="p-4 rounded-2xl bg-zinc-900 text-zinc-300 font-mono text-[11px] space-y-2 border border-zinc-800">
          <div className="flex items-center gap-2 text-indigo-400 font-sans font-bold text-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>
              Active Cloud Firestore Security Model: Attribute-Based Access
              Control (ABAC)
            </span>
          </div>
          <p className="text-zinc-400 font-sans text-xs">
            Admin writes are restricted to authenticated accounts located in the{" "}
            <code className="text-indigo-300">admins</code> collection. Contact
            form inquiries can be created by unauthenticated visitors without
            reading privileges.
          </p>
        </div>
      </div>
    </div>
  );
};
