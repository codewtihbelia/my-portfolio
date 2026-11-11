import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Layers, CheckCircle2 } from "lucide-react";
import { Service } from "../../types";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "../../services/serviceService";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { Spinner } from "../../components/ui/Spinner";

export const AdminServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { showToast } = useToast();

  const emptyService: Omit<Service, "id"> = {
    title: "",
    description: "",
    features: ["Feature item 1", "Feature item 2"],
    icon: "code",
    displayOrder: 1,
  };

  const [formData, setFormData] = useState(emptyService);
  const [featuresText, setFeaturesText] = useState("");

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await getServices();
      setServices(data);
    } catch (err) {
      console.error(err);
      showToast("Error loading services.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(emptyService);
    setFeaturesText(emptyService.features.join("\n"));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (serv: Service) => {
    setEditingId(serv.id);
    setFormData({
      title: serv.title,
      description: serv.description,
      features: serv.features || [],
      icon: serv.icon || "code",
      displayOrder: serv.displayOrder || 1,
    });
    setFeaturesText((serv.features || []).join("\n"));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const features = featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);
    const payload = { ...formData, features };

    setSaving(true);
    try {
      if (editingId) {
        await updateService(editingId, payload);
        showToast("Service updated.", "success");
      } else {
        await createService(payload);
        showToast("Service created.", "success");
      }
      setIsModalOpen(false);
      await loadServices();
    } catch (err) {
      console.error(err);
      showToast("Error saving service.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await deleteService(deleteConfirmId);
      showToast("Service deleted.", "info");
      setDeleteConfirmId(null);
      await loadServices();
    } catch (err) {
      console.error(err);
      showToast("Error deleting service.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div id="admin-services-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Services & Offerings
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Maintain freelance, consulting, or client service packages and
            feature checklists.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-zinc-400">
            Loading services...
          </div>
        ) : services.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-zinc-400">
            No services found.
          </div>
        ) : (
          services.map((serv) => (
            <div
              key={serv.id}
              className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {serv.title}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(serv)}
                      className="p-1 text-zinc-400 hover:text-indigo-600 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(serv.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {serv.description}
                </p>

                {serv.features && (
                  <ul className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    {serv.features.map((f, i) => (
                      <li
                        key={i}
                        className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {editingId ? "Edit Service" : "Add Service"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="e.g. Full-Stack Web Development"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Describe your service scope..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Features Included (one per line)
                </label>
                <textarea
                  rows={4}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Responsive UI Design&#10;Cloud Firestore DB Integration&#10;Role-based Authentication"
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
                  <span>{saving ? "Saving Service..." : "Save Service"}</span>
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
        title="Delete Service?"
        message="Are you sure you want to remove this service?"
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleting}
      />
    </div>
  );
};
