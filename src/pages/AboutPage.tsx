import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, Award, Briefcase, MapPin, Mail, Calendar, 
  Download, ArrowRight, ExternalLink, CheckCircle2 
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { Experience, Education, Certification, Skill } from '../types';
import { getExperiences } from '../services/experienceService';
import { getEducation } from '../services/educationService';
import { getCertifications } from '../services/certificationService';
import { getSkills } from '../services/skillService';
import { logAnalyticsEvent } from '../services/analyticsService';

export const AboutPage: React.FC = () => {
  const { profile } = useSettings();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logAnalyticsEvent({ type: 'page_view', path: '/about' });

    async function loadAboutData() {
      try {
        const [e, edu, certs, sk] = await Promise.all([
          getExperiences(),
          getEducation(),
          getCertifications(),
          getSkills()
        ]);
        setExperiences(e);
        setEducation(edu);
        setCertifications(certs);
        setSkills(sk);
      } catch (err) {
        console.warn('About data notice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAboutData();
  }, []);

  return (
    <div id="about-page" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* 1. Header Profile & Biography */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-36 h-36 md:w-44 md:h-44 rounded-3xl overflow-hidden shrink-0 shadow-lg border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
            {profile?.profileImage ? (
              <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-4xl text-zinc-400">
                {profile?.name ? profile.name.charAt(0) : 'A'}
              </div>
            )}
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                About Me
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {profile?.name || 'Codewithbelia'}
              </h1>
              <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mt-1">
                {profile?.professionalTitle}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-zinc-600 dark:text-zinc-400">
              {profile?.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile?.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-zinc-400" />
                  <span>{profile.email}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-zinc-400" />
                <span>{profile?.yearsOfExperience || '3+'} Years in Production</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <Link
                to="/resume"
                className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Resume</span>
              </Link>
              <Link
                to="/contact"
                className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors inline-flex items-center gap-2"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Me</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Biography Block */}
        <div className="p-6 md:p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 leading-relaxed text-sm md:text-base text-zinc-700 dark:text-zinc-300 space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Biography</h2>
          <p>{profile?.biography}</p>
        </div>
      </section>

      {/* 2. Development Philosophy & Principles */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Engineering Philosophy</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-2">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Zero-Trust Reliability</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Security and schema validation must be integrated directly into cloud rules and backend logic—never trusting client-side inputs blindly.
            </p>
          </div>
          <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-2">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">User-Centric Architecture</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Real-world systems must solve tangible human friction. Performance, accessibility, and clear feedback make apps resilient and pleasant to use.
            </p>
          </div>
          <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-2">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Maintainable Craft</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Clean separation between entities, service repositories, and reactive presentation layers guarantees long-term maintainability.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Experience Highlights */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Career Experience</h2>
          </div>
          <Link to="/experience" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            View complete timeline →
          </Link>
        </div>

        <div className="space-y-4">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{exp.position}</h3>
                  <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {exp.organization} • {exp.location} ({exp.employmentType})
                  </div>
                </div>
                <span className="text-xs font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                  {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {exp.description}
              </p>
              {exp.responsibilities?.length > 0 && (
                <ul className="space-y-1.5 pt-2">
                  {exp.responsibilities.slice(0, 3).map((r, i) => (
                    <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. Education & Academic Background */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Education</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {education.map((edu) => (
            <div
              key={edu.id}
              className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{edu.degree}</h3>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{edu.field}</div>
                  <div className="text-xs text-zinc-500">{edu.institution}, {edu.location}</div>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {edu.startDate} – {edu.endDate || 'Present'}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {edu.description}
              </p>
              {edu.achievements && edu.achievements.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {edu.achievements.map((ach) => (
                    <span key={ach} className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {ach}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 5. Certifications & Credentials */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Certifications & Credentials</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{cert.name}</h3>
                  <div className="text-xs text-zinc-500">{cert.issuer}</div>
                  {cert.credentialId && (
                    <div className="text-xs font-mono text-zinc-400">ID: {cert.credentialId}</div>
                  )}
                </div>
                <span className="text-xs font-mono text-zinc-400">{cert.issueDate}</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {cert.description}
              </p>
              {cert.credentialUrl && (
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-2"
                >
                  <span>Verify Credential</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
