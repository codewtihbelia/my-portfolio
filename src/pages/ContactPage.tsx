import React, { useState } from 'react';
import { Mail, MapPin, Send, CheckCircle2, Clock, MessageSquare, AlertCircle, Layers } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { createMessage } from '../services/messageService';
import { logAnalyticsEvent } from '../services/analyticsService';
import { useToast } from '../components/ui/Toast';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';

export const ContactPage: React.FC = () => {
  const { profile, settings } = useSettings();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    projectType: 'Full-Stack Development',
    budget: '',
    message: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMsg('Please fill in your name, email, and message.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      await createMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim() || 'General Inquiry',
        projectType: formData.projectType,
        budget: formData.budget.trim() || undefined,
        message: formData.message.trim()
      });

      logAnalyticsEvent({ type: 'contact_submission', path: '/contact' });
      setSubmitted(true);
      showToast('Message sent successfully!', 'success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        projectType: 'Full-Stack Development',
        budget: '',
        message: ''
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to send message. Please try again or email directly.');
      showToast('Error sending message to Firestore.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="contact-page" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="max-w-2xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Get In Touch
        </span>
        <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Let's Discuss Your Next Project
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Whether you need a full-stack web application, a database-backed portal, or have questions regarding technical architecture, send a direct message below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Contact info & availability */}
        <div className="lg:col-span-5 space-y-8">
          <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Direct Channels
            </h2>

            <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
              {profile?.email && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 font-medium">Email Address</div>
                    <a href={`mailto:${profile.email}`} className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline">
                      {profile.email}
                    </a>
                  </div>
                </div>
              )}

              {profile?.location && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 font-medium">Location</div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{profile.location}</div>
                  </div>
                </div>
              )}

              {profile?.availability && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 font-medium">Availability Status</div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{profile.availability}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Response Commitment</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Inquiries are persisted in Cloud Firestore and monitored regularly. You can expect a response within 24 to 48 business hours.
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Form */}
        <div className="lg:col-span-7">
          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Message Received!</h3>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Thank you for reaching out! Your inquiry has been logged to our records and forwarded to our notifications system. I will get back to you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-4"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMsg && (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jane@example.com"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Select
                      label="Project Type"
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      sizeVariant="md"
                      options={[
                        { 
                          value: 'Full-Stack Development', 
                          label: 'Full-Stack Development',
                          description: 'Complete web apps with Express & Firebase',
                          dotColor: 'bg-indigo-500'
                        },
                        { 
                          value: 'Web Application', 
                          label: 'Web Application',
                          description: 'Frontend SPA, React or dashboard platform',
                          dotColor: 'bg-emerald-500'
                        },
                        { 
                          value: 'Cloud Architecture / Firebase', 
                          label: 'Cloud Architecture / Firebase',
                          description: 'Firestore security rules, auth & scaling',
                          dotColor: 'bg-amber-500'
                        },
                        { 
                          value: 'UI/UX Engineering', 
                          label: 'UI/UX Engineering',
                          description: 'Design systems, themes & animations',
                          dotColor: 'bg-purple-500'
                        },
                        { 
                          value: 'Technical Consultation', 
                          label: 'Technical Consultation',
                          description: 'System audit, performance & code review',
                          dotColor: 'bg-sky-500'
                        },
                        { 
                          value: 'Other', 
                          label: 'Other Inquiry',
                          description: 'General questions or custom project scope',
                          dotColor: 'bg-zinc-400'
                        },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                      Budget / Timeline (Optional)
                    </label>
                    <input
                      type="text"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="e.g. $2,000 / 3 weeks"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Brief summary of your inquiry"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                    Message Details *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Please describe your requirements, timeline, or questions..."
                    className="w-full px-4 py-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  id="submit-contact-form-btn"
                  className="w-full py-3.5 px-6 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" />
                      <span>Sending message to Firestore...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Inquiry</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
