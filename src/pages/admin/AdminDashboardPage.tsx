import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderGit2,
  BookOpen,
  Code2,
  Briefcase,
  MessageSquare,
  FileText,
  Plus,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { getProjects } from "../../services/projectService";
import { getSkills } from "../../services/skillService";
import { getBlogPosts } from "../../services/blogService";
import { getExperiences } from "../../services/experienceService";
import { getMessages } from "../../services/messageService";
import { getResumes } from "../../services/resumeService";
import { getActivityLogs } from "../../services/activityService";
import { seedDatabaseIfEmpty } from "../../services/seedService";
import { ContactMessage, ActivityLog } from "../../types";
import { useToast } from "../../components/ui/Toast";
import { Spinner } from "../../components/ui/Spinner";

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    projectsCount: 0,
    skillsCount: 0,
    blogsCount: 0,
    experiencesCount: 0,
    messagesCount: 0,
    unreadMessages: 0,
    resumesCount: 0,
  });

  const [recentMessages, setRecentMessages] = useState<ContactMessage[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const { showToast } = useToast();

  const loadDashboardData = async () => {
    try {
      const [pRes, sRes, bRes, eRes, mRes, rRes, logsRes] =
        await Promise.allSettled([
          getProjects(true),
          getSkills(),
          getBlogPosts(true),
          getExperiences(),
          getMessages(),
          getResumes(),
          getActivityLogs(10),
        ]);

      const p = pRes.status === "fulfilled" ? pRes.value : [];
      const s = sRes.status === "fulfilled" ? sRes.value : [];
      const b = bRes.status === "fulfilled" ? bRes.value : [];
      const e = eRes.status === "fulfilled" ? eRes.value : [];
      const m = mRes.status === "fulfilled" ? mRes.value : [];
      const r = rRes.status === "fulfilled" ? rRes.value : [];
      const logs = logsRes.status === "fulfilled" ? logsRes.value : [];

      const unread = m.filter(
        (msg) =>
          msg.status === "New" ||
          (msg.status as string).toLowerCase() === "new",
      ).length;

      setStats({
        projectsCount: p.length,
        skillsCount: s.length,
        blogsCount: b.length,
        experiencesCount: e.length,
        messagesCount: m.length,
        unreadMessages: unread,
        resumesCount: r.length,
      });

      setRecentMessages(m.slice(0, 5));
      setActivityLogs(logs);
    } catch (err) {
      console.warn("Dashboard loading note:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedDatabaseIfEmpty();
      if (res.seeded) {
        showToast(
          "Database seeded with complete portfolio records!",
          "success",
        );
      } else {
        showToast("Database is already initialized.", "info");
      }
      await loadDashboardData();
    } catch (err) {
      console.error(err);
      showToast("Error seeding database.", "error");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div id="admin-dashboard-page" className="space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            CMS Overview
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your personal portfolio database, case studies, resume files,
            and incoming inquiries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="hidden px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {seeding ? (
              <Spinner size="xs" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{seeding ? "Seeding..." : "Seed Sample Records"}</span>
          </button>

          <Link
            to="/"
            target="_blank"
            rel="noreferrer noopener"
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Cloud Security Indicator */}
      <div className="hidden p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>Cloud Firestore Active:</strong> Security rules enforce
            Attribute-Based Access Control (ABAC). Public write access is
            restricted to contact messages; administrative endpoints require
            authenticated credentials.
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        <Link
          to="/administrator/projects"
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 transition-colors space-y-2 block"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <FolderGit2 className="w-4 h-4 text-indigo-500" />
            <span className="text-xs">Projects</span>
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {stats.projectsCount}
          </div>
        </Link>

        <Link
          to="/administrator/skills"
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 transition-colors space-y-2 block"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <Code2 className="w-4 h-4 text-sky-500" />
            <span className="text-xs">Skills</span>
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {stats.skillsCount}
          </div>
        </Link>

        <Link
          to="/administrator/experience"
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 transition-colors space-y-2 block"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <Briefcase className="w-4 h-4 text-amber-500" />
            <span className="text-xs">Experience</span>
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {stats.experiencesCount}
          </div>
        </Link>

        <Link
          to="/administrator/blog"
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 transition-colors space-y-2 block"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <BookOpen className="w-4 h-4 text-rose-500" />
            <span className="text-xs">Articles</span>
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {stats.blogsCount}
          </div>
        </Link>

        <Link
          to="/administrator/messages"
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 transition-colors space-y-2 block relative"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            <span className="text-xs">Inquiries</span>
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            {stats.messagesCount}
            {stats.unreadMessages > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                {stats.unreadMessages} new
              </span>
            )}
          </div>
        </Link>

        <Link
          to="/administrator/resumes"
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 transition-colors space-y-2 block"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <FileText className="w-4 h-4 text-violet-500" />
            <span className="text-xs">Resumes</span>
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {stats.resumesCount}
          </div>
        </Link>
      </div>

      {/* Quick Actions Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Quick Actions
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/administrator/projects?create=true"
            className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </Link>
          <Link
            to="/administrator/blog?create=true"
            className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Write Article</span>
          </Link>
          <Link
            to="/administrator/skills"
            className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Skill</span>
          </Link>
          <Link
            to="/administrator/resumes"
            className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Resume</span>
          </Link>
          <Link
            to="/administrator/profile"
            className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>

      {/* Two Column Section: Recent Messages & Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Recent Messages */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Recent Inquiries
              </h2>
              <p className="text-xs text-zinc-500">
                Incoming messages from the contact form
              </p>
            </div>
            <Link
              to="/administrator/messages"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View all →
            </Link>
          </div>

          {recentMessages.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No inquiries received yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <Link
                  key={msg.id}
                  to="/administrator/messages"
                  className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {msg.name}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {msg.email}
                      </span>
                      {(msg.status === "New" ||
                        (msg.status as string) === "new") && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1">
                      {msg.subject}: {msg.message}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Audit / Activity Logs */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Activity & Audit Feed
            </h2>
            <p className="text-xs text-zinc-500">
              Real-time mutation events in Firestore
            </p>
          </div>

          {activityLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No recent activity logged.
            </div>
          ) : (
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                      {log.action} {log.entityType}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {log.createdAt
                        ? new Date(
                            log.createdAt.toDate
                              ? log.createdAt.toDate()
                              : log.createdAt,
                          ).toLocaleTimeString()
                        : "Just now"}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {log.details}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
