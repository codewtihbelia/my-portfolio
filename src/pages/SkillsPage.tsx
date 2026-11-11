import React, { useEffect, useState, useMemo } from "react";
import { Skill } from "../types";
import { getSkills } from "../services/skillService";
import { logAnalyticsEvent } from "../services/analyticsService";
import {
  Code2,
  Server,
  Database,
  Cloud,
  Palette,
  Wrench,
  Sparkles,
} from "lucide-react";

export const SkillsPage: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logAnalyticsEvent({ type: "page_view", path: "/skills" });
    getSkills()
      .then(setSkills)
      .catch((err) => console.warn("Skills fetch notice:", err))
      .finally(() => setLoading(false));
  }, []);

  const groupedSkills = useMemo(() => {
    const groups: Record<string, Skill[]> = {
      Frontend: [],
      Backend: [],
      Database: [],
      DevOps: [],
      Design: [],
      Tools: [],
      Other: [],
    };

    skills.forEach((s) => {
      const cat = s.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });

    return groups;
  }, [skills]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Frontend":
        return <Code2 className="w-5 h-5 text-indigo-500" />;
      case "Backend":
        return <Server className="w-5 h-5 text-sky-500" />;
      case "Database":
        return <Database className="w-5 h-5 text-amber-500" />;
      case "DevOps":
        return <Cloud className="w-5 h-5 text-violet-500" />;
      case "Design":
        return <Palette className="w-5 h-5 text-rose-500" />;
      case "Tools":
        return <Wrench className="w-5 h-5 text-emerald-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Expert":
        return "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "Advanced":
        return "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
      case "Intermediate":
        return "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      default:
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
    }
  };

  return (
    <div
      id="skills-page"
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12"
    >
      <div className="max-w-2xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Technical Capabilities
        </span>
        <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Skills & Technical Stack
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Comprehensive breakdown of development languages, frameworks, cloud
          backends, database engines, and tooling utilized in building scalable
          web architectures.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-zinc-500 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading skills from Cloud Firestore...</span>
        </div>
      ) : skills.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-500 space-y-2">
          <div className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
            No skills listed yet
          </div>
          <p className="text-xs text-zinc-400">
            Add technical proficiencies and skills in the Admin dashboard.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {(Object.entries(groupedSkills) as [string, Skill[]][]).map(
            ([cat, list]) => {
              if (list.length === 0) return null;
              return (
                <section key={cat} className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    {getCategoryIcon(cat)}
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {cat}
                    </h2>
                    <span className="text-xs font-mono text-zinc-400">
                      ({list.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {list.map((skill) => (
                      <div
                        key={skill.id}
                        className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {skill.name}
                          </h3>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getLevelColor(skill.level)}`}
                          >
                            {skill.level}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          {skill.description || "Core engineering proficiency."}
                        </p>
                        {skill.years && (
                          <div className="text-[11px] font-mono text-zinc-400 pt-1">
                            Experience: {skill.years}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            },
          )}
        </div>
      )}
    </div>
  );
};
