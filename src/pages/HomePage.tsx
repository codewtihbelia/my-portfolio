import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Download,
  Mail,
  ExternalLink,
  Code2,
  Layers,
  Briefcase,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Star,
  Calendar,
  Clock,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import {
  Project,
  Skill,
  Experience,
  Service,
  Testimonial,
  BlogPost,
} from "../types";
import { getProjects } from "../services/projectService";
import { getSkills } from "../services/skillService";
import { getExperiences } from "../services/experienceService";
import { getServices } from "../services/serviceService";
import { getTestimonials } from "../services/testimonialService";
import { getBlogPosts } from "../services/blogService";
import {
  getActiveResume,
  incrementResumeDownload,
} from "../services/resumeService";
import { downloadDocument } from "../services/storageService";
import { logAnalyticsEvent } from "../services/analyticsService";
import { ScrollHeroSection } from "../components/home/ScrollHeroSection";

export const HomePage: React.FC = () => {
  const { profile, settings, loading: settingsLoading } = useSettings();
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [activeResumeUrl, setActiveResumeUrl] = useState<string>("");
  const [activeResumeId, setActiveResumeId] = useState<string>("");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    logAnalyticsEvent({ type: "page_view", path: "/" });

    async function loadHomeContent() {
      try {
        const [
          fetchedProjects,
          fetchedSkills,
          fetchedExp,
          fetchedServices,
          fetchedTestimonials,
          fetchedBlogs,
          activeRes,
        ] = await Promise.all([
          getProjects(false),
          getSkills(),
          getExperiences(),
          settings.showServices !== false ? getServices() : Promise.resolve([]),
          settings.showTestimonials !== false
            ? getTestimonials(true)
            : Promise.resolve([]),
          settings.showBlog !== false
            ? getBlogPosts(false)
            : Promise.resolve([]),
          getActiveResume(),
        ]);

        setProjects(fetchedProjects);
        setSkills(fetchedSkills);
        setExperiences(fetchedExp);
        setServices(fetchedServices);
        setTestimonials(fetchedTestimonials);
        setBlogPosts(fetchedBlogs.slice(0, 3));

        if (activeRes) {
          setActiveResumeUrl(activeRes.fileUrl);
          setActiveResumeId(activeRes.id);
        }
      } catch (err) {
        console.warn("Homepage data fetch notice (using fallback):", err);
      } finally {
        setLoadingData(false);
      }
    }

    loadHomeContent();
  }, [settings.showServices, settings.showTestimonials, settings.showBlog]);

  const handleResumeDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (activeResumeId) {
      incrementResumeDownload(activeResumeId);
      logAnalyticsEvent({
        type: "resume_download",
        path: "/",
        targetId: activeResumeId,
      });
    }
    if (activeResumeUrl) {
      downloadDocument(activeResumeUrl, "Resume.pdf");
    }
  };

  const featuredProjects = projects.filter((p) => p.featured).slice(0, 4);
  const featuredSkills = skills.filter((s) => s.featured).slice(0, 8);

  if (settingsLoading || loadingData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-zinc-500">Loading portfolio...</p>
      </div>
    );
  }

  return (
    <div id="home-page" className="space-y-24 md:space-y-32">
      {/* 1. HERO SECTION (Scroll-driven Sticky Crossfade) */}
      <ScrollHeroSection
        profile={profile}
        activeResumeUrl={activeResumeUrl}
        handleResumeDownload={handleResumeDownload}
      />

      {/* 2. DYNAMIC PORTFOLIO METRICS (Section 11) */}
      <section
        id="statistics-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800">
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400">
                {projects.length}
              </div>
              <div className="mt-1 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Projects Completed
              </div>
            </div>

            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400">
                {skills.length}
              </div>
              <div className="mt-1 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Technologies Mastered
              </div>
            </div>

            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400">
                {experiences.length}
              </div>
              <div className="mt-1 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Positions Held
              </div>
            </div>

            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400">
                {profile?.yearsOfExperience || "3+"}
              </div>
              <div className="mt-1 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Years Experience
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED PROJECTS (Section 12, 13) */}
      <section
        id="featured-projects-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Selected Case Studies
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
              Featured Projects
            </h2>
          </div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>Browse all ({projects.length})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredProjects.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-500">
            No featured projects available yet. Add or feature one in the Admin
            CMS!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredProjects.map((project) => (
              <div
                key={project.id}
                id={`project-card-${project.slug}`}
                data-cursor-label="View"
                className="group rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <Layers className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-900/80 backdrop-blur-sm text-white">
                    {project.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {project.shortDescription}
                    </p>
                  </div>

                  {/* Technology Badges */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                      {project.technologies.slice(0, 5).map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 5 && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium text-zinc-400">
                          +{project.technologies.length - 5}
                        </span>
                      )}
                    </div>

                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                      <Link
                        to={`/projects/${project.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:gap-2 transition-all"
                      >
                        <span>Read Case Study</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                          title="Live Demo"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. SKILLS PREVIEW (Section 16, 17) */}
      <section
        id="skills-preview-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Technical Core
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
              Skills & Expertise
            </h2>
          </div>
          <Link
            to="/skills"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>View all skills ({skills.length})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {featuredSkills.map((skill) => (
            <div
              key={skill.id}
              className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  {skill.category}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {skill.years}
                </span>
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {skill.name}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                {skill.description || `${skill.level} proficiency`}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. SERVICES PREVIEW (Section 22) */}
      {settings.showServices && services.length > 0 && (
        <section
          id="services-preview-section"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
        >
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Offerings
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
              Services & Capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.slice(0, 3).map((serv) => (
              <div
                key={serv.id}
                className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {serv.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {serv.description}
                </p>
                <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  {serv.features?.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. TESTIMONIALS (Section 27) */}
      {settings.showTestimonials && testimonials.length > 0 && (
        <section
          id="testimonials-section"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
        >
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Endorsements
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
              What Colleagues & Clients Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: t.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                  "{t.message}"
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-300">
                    {t.photo ? (
                      <img
                        src={t.photo}
                        alt={t.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      t.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {t.name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {t.position} at {t.organization}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. LATEST BLOG POSTS (Section 23, 24) */}
      {settings.showBlog !== false && blogPosts.length > 0 && (
        <section
          id="latest-blog-section"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Writings & Thoughts
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
                Latest Articles
              </h2>
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>Browse all articles</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between p-6 space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {post.category}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readingTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    {post.publishedAt || "Recent"}
                  </span>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Read article →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 8. CALL TO ACTION SECTION */}
      <section
        id="cta-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900 dark:bg-zinc-900 text-white border border-zinc-800 text-center space-y-6 relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Let's Build Something Exceptional Together
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Have a project inquiry, system requirement, or engineering
              opportunity? I'm available for discussions and full-stack
              engagements.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <Link
                to="/contact"
                id="cta-start-conversation-btn"
                className="px-6 py-3 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 font-semibold text-sm transition-colors"
              >
                Start a Conversation
              </Link>
              <Link
                to="/projects"
                className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-colors"
              >
                Review Portfolio
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
