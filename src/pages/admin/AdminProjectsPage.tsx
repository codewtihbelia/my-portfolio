import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  CheckCircle2,
  Star,
  Eye,
  RefreshCw,
  Database,
} from "lucide-react";
import { Project } from "../../types";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  subscribeToProjects,
  seedProjectsToFirestore,
} from "../../services/projectService";
import { MediaPickerModal } from "../../components/ui/MediaPickerModal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { Select } from "../../components/ui/Select";
import { Spinner } from "../../components/ui/Spinner";
import { databaseId, firebaseConfig } from "../../lib/firebase";

export const AdminProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchParams, setSearchParams] = useSearchParams();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [mediaPickerField, setMediaPickerField] = useState<
    "thumbnail" | "heroImage" | null
  >(null);

  const { showToast } = useToast();

  const emptyProjectForm: Omit<Project, "id"> = {
    title: "",
    slug: "",
    shortDescription: "",
    category: "Full-Stack Development",
    status: "Completed",
    role: "Lead Full-Stack Engineer",
    duration: "3 months",
    client: "Production System",
    problem: "",
    solution: "",
    features: [
      "Real-time Firestore synchronization",
      "Authentication & ABAC permissions",
      "Responsive design",
    ],
    technologies: [
      "React 19",
      "TypeScript",
      "Tailwind CSS",
      "Cloud Firestore",
      "Firebase Auth",
    ],
    architecture:
      "Public Users -> Web Application -> Firebase Auth & Cloud Firestore -> Cloud Storage",
    developmentProcess: "",
    challenges: "",
    results: "",
    liveUrl: "",
    repositoryUrl: "",
    thumbnail: "",
    heroImage: "",
    featured: false,
    order: 1,
    displayOrder: 1,
    published: true,
    description: "",
  };

  const [formData, setFormData] =
    useState<Omit<Project, "id">>(emptyProjectForm);
  const [featuresText, setFeaturesText] = useState("");
  const [techText, setTechText] = useState("");

  const loadAllProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects(true);
      setProjects(data);
    } catch (err) {
      console.error(err);
      showToast("Error loading projects from Firestore.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllProjects();

    // Subscribe to live Firestore updates
    const unsubscribe = subscribeToProjects((realtimeProjects) => {
      setProjects(realtimeProjects);
      setLoading(false);
    });

    if (searchParams.get("create") === "true") {
      handleOpenCreate();
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSeedDefaultProjects = async () => {
    setSeeding(true);
    try {
      const count = await seedProjectsToFirestore();
      showToast(
        `Successfully populated ${count} sample projects into Cloud Firestore!`,
        "success",
      );
      await loadAllProjects();
    } catch (err: any) {
      console.error(err);
      showToast(
        "Failed to seed projects: " + (err.message || "Unknown error"),
        "error",
      );
    } finally {
      setSeeding(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(emptyProjectForm);
    setFeaturesText(emptyProjectForm.features.join("\n"));
    setTechText(emptyProjectForm.technologies.join(", "));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingId(project.id);
    setFormData({
      title: project.title,
      slug: project.slug,
      shortDescription: project.shortDescription,
      category: project.category,
      status: project.status,
      role: project.role || "",
      duration: project.duration || "",
      client: project.client || "",
      problem: project.problem || "",
      solution: project.solution || "",
      features: project.features || [],
      technologies: project.technologies || [],
      architecture: project.architecture || "",
      developmentProcess: project.developmentProcess || "",
      challenges: project.challenges || "",
      results: project.results || "",
      liveUrl: project.liveUrl || "",
      repositoryUrl: project.repositoryUrl || "",
      thumbnail: project.thumbnail || "",
      heroImage: project.heroImage || "",
      featured: project.featured || false,
      order: project.order || project.displayOrder || 1,
      displayOrder: project.displayOrder || project.order || 1,
      published: project.published ?? true,
      description: project.description || project.shortDescription || "",
    });
    setFeaturesText((project.features || []).join("\n"));
    setTechText((project.technologies || []).join(", "));
    setIsModalOpen(true);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleTitleChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: !editingId ? generateSlug(val) : prev.slug,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Title is required.", "error");
      return;
    }

    const cleanedFeatures = featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const cleanedTech = techText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    // Normalize URLs to have valid protocol if user typed raw domain
    const normalizeUrl = (url?: string) => {
      if (!url) return "";
      const trimmed = url.trim();
      if (!trimmed) return "";
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      return `https://${trimmed}`;
    };

    const payload = {
      ...formData,
      slug: formData.slug.trim() || generateSlug(formData.title),
      liveUrl: normalizeUrl(formData.liveUrl),
      repositoryUrl: normalizeUrl(formData.repositoryUrl),
      features: cleanedFeatures,
      technologies: cleanedTech,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateProject(editingId, payload);
        showToast("Project updated successfully in Cloud DB.", "success");
      } else {
        const newId = await createProject(payload);
        showToast(
          `Project created in Cloud Firestore (ID: ${newId.slice(0, 8)}...)`,
          "success",
        );
      }
      setIsModalOpen(false);
      await loadAllProjects();
    } catch (err: any) {
      console.error("Error saving project:", err);
      showToast(
        `Failed to save project: ${err?.message || "Database error"}`,
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteProject(deleteConfirmId);
      showToast("Project deleted from Firestore.", "info");
      setDeleteConfirmId(null);
      await loadAllProjects();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete project.", "error");
    }
  };

  const filtered = projects.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const title = (p.title || (p as any).name || "").toLowerCase();
    const category = (p.category || "").toLowerCase();
    const techMatch =
      p.technologies?.some((t) => (t || "").toLowerCase().includes(q)) ?? false;
    const matchesQuery =
      !q || title.includes(q) || category.includes(q) || techMatch;

    const status = (p.status || "").toLowerCase();
    const filter = statusFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || status === filter;

    return matchesQuery && matchesStatus;
  });

  return (
    <div id="admin-projects-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Projects & Case Studies
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Create, edit, and curate full-stack case studies, features, and
            architecture diagrams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllProjects}
            disabled={loading}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Sync directly with Cloud Firestore"
          >
            {loading ? (
              <Spinner size="xs" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Project</span>
          </button>
        </div>
      </div>

      {/* Cloud Firestore Status Card */}
      <div className="hidden p-3.5 sm:p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="text-emerald-900 dark:text-emerald-200 font-medium">
            <span className="font-bold">Live Cloud Firestore Connected:</span>{" "}
            <code className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 font-mono text-[11px] text-emerald-800 dark:text-emerald-300">
              {databaseId
                ? `${databaseId} (${firebaseConfig.projectId})`
                : firebaseConfig.projectId}
            </code>
          </div>
        </div>
        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium sm:text-right">
          Real-time sync active • {projects.length}{" "}
          {projects.length === 1 ? "project" : "projects"} saved in cloud
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects by title or tech..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="w-full sm:w-48 shrink-0">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sizeVariant="sm"
              options={[
                { value: "all", label: "All Statuses" },
                {
                  value: "Completed",
                  label: "Completed",
                  // dotColor: "bg-emerald-500",
                },
                {
                  value: "In Development",
                  label: "In Development",
                  // dotColor: "bg-indigo-500",
                },
                {
                  value: "Planning",
                  label: "Planning",
                  // dotColor: "bg-amber-500",
                },
                {
                  value: "Archived",
                  label: "Archived",
                  // dotColor: "bg-zinc-400",
                },
              ]}
            />
          </div>
        </div>

        <div className="text-xs text-zinc-500 font-mono self-end sm:self-center">
          Total: {projects.length} | Shown: {filtered.length}
        </div>
      </div>

      {/* Projects Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">Project</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4">Featured</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>Loading projects from Cloud Firestore...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <p className="text-xs text-zinc-500">
                        {projects.length === 0
                          ? "No project records in Cloud Firestore yet."
                          : "No projects match your search or filter criteria."}
                      </p>
                      {projects.length === 0 && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={handleOpenCreate}
                            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create First Project</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((proj) => (
                  <tr
                    key={proj.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                          {proj.thumbnail ? (
                            <img
                              src={proj.thumbnail}
                              alt={proj.title || (proj as any).name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                              <Layers className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            {proj.title ||
                              (proj as any).name ||
                              "Untitled Project"}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            /{proj.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-300">
                      {proj.category || "General"}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        {proj.status || "Completed"}
                      </span>
                    </td>
                    <td className="p-4">
                      {proj.featured ? (
                        <Star className="w-4 h-4 text-amber-500 fill-current" />
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-600">
                          —
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(proj)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(proj.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {editingId ? "Edit Project" : "Create New Project"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Close
              </button>
            </div>

            <form
              noValidate
              onSubmit={handleSave}
              className="p-6 overflow-y-auto space-y-6 flex-1 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, slug: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Short Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.shortDescription}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      shortDescription: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Select
                    label="Category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, category: e.target.value }))
                    }
                    sizeVariant="sm"
                    options={[
                      {
                        value: "Full-Stack Development",
                        label: "Full-Stack Development",
                      },
                      { value: "Web Application", label: "Web Application" },
                      {
                        value: "Cloud Architecture",
                        label: "Cloud Architecture",
                      },
                      {
                        value: "Mobile Application",
                        label: "Mobile Application",
                      },
                      { value: "DevOps & Tooling", label: "DevOps & Tooling" },
                      {
                        value: "UI/UX Engineering",
                        label: "UI/UX Engineering",
                      },
                      {
                        value: "API & Microservices",
                        label: "API & Microservices",
                      },
                    ]}
                  />
                </div>

                <div>
                  <Select
                    label="Status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, status: e.target.value }))
                    }
                    sizeVariant="sm"
                    options={[
                      {
                        value: "Completed",
                        label: "Completed",
                        // dotColor: "bg-emerald-500",
                        badge: "Live",
                        badgeColor:
                          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
                      },
                      {
                        value: "In Development",
                        label: "In Development",
                        // dotColor: "bg-indigo-500",
                        badge: "WIP",
                        badgeColor:
                          "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
                      },
                      {
                        value: "Planning",
                        label: "Planning",
                        // dotColor: "bg-amber-500",
                        badge: "Plan",
                        badgeColor:
                          "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
                      },
                      {
                        value: "Archived",
                        label: "Archived",
                        // dotColor: "bg-zinc-400",
                        badge: "Archived",
                        badgeColor:
                          "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
                      },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Role
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, role: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 min-h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Client / Organization
                  </label>
                  <input
                    type="text"
                    value={formData.client}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, client: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, duration: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Problem & Solution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    The Problem
                  </label>
                  <textarea
                    rows={3}
                    value={formData.problem}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, problem: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    The Solution
                  </label>
                  <textarea
                    rows={3}
                    value={formData.solution}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, solution: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Features & Technologies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Key Features (one per line)
                  </label>
                  <textarea
                    rows={4}
                    value={featuresText}
                    onChange={(e) => setFeaturesText(e.target.value)}
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Technologies (comma separated)
                  </label>
                  <textarea
                    rows={4}
                    value={techText}
                    onChange={(e) => setTechText(e.target.value)}
                    placeholder="React, TypeScript, Tailwind CSS, Firestore, Firebase Auth"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Architecture diagram notes */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Architecture Visualization Notes
                </label>
                <input
                  type="text"
                  value={formData.architecture}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, architecture: e.target.value }))
                  }
                  placeholder="Public Users -> Web App -> Firebase Auth & Firestore -> Storage"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              {/* Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Thumbnail Image
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.thumbnail}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          thumbnail: e.target.value,
                        }))
                      }
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaPickerField("thumbnail")}
                      className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-semibold"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Hero Case Study Image
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.heroImage}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          heroImage: e.target.value,
                        }))
                      }
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaPickerField("heroImage")}
                      className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-semibold"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Links & Featured Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Live Demo URL
                  </label>
                  <input
                    type="text"
                    value={formData.liveUrl}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, liveUrl: e.target.value }))
                    }
                    placeholder="https://... or demo link"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Repository URL
                  </label>
                  <input
                    type="text"
                    value={formData.repositoryUrl}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        repositoryUrl: e.target.value,
                      }))
                    }
                    placeholder="https://github.com/... or repo link"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="featured-checkbox"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, featured: e.target.checked }))
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label
                  htmlFor="featured-checkbox"
                  className="font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  Feature this project on the Homepage
                </label>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold shadow-sm inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  {saving && <Spinner size="sm" />}
                  <span>
                    {saving
                      ? editingId
                        ? "Updating..."
                        : "Saving to Cloud DB..."
                      : editingId
                        ? "Update Case Study"
                        : "Create Project"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      {mediaPickerField && (
        <MediaPickerModal
          isOpen={true}
          onClose={() => setMediaPickerField(null)}
          onSelect={(url) => {
            setFormData((prev) => ({ ...prev, [mediaPickerField]: url }));
            setMediaPickerField(null);
          }}
          title={`Select ${mediaPickerField === "thumbnail" ? "Thumbnail" : "Hero Image"}`}
          category="projects"
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Project?"
        message="Are you sure you want to delete this project? This will permanently remove the record from Cloud Firestore."
        confirmText="Delete Project"
        isDestructive={true}
      />
    </div>
  );
};
