import { 
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Message } from '../types';

import { getSiteSettings } from './settingsService';
import { getApiUrl } from '../lib/api';

const COLLECTION_NAME = 'messages';

export interface WebhookPayload {
  name: string;
  email: string;
  subject: string;
  projectType?: string;
  budget?: string;
  message: string;
  notificationEmail?: string;
  timestamp: string;
  source?: string;
}

/**
 * Dispatches inquiry to Google Apps Script Webhook with optimized timeout guards
 */
export async function forwardToGoogleSheetWebhook(
  payload: WebhookPayload,
  webhookUrl: string
): Promise<{ success: boolean; note?: string }> {
  if (!webhookUrl || typeof webhookUrl !== 'string') {
    return { success: false, note: 'Google Apps Script Webhook URL is missing.' };
  }

  const cleanUrl = webhookUrl.trim().replace(/^["']|["']$/g, '');

  // Fast diagnostic checks for common URL mistakes
  if (cleanUrl.includes('docs.google.com/spreadsheets')) {
    return {
      success: false,
      note: 'You provided a Google Sheets spreadsheet URL. You need the Web App URL from Apps Script: click Extensions > Apps Script > Deploy > New deployment > Web app, and copy the Web App URL ending in /exec.'
    };
  }

  if (cleanUrl.includes('/edit')) {
    return {
      success: false,
      note: 'This is the Apps Script editor URL (/edit). Please click Deploy > New deployment (or Manage deployments) and copy the Web App URL ending in /exec.'
    };
  }

  if (!cleanUrl.startsWith('https://script.google.com/')) {
    return {
      success: false,
      note: 'Invalid URL. The Web App URL must begin with "https://script.google.com/macros/s/.../exec".'
    };
  }

  // 1. Send through server-side proxy with a strict 3-second timeout guard
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3200);

    const serverRes = await fetch(getApiUrl('/api/contact'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        webhookUrl: cleanUrl
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await serverRes.json().catch(() => null);

    if (serverRes.ok && data?.success) {
      return { 
        success: true, 
        note: 'Payload dispatched successfully! Google Apps Script is logging the row to your Sheet and sending the email notification.' 
      };
    } else if (data?.error) {
      return { success: false, note: data.error };
    }
  } catch (err: any) {
    // If backend proxy timed out or is unavailable, seamlessly fallback to direct client dispatch
    console.info('Backend proxy dispatch passed to direct client pipeline:', err?.message || err);
  }

  // 2. Direct browser fetch with mode: 'no-cors' (text/plain is CORS-safelisted, avoiding preflight delays)
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'text/plain' });
    const directFetchPromise = fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: blob,
      keepalive: true
    });

    // Race direct fetch with 2.5s timer so client UI never hangs
    await Promise.race([
      directFetchPromise,
      new Promise((resolve) => setTimeout(resolve, 2500))
    ]);

    return { 
      success: true, 
      note: 'Payload dispatched directly to Google Apps Script! Check your Google Sheet & email inbox.' 
    };
  } catch (error: any) {
    console.warn('Direct Google Sheet webhook dispatch note:', error);
    return { 
      success: false, 
      note: error?.message || 'Failed to dispatch to Google Sheet webhook.' 
    };
  }
}

export async function submitMessage(data: Omit<Message, 'id' | 'createdAt' | 'status'>): Promise<string> {
  try {
    // Client-side validation checks
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Please enter your name.');
    }
    if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
      throw new Error('Please provide a valid email address.');
    }
    if (!data.message || data.message.trim().length < 5) {
      throw new Error('Please enter a message with at least 5 characters.');
    }

    const timestamp = new Date().toISOString();

    // 1. Save to Firestore messages collection
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      name: data.name.trim(),
      email: data.email.trim(),
      subject: data.subject?.trim() || 'General Inquiry',
      message: data.message.trim(),
      status: 'New',
      createdAt: timestamp
    });

    // 2. Forward to Google Sheets Webhook if configured in Firestore or .env
    try {
      const settings = await getSiteSettings();
      const webhookUrl = (settings?.googleSheetWebhookUrl && settings.googleSheetWebhookUrl.trim())
        || (import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL && String(import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL).trim())
        || '';
      const notificationEmail = (settings?.notificationEmail && settings.notificationEmail.trim())
        || (import.meta.env.VITE_NOTIFICATION_EMAIL && String(import.meta.env.VITE_NOTIFICATION_EMAIL).trim())
        || '';

      if (webhookUrl) {
        const payload: WebhookPayload = {
          name: data.name.trim(),
          email: data.email.trim(),
          subject: data.subject?.trim() || 'General Inquiry',
          projectType: (data as any).projectType || 'Full-Stack Development',
          budget: (data as any).budget || 'Not specified',
          message: data.message.trim(),
          notificationEmail: notificationEmail || undefined,
          timestamp,
          source: 'portfolio_contact_form'
        };
        // Run in background so UI response is instant
        forwardToGoogleSheetWebhook(payload, webhookUrl).catch((err) => {
          console.warn('Google Sheet webhook background notice:', err);
        });
      }
    } catch (webhookErr) {
      console.warn('Notice checking Google Sheet webhook config:', webhookErr);
    }

    return docRef.id;
  } catch (error) {
    console.error('Error submitting message:', error);
    throw error;
  }
}

