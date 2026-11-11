import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ExternalLink, Github, CheckCircle2, Clock, 
  User, Briefcase, Calendar, AlertCircle, Share2, Layers 
} from 'lucide-react';
import { Project } from '../types';
import { getProjectBySlug, getProjects } from '../services/projectService';
import { ArchitectureDiagram } from '../components/ui/ArchitectureDiagram';
import { logAnalyticsEvent } from '../services/analyticsService';
import { useToast } from '../components/ui/Toast';

export const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    async function loadProjectDetails() {
      setLoading(true);
      try {
        const found = await getProjectBySlug(slug!);
        if (!found) {
          setProject(null);
          return;
        }
        setProject(found);

        logAnalyticsEvent({
          type: 'project_view',
          targetId: found.id,
          path: `/projects/${slug}`
        });

        // Load related projects in same category
        const allProjects = await getProjects(false);
        const related = allProjects
          .filter((p) => p.slug !== slug && (p.category === found.category || p.featured))
          .slice(0, 2);
        setRelatedProjects(related);
      } catch (err) {
        console.warn('Project detail notice:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProjectDetails();
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Project link copied to clipboard!', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-zinc-500">Loading case study from Cloud Firestore...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto" />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Project Not Found</h1>
        <p className="text-sm text-zinc-500">
          The requested project case study could not be located in Firestore.
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all projects</span>
        </Link>
      </div>
    );
  }

  return (
    <div id="project-detail-page" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Back link & actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>
      </div>

      {/* Hero */}
      <header className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
            {project.category}
          </span>
          <span className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
            {project.status}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
          {project.title}
        </h1>

        <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-3xl">
          {project.shortDescription}
        </p>

        {/* Metadata Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs">
          {project.role && (
            <div>
              <div className="text-zinc-400 font-medium">Role</div>
              <div className="text-zinc-900 dark:text-zinc-100 font-semibold mt-0.5">{project.role}</div>
            </div>
          )}
          {project.duration && (
            <div>
              <div className="text-zinc-400 font-medium">Duration</div>
              <div className="text-zinc-900 dark:text-zinc-100 font-semibold mt-0.5">{project.duration}</div>
            </div>
          )}
          {project.client && (
            <div>
              <div className="text-zinc-400 font-medium">Client / Organization</div>
              <div className="text-zinc-900 dark:text-zinc-100 font-semibold mt-0.5">{project.client}</div>
            </div>
          )}
          <div>
            <div className="text-zinc-400 font-medium">Links</div>
            <div className="flex items-center gap-3 mt-0.5">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Live</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {project.repositoryUrl && (
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-semibold text-zinc-700 dark:text-zinc-300 hover:underline inline-flex items-center gap-1"
                >
                  <Github className="w-3 h-3" />
                  <span>Repo</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Hero Image */}
        {project.heroImage && (
          <div className="rounded-3xl overflow-hidden aspect-video border border-zinc-200 dark:border-zinc-800 shadow-lg">
            <img src={project.heroImage} alt={project.title} className="w-full h-full object-cover" />
          </div>
        )}
      </header>

      {/* Problem & Solution (Section 95) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 space-y-3">
          <h2 className="text-base font-bold text-rose-900 dark:text-rose-200">The Problem</h2>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {project.problem || 'Identified inefficiencies in manual recording, data fragmentation, and unorganized communication channels.'}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 space-y-3">
          <h2 className="text-base font-bold text-emerald-900 dark:text-emerald-200">The Solution</h2>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {project.solution || 'Engineered a centralized web platform integrating real-time database synchronization, validated inputs, and role-based permissions.'}
          </p>
        </div>
      </section>

      {/* Core Features */}
      {project.features && project.features.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Key Features & Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {project.features.map((feat, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{feat}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Architecture Visualization (Section 93) */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">System Architecture</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Conceptual flow diagram depicting end-user browser ingress, presentation layer, Firebase authentication guardrails, and persistent Firestore data tiers.
        </p>
        <ArchitectureDiagram customNotes={project.architecture} />
      </section>

      {/* Technology Stack Badges (Section 94) */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Technologies Used</h2>
        <div className="flex flex-wrap gap-2">
          {project.technologies?.map((tech) => (
            <span
              key={tech}
              className="px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Process, Challenges & Results */}
      <section className="space-y-6">
        {project.developmentProcess && (
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Development Process</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {project.developmentProcess}
            </p>
          </div>
        )}

        {project.challenges && (
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Challenges & Solutions</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {project.challenges}
            </p>
          </div>
        )}

        {project.results && (
          <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
            <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-200">Outcome & Results</h2>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {project.results}
            </p>
          </div>
        )}
      </section>

      {/* Project Gallery if available */}
      {project.gallery && project.gallery.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Project Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {project.gallery.map((imgUrl, i) => (
              <div key={i} className="rounded-2xl overflow-hidden aspect-video border border-zinc-200 dark:border-zinc-800">
                <img src={imgUrl} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Related Case Studies</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedProjects.map((rel) => (
              <Link
                key={rel.id}
                to={`/projects/${rel.slug}`}
                className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-500 transition-colors space-y-2 block"
              >
                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{rel.category}</div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{rel.title}</h3>
                <p className="text-xs text-zinc-500 line-clamp-2">{rel.shortDescription}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
