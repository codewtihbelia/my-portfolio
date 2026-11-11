import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Code2,
  Star,
  CheckCircle2,
  Search,
} from "lucide-react";
import { Skill } from "../../types";
import {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
} from "../../services/skillService";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { Select } from "../../components/ui/Select";
import { Spinner } from "../../components/ui/Spinner";

export const AdminSkillsPage: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { showToast } = useToast();

  const emptySkill: Omit<Skill, "id"> = {
    name: "",
    category: "Frontend",
    level: "Advanced",
    years: "3 years",
    description: "",
    displayOrder: 1,
    featured: false,
  };

  const [formData, setFormData] = useState<Omit<Skill, "id">>(emptySkill);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const data = await getSkills();
      setSkills(data);
    } catch (err) {
      console.error(err);
      showToast("Error loading skills.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(emptySkill);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (skill: Skill) => {
    setEditingId(skill.id);
    setFormData({
      name: skill.name,
      category: skill.category,
      level: skill.level,
      years: skill.years || "",
      description: skill.description || "",
      displayOrder: skill.displayOrder || 1,
      featured: skill.featured || false,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      if (editingId) {
        await updateSkill(editingId, formData);
        showToast("Skill updated.", "success");
      } else {
        await createSkill(formData);
        showToast("Skill created.", "success");
      }
      setIsModalOpen(false);
      await loadSkills();
    } catch (err) {
      console.error(err);
      showToast("Error saving skill.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await deleteSkill(deleteConfirmId);
      showToast("Skill deleted.", "info");
      setDeleteConfirmId(null);
      await loadSkills();
    } catch (err) {
      console.error(err);
      showToast("Error deleting skill.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filteredSkills = skills.filter((s) => {
    const matchesCategory =
      filterCategory === "all" ||
      s.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description &&
        s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="admin-skills-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Skills & Competencies
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Maintain your technical stack, categories, years of experience, and
            featured skills.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Skill</span>
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1 max-w-xl">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search skills by name or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              sizeVariant="sm"
              options={[
                { value: "all", label: "All Categories" },
                { value: "Frontend", label: "Frontend" },
                { value: "Backend", label: "Backend" },
                { value: "Database", label: "Database" },
                { value: "DevOps", label: "DevOps" },
                { value: "Design", label: "Design" },
                { value: "Tools", label: "Tools" },
              ]}
            />
          </div>
        </div>

        <div className="text-xs text-zinc-500 font-mono self-end sm:self-center">
          Total: {skills.length} | Shown: {filteredSkills.length}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">Skill Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Proficiency</th>
                <th className="p-4">Experience</th>
                <th className="p-4">Featured</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-400">
                    Loading skills...
                  </td>
                </tr>
              ) : filteredSkills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <p className="text-xs text-zinc-500">
                        {skills.length === 0
                          ? "No skill records in Cloud Firestore yet."
                          : "No skills matched your search/filter criteria."}
                      </p>
                      {skills.length === 0 && (
                        <button
                          onClick={handleOpenCreate}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add First Skill</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSkills.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">
                      {s.name}
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-400">
                      {s.category}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                        {s.level}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-zinc-500">
                      {s.years || "—"}
                    </td>
                    <td className="p-4">
                      {s.featured ? (
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
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(s.id)}
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {editingId ? "Edit Skill" : "Add New Skill"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Skill Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. React 19"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, category: e.target.value }))
                  }
                  sizeVariant="sm"
                  options={[
                    { value: "Frontend", label: "Frontend" },
                    { value: "Backend", label: "Backend" },
                    { value: "Database", label: "Database" },
                    { value: "DevOps", label: "DevOps" },
                    { value: "Design", label: "Design" },
                    { value: "Tools", label: "Tools" },
                  ]}
                />

                <Select
                  label="Proficiency Level"
                  value={formData.level}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, level: e.target.value as any }))
                  }
                  sizeVariant="sm"
                  options={[
                    { value: "Beginner", label: "Beginner" },
                    { value: "Intermediate", label: "Intermediate" },
                    { value: "Advanced", label: "Advanced" },
                    { value: "Expert", label: "Expert" },
                  ]}
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Years of Experience
                </label>
                <input
                  type="text"
                  value={formData.years}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, years: e.target.value }))
                  }
                  placeholder="e.g. 3 years"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Brief Context / Note
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="e.g. Production state machines and hooks"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured-skill-checkbox"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, featured: e.target.checked }))
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="featured-skill-checkbox"
                  className="font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  Highlight on Homepage
                </label>
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
                  <span>{saving ? "Saving Skill..." : "Save Skill"}</span>
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
        title="Delete Skill?"
        message="Are you sure you want to remove this skill from Firestore?"
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleting}
      />
    </div>
  );
};