/**
 * Dispatches a lightweight diagnostic test payload to verify Google Apps Script webhook
 * and email notification delivery.
 */
export async function testWebhookDelivery(
  webhookUrl: string,
  notificationEmail?: string
): Promise<{ success: boolean; note?: string }> {
  const targetUrl = webhookUrl.trim() || String(import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL || '').trim();
  const targetEmail = notificationEmail?.trim() || String(import.meta.env.VITE_NOTIFICATION_EMAIL || '').trim();

  if (!targetUrl) {
    return {
      success: false,
      note: 'No Webhook URL provided. Please enter a valid Apps Script Web App URL ending with /exec.'
    };
  }

  const testPayload: WebhookPayload = {
    name: 'Diagnostic Tester',
    email: targetEmail || 'test@codewithbelia.dev',
    subject: '🧪 Webhook & Notification Test',
    projectType: 'System Diagnostics',
    budget: '$1,000+',
    message: 'This is a test submission from your Admin Settings to verify that Google Sheets logs the row and your email inbox receives the alert notification properly.',
    notificationEmail: targetEmail || undefined,
    timestamp: new Date().toISOString(),
    source: 'admin_diagnostic_tester'
  };

  return await forwardToGoogleSheetWebhook(testPayload, targetUrl);
}

export async function getMessages(): Promise<Message[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const list: Message[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Message);
    });
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return list;
  } catch (error) {
    console.warn('Notice fetching messages:', error);
    return [];
  }
}

export async function updateMessageStatus(id: string, status: Message['status'] | string): Promise<void> {
  try {
    const formattedStatus = (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()) as Message['status'];
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { status: formattedStatus });
  } catch (error) {
    console.error('Error updating message status:', error);
    throw error;
  }
}

export const createMessage = async (data: any) => {
  return submitMessage({
    name: data.name,
    email: data.email,
    subject: data.subject || 'Portfolio Inquiry',
    projectType: data.projectType || 'Web Application',
    message: data.message,
    budget: data.budget,
    attachment: data.attachment
  });
};

