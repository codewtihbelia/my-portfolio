import React, { useEffect, useState } from 'react';
import { GraduationCap, Award, Calendar, MapPin, ExternalLink, CheckCircle2, BookOpen } from 'lucide-react';
import { Education, Certification } from '../types';
import { getEducation } from '../services/educationService';
import { getCertifications } from '../services/certificationService';
import { logAnalyticsEvent } from '../services/analyticsService';

export const EducationPage: React.FC = () => {
  const [educationList, setEducationList] = useState<Education[]>([]);
  const [certList, setCertList] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logAnalyticsEvent({ type: 'page_view', path: '/education' });

    async function loadData() {
      try {
        const [edu, certs] = await Promise.all([
          getEducation().catch(() => []),
          getCertifications().catch(() => [])
        ]);
        setEducationList(edu);
        setCertList(certs);
      } catch (err) {
        console.warn('Education data fetch notice:', err);
        setEducationList([]);
        setCertList([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div id="education-page" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
      {/* Header */}
      <div className="max-w-2xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Academic & Credentials
        </span>
        <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Education & Certifications
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Formal university foundations, continuous technical accreditations, software engineering qualifications, and professional certifications.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-zinc-500 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading academic background and credentials...</span>
        </div>
      ) : educationList.length === 0 && certList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-500 space-y-2">
          <div className="text-base font-semibold text-zinc-700 dark:text-zinc-300">No education or certification records found</div>
          <p className="text-xs text-zinc-400">Add your academic background and certificates in the Admin dashboard.</p>
        </div>
      ) : (
        <>
          {/* Formal Education Section */}
          {educationList.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Academic Background
                </h2>
              </div>

              <div className="space-y-6">
                {educationList.map((edu) => (
                  <div
                    key={edu.id}
                    id={`edu-item-${edu.id}`}
                    className="p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                          {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                        </h3>
                        <div className="text-base font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {edu.institution}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                        {edu.location && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800">
                            <MapPin className="w-3 h-3 text-zinc-400" />
                            <span>{edu.location}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          <span>{edu.startDate} – {edu.endDate || 'Present'}</span>
                        </span>
                      </div>
                    </div>

                    {edu.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        {edu.description}
                      </p>
                    )}

                    {edu.achievements && edu.achievements.length > 0 && (
                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Honors & Key Activities
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {edu.achievements.map((ach, i) => (
                            <li key={i} className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{ach}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications Section */}
          {certList.length > 0 && (
            <section className="space-y-6 pt-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Professional Certifications
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certList.map((cert) => (
                  <div
                    key={cert.id}
                    id={`cert-item-${cert.id}`}
                    className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                          {cert.name}
                        </h3>
                        <span className="text-xs font-mono text-zinc-400 shrink-0">
                          {cert.issueDate}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {cert.issuer}
                      </div>
                      {cert.credentialId && (
                        <div className="text-xs text-zinc-400 font-mono">
                          ID: {cert.credentialId}
                        </div>
                      )}
                      {cert.description && (
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 pt-1 leading-relaxed">
                          {cert.description}
                        </p>
                      )}
                    </div>

                    {cert.credentialUrl && (
                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                        >
                          <span>Verify Credential</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
