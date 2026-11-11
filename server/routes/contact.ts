import { Router, Request, Response } from 'express';

export const contactRouter = Router();

contactRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      action,
      name, 
      email, 
      subject, 
      projectType, 
      budget, 
      message, 
      webhookUrl,
      clientName,
      clientEmail,
      scheduledSlot,
      meetLink,
      agenda,
      calendarEventTitle,
      durationMinutes,
      replySubject,
      htmlBody,
      ownerEmail,
      notificationEmail,
      senderName,
      icsContent
    } = req.body || {};

    const targetEmail = clientEmail || email;
    const targetName = clientName || name;
    const targetMessage = htmlBody || message;
    const targetOwnerEmail = (ownerEmail || notificationEmail || process.env.NOTIFICATION_EMAIL || process.env.VITE_NOTIFICATION_EMAIL || '').trim();

    if (!targetName || !targetEmail || (!targetMessage && !scheduledSlot)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, and message are required.'
      });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format.'
      });
    }

    console.log(`[Contact API] Received request (${action || 'inquiry'}) for ${targetName} <${targetEmail}>`);

    let webhookStatus = 'not_configured';

    // Target Google Apps Script Webhook URL from payload or environment
    const rawWebhook = webhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const targetWebhook = typeof rawWebhook === 'string' ? rawWebhook.trim().replace(/^["']|["']$/g, '') : '';

    if (targetWebhook) {
      // Validate common mistaken URL formats immediately so user gets fast actionable feedback
      if (targetWebhook.includes('docs.google.com/spreadsheets')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Webhook URL: You provided a Google Sheets document URL. Please deploy your Google Apps Script as a Web App (Deploy > New deployment > Web app) and provide the Web App URL that ends with /exec.',
          webhookStatus: 'invalid_url_type'
        });
      }

      if (targetWebhook.includes('/edit')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Webhook URL: You provided the Apps Script editor URL (/edit). Please deploy as a Web App (Deploy > New deployment > Web app) and use the URL ending with /exec.',
          webhookStatus: 'invalid_url_type'
        });
      }

      if (targetWebhook.startsWith('https://script.google.com/')) {
        const payload = {
          action: action || 'send_inquiry',
          name: String(targetName),
          email: String(targetEmail),
          clientName: String(targetName),
          clientEmail: String(targetEmail),
          subject: subject || replySubject || 'General Inquiry',
          replySubject: replySubject || subject || 'Discovery Call Invitation',
          projectType: projectType ? String(projectType) : 'Full-Stack Development',
          budget: budget ? String(budget) : 'Not specified',
          message: String(targetMessage || ''),
          htmlBody: String(targetMessage || ''),
          scheduledSlot: scheduledSlot ? String(scheduledSlot) : undefined,
          meetLink: meetLink ? String(meetLink) : undefined,
          agenda: agenda ? String(agenda) : undefined,
          calendarEventTitle: calendarEventTitle ? String(calendarEventTitle) : undefined,
          durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
          ownerEmail: targetOwnerEmail,
          notificationEmail: targetOwnerEmail,
          senderName: senderName ? String(senderName) : 'Rommel Belia | Full-Stack Developer',
          icsContent: icsContent ? String(icsContent) : undefined,
          timestamp: new Date().toISOString(),
          source: req.body?.source || 'portfolio_backend_service'
        };

        // Google Apps Script cold starts & email dispatch can take 8-15 seconds.
        // We launch a non-blocking background fetch with a 35s timeout so Google always completes delivery,
        // while racing with a 1800ms timer to return an instant response to the client.
        const webhookPromise = fetch(targetWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          redirect: 'follow',
          signal: AbortSignal.timeout(35000)
        }).then(async (response) => {
          const bodyText = await response.text().catch(() => '');
          console.log(`[Contact API] Google Sheet webhook completed with HTTP ${response.status}:`, bodyText.slice(0, 300));
          return response;
        }).catch((sheetError: any) => {
          console.warn('[Contact API] Google Sheet webhook background notice:', sheetError?.message);
          return null;
        });

        // Race fast response (<1800ms) or acknowledge dispatch in background
        try {
          const quickResult = await Promise.race([
            webhookPromise,
            new Promise((resolve) => setTimeout(() => resolve('in_progress'), 1800))
          ]);

          if (quickResult === 'in_progress') {
            webhookStatus = 'dispatched_background';
          } else if (quickResult && typeof (quickResult as any)?.ok === 'boolean' && (quickResult as any).ok) {
            webhookStatus = 'forwarded_successfully';
          } else {
            webhookStatus = 'dispatched_background';
          }
        } catch {
          webhookStatus = 'dispatched_background';
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Message processed and dispatched successfully.',
      receiptId: `msg_${Date.now()}`,
      webhookStatus
    });
  } catch (error: any) {
    console.error('[Contact API Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing your message.'
    });
  }
});