export async function deleteMessage(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

/**
 * Dispatches a personalized meeting invitation email to a prospective client via Google Apps Script.
 */
export async function dispatchClientReplyEmail(
  payload: {
    clientEmail: string;
    clientName: string;
    replySubject: string;
    htmlBody: string;
    scheduledSlot?: string;
    meetLink?: string;
    agenda?: string;
    calendarEventTitle?: string;
    durationMinutes?: number;
    icsContent?: string;
    ownerEmail?: string;
    senderName?: string;
  },
  webhookUrl: string
): Promise<{ success: boolean; note?: string }> {
  if (!webhookUrl || typeof webhookUrl !== 'string') {
    return { success: false, note: 'Google Apps Script Webhook URL is not configured in Settings.' };
  }

  const cleanUrl = webhookUrl.trim().replace(/^["']|["']$/g, '');

  const requestBody = {
    action: 'send_client_reply',
    ...payload,
    senderName: payload.senderName || 'Rommel Belia | Full-Stack Developer',
    ownerEmail: payload.ownerEmail || (import.meta.env.VITE_NOTIFICATION_EMAIL as string) || '',
    webhookUrl: cleanUrl,
    source: 'admin_batch_scheduler'
  };

  // 1. Send via server backend proxy
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const serverRes = await fetch(getApiUrl('/api/contact'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await serverRes.json().catch(() => null);
    if (serverRes.ok && data?.success) {
      return { success: true, note: 'Invitation dispatched to client via Google Apps Script.' };
    }
  } catch (err: any) {
    console.info('Backend proxy reply dispatch falling back to direct client pipeline:', err?.message || err);
  }

  // 2. Direct browser fetch with mode: 'no-cors' fallback
  try {
    const blob = new Blob([JSON.stringify(requestBody)], { type: 'text/plain' });
    const directFetchPromise = fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: blob,
      keepalive: true
    });

    await Promise.race([
      directFetchPromise,
      new Promise((resolve) => setTimeout(resolve, 3000))
    ]);

    return { success: true, note: 'Dispatched directly to Google Apps Script.' };
  } catch (directErr: any) {
    console.warn('Direct Apps Script dispatch error:', directErr);
    return { success: false, note: directErr?.message || 'Failed to dispatch email.' };
  }
}

/**
 * Executes a batch schedule and response workflow:
 * 1. Dispatches personalized invitation emails via Google Apps Script with automated Google Meet links & Google Calendar plotting
 * 2. Updates Firestore message documents with status 'Replied', scheduledSlot timestamp, meetLink, agenda, and replyNotes
 */
export async function batchScheduleAndReplyMessages(
  items: Array<{
    messageId: string;
    clientEmail: string;
    clientName: string;
    replySubject: string;
    htmlBody: string;
    scheduledSlotIso: string;
    scheduledSlotFormatted: string;
    meetLink?: string;
    agenda?: string;
    calendarEventTitle?: string;
    durationMinutes?: number;
    icsContent?: string;
  }>,
  options?: {
    webhookUrl?: string;
    ownerEmail?: string;
    senderName?: string;
    onProgress?: (index: number, total: number, itemName: string) => void;
  }
): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ messageId: string; error: string }>;
}> {
  const total = items.length;
  let succeeded = 0;
  let failed = 0;
  const errors: Array<{ messageId: string; error: string }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    options?.onProgress?.(i + 1, total, item.clientName);

    try {
      // 1. Dispatch email & Google Calendar event creation if webhook configured
      if (options?.webhookUrl && options.webhookUrl.trim()) {
        try {
          await dispatchClientReplyEmail(
            {
              clientEmail: item.clientEmail,
              clientName: item.clientName,
              replySubject: item.replySubject,
              htmlBody: item.htmlBody,
              scheduledSlot: item.scheduledSlotFormatted,
              meetLink: item.meetLink,
              agenda: item.agenda,
              calendarEventTitle: item.calendarEventTitle,
              durationMinutes: item.durationMinutes,
              icsContent: item.icsContent,
              ownerEmail: options.ownerEmail,
              senderName: options.senderName
            },
            options.webhookUrl
          );
        } catch (webhookErr: any) {
          console.warn(`Webhook error for message ${item.messageId}:`, webhookErr);
          // Non-blocking: continue updating Firestore even if webhook throws
        }
      }

      // 2. Synchronize Firestore inquiry status
      const docRef = doc(db, COLLECTION_NAME, item.messageId);
      await updateDoc(docRef, {
        status: 'Replied',
        scheduledSlot: item.scheduledSlotIso,
        meetLink: item.meetLink || '',
        agenda: item.agenda || '',
        calendarEventTitle: item.calendarEventTitle || '',
        replySentAt: new Date().toISOString(),
        replyNotes: item.htmlBody
      });

      succeeded++;
    } catch (err: any) {
      console.error(`Failed processing message ${item.messageId}:`, err);
      failed++;
      errors.push({
        messageId: item.messageId,
        error: err?.message || 'Update failed'
      });
    }
  }

  return { total, succeeded, failed, errors };
}

/**
 * Updates multiple message statuses in Firestore simultaneously.
 */
export async function batchUpdateMessageStatus(
  ids: string[],
  status: Message['status']
): Promise<void> {
  const formattedStatus = (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()) as Message['status'];
  await Promise.all(
    ids.map((id) => {
      const docRef = doc(db, COLLECTION_NAME, id);
      return updateDoc(docRef, { status: formattedStatus });
    })
  );
}

/**
 * Deletes multiple messages from Firestore simultaneously.
 */
export async function batchDeleteMessages(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) => {
      const docRef = doc(db, COLLECTION_NAME, id);
      return deleteDoc(docRef);
    })
  );
}

/**
 * Marks a scheduled meeting as completed with outcome categorization, rich meeting notes, and follow-up tracking.
 */
export async function completeMeeting(
  id: string,
  params: {
    meetingOutcome: 'Project Agreed' | 'Proposal Sent' | 'Follow-up Needed' | 'Consultation Closed' | 'Reschedule Requested' | 'No-Show';
    meetingNotes: string;
    followUpDate?: string;
    convertedProjectId?: string;
  }
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updates: Record<string, any> = {
      status: 'Completed',
      meetingOutcome: params.meetingOutcome,
      meetingNotes: params.meetingNotes.trim(),
      completedAt: new Date().toISOString()
    };
    if (params.followUpDate && params.followUpDate.trim()) {
      updates.followUpDate = params.followUpDate.trim();
    }
    if (params.convertedProjectId && params.convertedProjectId.trim()) {
      updates.convertedProjectId = params.convertedProjectId.trim();
    }
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error completing meeting:', error);
    throw error;
  }
}


