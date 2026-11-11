import React, { useEffect, useState } from "react";
import { Briefcase, Calendar, MapPin, CheckCircle2, Award } from "lucide-react";
import { Experience } from "../types";
import { getExperiences } from "../services/experienceService";
import { logAnalyticsEvent } from "../services/analyticsService";

export const ExperiencePage: React.FC = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logAnalyticsEvent({ type: "page_view", path: "/experience" });
    getExperiences()
      .then(setExperiences)
      .catch((err) => console.warn("Experience fetch notice:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      id="experience-page"
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12"
    >
      <div className="max-w-2xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Career Journey
        </span>
        <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Professional Experience
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Chronological record of engineering roles, contract achievements,
          technical leadership, and digital systems built in production.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-zinc-500 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading career history from Cloud Firestore...</span>
        </div>
      ) : experiences.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl text-zinc-500">
          No experience records found in Firestore. Add your first position in
          the Admin dashboard!
        </div>
      ) : (
        <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 md:ml-6 space-y-10 pl-6 md:pl-8">
          {experiences.map((exp) => (
            <div key={exp.id} className="relative group">
              {/* Timeline marker node */}
              <div className="absolute -left-7.75 md:-left-9.75 top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 bg-indigo-600 dark:bg-indigo-400 shadow"></div>

              <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {exp.position}
                    </h3>
                    <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      {exp.organization}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 font-mono">
                    <span className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800">
                      {exp.employmentType}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800">
                      {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {exp.description}
                </p>

                {/* Responsibilities */}
                {exp.responsibilities && exp.responsibilities.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Key Responsibilities & Deliverables
                    </div>
                    <ul className="space-y-2">
                      {exp.responsibilities.map((resp, i) => (
                        <li
                          key={i}
                          className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 flex items-start gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Achievements */}
                {exp.achievements && exp.achievements.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>Key Milestones & Achievements</span>
                    </div>
                    <ul className="space-y-1.5">
                      {exp.achievements.map((ach, i) => (
                        <li
                          key={i}
                          className="text-xs text-zinc-600 dark:text-zinc-400 pl-4 border-l-2 border-amber-300 dark:border-amber-700"
                        >
                          {ach}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Technologies */}
                {exp.technologies && exp.technologies.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {exp.technologies.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
