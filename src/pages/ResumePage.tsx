import React, { useEffect, useState } from 'react';
import { Download, FileText, CheckCircle2, GraduationCap, Briefcase, ExternalLink, Eye } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { Resume, Experience, Education, Skill } from '../types';
import { getActiveResume, incrementResumeDownload } from '../services/resumeService';
import { downloadDocument } from '../services/storageService';
import { PdfViewerModal } from '../components/ui/PdfViewerModal';
import { getExperiences } from '../services/experienceService';
import { getEducation } from '../services/educationService';
import { getSkills } from '../services/skillService';
import { logAnalyticsEvent } from '../services/analyticsService';
import { useToast } from '../components/ui/Toast';

export const ResumePage: React.FC = () => {
  const { profile } = useSettings();
  const { showToast } = useToast();
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    logAnalyticsEvent({ type: 'page_view', path: '/resume' });
    async function loadResumeData() {
      try {
        const [res, exp, edu, sk] = await Promise.all([
          getActiveResume(),
          getExperiences(),
          getEducation(),
          getSkills()
        ]);
        setActiveResume(res);
        setExperiences(exp);
        setEducation(edu);
        setSkills(sk);
      } catch (err) {
        console.warn('Resume data notice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResumeData();
  }, []);

  const handleDownload = (e?: React.MouseEvent) => {
    if (activeResume) {
      if (e) e.preventDefault();
      incrementResumeDownload(activeResume.id);
      logAnalyticsEvent({
        type: 'resume_download',
        targetId: activeResume.id,
        path: '/resume'
      });
      downloadDocument(activeResume.fileUrl, activeResume.title || 'Resume.pdf');
      showToast('Resume download started.', 'info');
    }
  };

  return (
    <div id="resume-page" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header & Download Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-zinc-900 text-white shadow-xl">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Curriculum Vitae
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {profile?.name || 'Developer'} — Resume
          </h1>
          <p className="text-sm text-zinc-400">
            {activeResume ? `${activeResume.title} (v${activeResume.version})` : 'Full-stack engineering resume & credentials.'}
          </p>
        </div>

        {activeResume ? (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer border border-zinc-700/60"
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>Preview PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              id="download-resume-btn"
              className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => window.print()}
            className="px-6 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors shrink-0 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Print / Save View</span>
          </button>
        )}
      </div>

      {/* In-App PDF Document Viewer Modal */}
      {activeResume && (
        <PdfViewerModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={activeResume.title}
          fileUrl={activeResume.fileUrl}
          version={activeResume.version}
        />
      )}

      {/* Resume Document Canvas */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-10 text-zinc-800 dark:text-zinc-200">
        {/* Contact Info Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-8 space-y-3">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            {profile?.name}
          </h2>
          <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {profile?.professionalTitle}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            {profile?.email && <span>{profile.email}</span>}
            {profile?.phone && <span>{profile.phone}</span>}
            {profile?.location && <span>{profile.location}</span>}
          </div>
        </div>

        {/* Executive Summary */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Executive Summary
          </h3>
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {profile?.biography || profile?.shortIntroduction}
          </p>
        </section>

        {/* Experience Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Work Experience
            </h3>
          </div>

          <div className="space-y-6">
            {experiences.map((exp) => (
              <div key={exp.id} className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{exp.position}</h4>
                    <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{exp.organization} • {exp.location}</div>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{exp.description}</p>
                {exp.responsibilities && (
                  <ul className="space-y-1 pt-1">
                    {exp.responsibilities.map((r, i) => (
                      <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                        <span className="text-indigo-500">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Education Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Education
            </h3>
          </div>

          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id} className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{edu.degree} in {edu.field}</h4>
                  <div className="text-xs text-zinc-500">{edu.institution}, {edu.location}</div>
                </div>
                <span className="text-xs font-mono text-zinc-400">{edu.startDate} – {edu.endDate}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Core Skills */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Technical Proficiency
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span
                key={s.id}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
              >
                {s.name}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
