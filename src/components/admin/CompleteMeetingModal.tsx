import React, { useState } from 'react';
import { X, CheckCircle2, FileText, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import { ContactMessage } from '../../types';
import { completeMeeting } from '../../services/messageService';
import { formatScheduleSlot } from '../../utils/scheduling';
import { useToast } from '../ui/Toast';

interface CompleteMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ContactMessage | null;
  onSuccess: (updatedMessage: ContactMessage) => void;
}

type MeetingOutcome = 'Project Agreed' | 'Proposal Sent' | 'Follow-up Needed' | 'Consultation Closed' | 'Reschedule Requested' | 'No-Show';

const OUTCOME_OPTIONS: Array<{
  value: MeetingOutcome;
  label: string;
  description: string;
  badgeClass: string;
}> = [
  {
    value: 'Project Agreed',
    label: 'Project Agreed',
    description: 'Client accepted proposal & development is kicking off',
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
  },
  {
    value: 'Proposal Sent',
    label: 'Proposal Sent',
    description: 'Quote, scope, or proposal drafted and awaiting review',
    badgeClass: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
  },
  {
    value: 'Follow-up Needed',
    label: 'Follow-up Needed',
    description: 'Client needs technical demo or secondary call',
    badgeClass: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
  },
  {
    value: 'Consultation Closed',
    label: 'Consultation Closed',
    description: 'Advisory or architecture consultation completed',
    badgeClass: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
  },
  {
    value: 'Reschedule Requested',
    label: 'Reschedule Requested',
    description: 'Client requested to move call to another date',
    badgeClass: 'text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
  },
  {
    value: 'No-Show',
    label: 'No-Show',
    description: 'Client was absent from the scheduled Google Meet',
    badgeClass: 'text-zinc-700 bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
  }
];

export const CompleteMeetingModal: React.FC<CompleteMeetingModalProps> = ({
  isOpen,
  onClose,
  message,
  onSuccess
}) => {
  const [outcome, setOutcome] = useState<MeetingOutcome>('Project Agreed');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Reset or initialize when opened
  React.useEffect(() => {
    if (message) {
      setOutcome(message.meetingOutcome || 'Project Agreed');
      setNotes(message.meetingNotes || '');
      setFollowUpDate(message.followUpDate || '');
    }
  }, [message, isOpen]);

  if (!isOpen || !message) return null;

  const handleInsertTemplate = () => {
    const template = [
      '• Client Goals & Key Objectives:',
      `  - ${message.projectType || 'Full-Stack Development'} requirements discussed`,
      '• Technical Architecture & Stack Selected:',
      '  - React, TypeScript, Tailwind CSS, Cloud Firestore',
      '• Agreed Deliverables & Scope:',
      '  - MVP milestone breakdown and schedule',
      '• Next Action Step:',
      '  - Send formal engagement agreement and deposit invoice'
    ].join('\n');
    setNotes(template);
  };

  const handleSave = async () => {
    if (!notes.trim()) {
      showToast('Please add a few summary notes or takeaways from the meeting.', 'error');
      return;
    }

    setSaving(true);
    try {
      await completeMeeting(message.id, {
        meetingOutcome: outcome,
        meetingNotes: notes,
        followUpDate: followUpDate || undefined
      });

      const updated: ContactMessage = {
        ...message,
        status: 'Completed',
        meetingOutcome: outcome,
        meetingNotes: notes,
        completedAt: new Date().toISOString(),
        ...(followUpDate ? { followUpDate } : {})
      };

      showToast('Discovery call marked as completed and outcome logged.', 'success');
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Failed to complete meeting.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Complete Discovery Call
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Record meeting takeaways, agreed next steps, and client outcome
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          
          {/* Client Summary Box */}
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 rounded-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">{message.name}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{message.email}</div>
              </div>
              <div className="text-right text-xs">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {formatScheduleSlot(message.scheduledSlot)}
                </span>
                <div className="text-zinc-500 dark:text-zinc-400">{message.projectType || 'General Inquiry'}</div>
              </div>
            </div>
          </div>

          {/* Outcome Radio Options */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5">
              Call Outcome & Next Status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OUTCOME_OPTIONS.map((opt) => {
                const isSelected = outcome === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setOutcome(opt.value)}
                    className={`flex items-start text-left gap-2.5 p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-zinc-400 dark:border-zinc-600'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                        {opt.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meeting Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                Meeting Notes & Agreed Deliverables
              </label>
              <button
                type="button"
                onClick={handleInsertTemplate}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Sparkles className="w-3 h-3" />
                Insert Outline Template
              </button>
            </div>
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record key discussion points, requirements discussed, technology preferences, and next steps..."
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono leading-relaxed"
            />
          </div>

          {/* Follow-up target date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Follow-Up Target Date (Optional)
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            
            {/* Convert to Project Notice */}
            {outcome === 'Project Agreed' && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Project Agreed!
                  </div>
                  <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400 mt-0.5">
                    Ready to track this development in Admin Projects?
                  </div>
                </div>
                <a
                  href="/administrator/projects"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shrink-0 flex items-center gap-1"
                >
                  Go to Projects
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving Outcome...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Mark Completed & Save Notes
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
