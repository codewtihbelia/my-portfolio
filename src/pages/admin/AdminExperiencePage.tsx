import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Briefcase, Calendar } from "lucide-react";
import { Experience } from "../../types";
import {
  getExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
} from "../../services/experienceService";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { Select } from "../../components/ui/Select";
import { Spinner } from "../../components/ui/Spinner";

export const AdminExperiencePage: React.FC = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { showToast } = useToast();

  const emptyExperience: Omit<Experience, "id"> = {
    position: "",
    organization: "",
    location: "Remote",
    employmentType: "Full-Time",
    startDate: "2023-01",
    endDate: "",
    current: true,
    description: "",
    responsibilities: [],
    achievements: [],
    technologies: [],
    order: 1,
    displayOrder: 1,
  };

  const [formData, setFormData] =
    useState<Omit<Experience, "id">>(emptyExperience);
  const [respText, setRespText] = useState("");
  const [achText, setAchText] = useState("");
  const [techText, setTechText] = useState("");

  const loadExperiences = async () => {
    setLoading(true);
    try {
      const data = await getExperiences();
      setExperiences(data);
    } catch (err) {
      console.error(err);
      showToast("Error loading experiences.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperiences();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(emptyExperience);
    setRespText("");
    setAchText("");
    setTechText("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: Experience) => {
    setEditingId(exp.id);
    setFormData({
      position: exp.position,
      organization: exp.organization,
      location: exp.location,
      employmentType: exp.employmentType,
      startDate: exp.startDate,
      endDate: exp.endDate || "",
      current: exp.current || false,
      description: exp.description,
      responsibilities: exp.responsibilities || [],
      achievements: exp.achievements || [],
      technologies: exp.technologies || [],
      order: exp.order || exp.displayOrder || 1,
      displayOrder: exp.displayOrder || exp.order || 1,
    });
    setRespText((exp.responsibilities || []).join("\n"));
    setAchText((exp.achievements || []).join("\n"));
    setTechText((exp.technologies || []).join(", "));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.position.trim() || !formData.organization.trim()) return;

    const responsibilities = respText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);
    const achievements = achText
      .split("\n")
      .map((a) => a.trim())
      .filter(Boolean);
    const technologies = techText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      ...formData,
      responsibilities,
      achievements,
      technologies,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateExperience(editingId, payload);
        showToast("Experience updated.", "success");
      } else {
        await createExperience(payload);
        showToast("Experience created.", "success");
      }
      setIsModalOpen(false);
      await loadExperiences();
    } catch (err) {
      console.error(err);
      showToast("Error saving experience.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await deleteExperience(deleteConfirmId);
      showToast("Experience deleted.", "info");
      setDeleteConfirmId(null);
      await loadExperiences();
    } catch (err) {
      console.error(err);
      showToast("Error deleting experience.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div id="admin-experience-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Work Experience
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Maintain your employment history, positions held, key
            responsibilities, and achievements.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Position</span>
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">Position</th>
                <th className="p-4">Organization</th>
                <th className="p-4">Type</th>
                <th className="p-4">Period</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-400">
                    Loading experiences...
                  </td>
                </tr>
              ) : experiences.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-zinc-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <p className="text-xs text-zinc-500">
                        No career experience records in Cloud Firestore yet.
                      </p>
                      <button
                        onClick={handleOpenCreate}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Experience</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                experiences.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">
                      {exp.position}
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-400">
                      {exp.organization}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800">
                        {exp.employmentType}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-zinc-500">
                      {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(exp.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-xs">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {editingId ? "Edit Work Position" : "Add Work Position"}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Job Title / Position *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, position: e.target.value }))
                    }
                    placeholder="Full-Stack Developer"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Company / Organization *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.organization}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        organization: e.target.value,
                      }))
                    }
                    placeholder="Acme Tech Solutions"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, location: e.target.value }))
                    }
                    placeholder="Remote / Manila"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <Select
                    label="Employment Type"
                    value={formData.employmentType}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        employmentType: e.target.value,
                      }))
                    }
                    sizeVariant="sm"
                    options={[
                      {
                        value: "Full-time",
                        label: "Full-time",
                        // dotColor: "bg-emerald-500",
                      },
                      {
                        value: "Contract",
                        label: "Contract",
                        // dotColor: "bg-indigo-500",
                      },
                      {
                        value: "Part-time",
                        label: "Part-time",
                        // dotColor: "bg-sky-500",
                      },
                      {
                        value: "Freelance",
                        label: "Freelance",
                        // dotColor: "bg-purple-500",
                      },
                      {
                        value: "Internship",
                        label: "Internship",
                        // dotColor: "bg-amber-500",
                      },
                      {
                        value: "Consultancy",
                        label: "Consultancy",
                        // dotColor: "bg-teal-500",
                      },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="text"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, startDate: e.target.value }))
                    }
                    placeholder="2023-01"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    End Date (or check Present)
                  </label>
                  <input
                    type="text"
                    disabled={formData.current}
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, endDate: e.target.value }))
                    }
                    placeholder="2024-05"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="current-pos-checkbox"
                  checked={formData.current}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, current: e.target.checked }))
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="current-pos-checkbox"
                  className="font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  I currently work in this role
                </label>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  General Overview
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Responsibilities (one per line)
                </label>
                <textarea
                  rows={3}
                  value={respText}
                  onChange={(e) => setRespText(e.target.value)}
                  placeholder="Architected Firestore security rules&#10;Built responsive Next.js frontend"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Key Achievements (one per line)
                </label>
                <textarea
                  rows={2}
                  value={achText}
                  onChange={(e) => setAchText(e.target.value)}
                  placeholder="Reduced cold-start latency by 45%"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Technologies Used (comma separated)
                </label>
                <input
                  type="text"
                  value={techText}
                  onChange={(e) => setTechText(e.target.value)}
                  placeholder="React, TypeScript, Firestore, Tailwind CSS"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving && <Spinner size="sm" />}
                  <span>{saving ? "Saving Position..." : "Save Position"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Work Position?"
        message="Are you sure you want to remove this work record from Firestore?"
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleting}
      />
    </div>
  );
};
