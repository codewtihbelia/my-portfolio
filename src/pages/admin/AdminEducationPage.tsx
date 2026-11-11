import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  Award,
  ExternalLink,
} from "lucide-react";
import { Education, Certification } from "../../types";
import {
  getEducation,
  createEducation,
  updateEducation,
  deleteEducation,
} from "../../services/educationService";
import {
  getCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
} from "../../services/certificationService";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { Spinner } from "../../components/ui/Spinner";

export const AdminEducationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"education" | "certifications">(
    "education",
  );
  const [educationList, setEducationList] = useState<Education[]>([]);
  const [certList, setCertList] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingEdu, setSavingEdu] = useState(false);
  const [savingCert, setSavingCert] = useState(false);
  const [deletingEdu, setDeletingEdu] = useState(false);
  const [deletingCert, setDeletingCert] = useState(false);

  // Education Modal State
  const [isEduModalOpen, setIsEduModalOpen] = useState(false);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [deleteEduId, setDeleteEduId] = useState<string | null>(null);

  // Certification Modal State
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [deleteCertId, setDeleteCertId] = useState<string | null>(null);

  const { showToast } = useToast();

  const emptyEdu: Omit<Education, "id"> = {
    institution: "",
    degree: "",
    field: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
    achievements: [],
    order: 1,
    displayOrder: 1,
  };

  const emptyCert: Omit<Certification, "id"> = {
    name: "",
    issuer: "",
    issueDate: "",
    expirationDate: "",
    expiryDate: "",
    credentialId: "",
    credentialUrl: "",
    description: "",
    order: 1,
    displayOrder: 1,
  };

  const [eduForm, setEduForm] = useState(emptyEdu);
  const [eduAchText, setEduAchText] = useState("");
  const [certForm, setCertForm] = useState(emptyCert);

  const loadData = async () => {
    setLoading(true);
    try {
      const [e, c] = await Promise.all([getEducation(), getCertifications()]);
      setEducationList(e);
      setCertList(c);
    } catch (err) {
      console.error(err);
      showToast("Error loading credentials.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Education Handlers
  const handleOpenCreateEdu = () => {
    setEditingEduId(null);
    setEduForm(emptyEdu);
    setEduAchText("");
    setIsEduModalOpen(true);
  };

  const handleOpenEditEdu = (edu: Education) => {
    setEditingEduId(edu.id);
    setEduForm({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      location: edu.location,
      startDate: edu.startDate,
      endDate: edu.endDate || "",
      description: edu.description || "",
      achievements: edu.achievements || [],
      order: edu.order || edu.displayOrder || 1,
      displayOrder: edu.displayOrder || edu.order || 1,
    });
    setEduAchText((edu.achievements || []).join("\n"));
    setIsEduModalOpen(true);
  };

  const handleSaveEdu = async (e: React.FormEvent) => {
    e.preventDefault();
    const achievements = eduAchText
      .split("\n")
      .map((a) => a.trim())
      .filter(Boolean);
    setSavingEdu(true);
    try {
      if (editingEduId) {
        await updateEducation(editingEduId, { ...eduForm, achievements });
        showToast("Education record updated.", "success");
      } else {
        await createEducation({ ...eduForm, achievements });
        showToast("Education record created.", "success");
      }
      setIsEduModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast("Error saving education.", "error");
    } finally {
      setSavingEdu(false);
    }
  };

  const handleDeleteEdu = async () => {
    if (!deleteEduId) return;
    setDeletingEdu(true);
    try {
      await deleteEducation(deleteEduId);
      showToast("Education record deleted.", "info");
      setDeleteEduId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast("Error deleting record.", "error");
    } finally {
      setDeletingEdu(false);
    }
  };

  // Certification Handlers
  const handleOpenCreateCert = () => {
    setEditingCertId(null);
    setCertForm(emptyCert);
    setIsCertModalOpen(true);
  };

  const handleOpenEditCert = (cert: Certification) => {
    setEditingCertId(cert.id);
    setCertForm({
      name: cert.name,
      issuer: cert.issuer,
      issueDate: cert.issueDate,
      expirationDate: cert.expirationDate || cert.expiryDate || "",
      expiryDate: cert.expiryDate || cert.expirationDate || "",
      credentialId: cert.credentialId || "",
      credentialUrl: cert.credentialUrl || "",
      description: cert.description || "",
      order: cert.order || cert.displayOrder || 1,
      displayOrder: cert.displayOrder || cert.order || 1,
    });
    setIsCertModalOpen(true);
  };

  const handleSaveCert = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCert(true);
    try {
      if (editingCertId) {
        await updateCertification(editingCertId, certForm);
        showToast("Certification updated.", "success");
      } else {
        await createCertification(certForm);
        showToast("Certification added.", "success");
      }
      setIsCertModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast("Error saving certification.", "error");
    } finally {
      setSavingCert(false);
    }
  };

  const handleDeleteCert = async () => {
    if (!deleteCertId) return;
    setDeletingCert(true);
    try {
      await deleteCertification(deleteCertId);
      showToast("Certification deleted.", "info");
      setDeleteCertId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast("Error deleting certification.", "error");
    } finally {
      setDeletingCert(false);
    }
  };

  return (
    <div id="admin-education-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Education & Certifications
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Maintain your academic credentials, degrees, licenses, and verified
            certifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "education" ? (
            <button
              onClick={handleOpenCreateEdu}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Education</span>
            </button>
          ) : (
            <button
              onClick={handleOpenCreateCert}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Certification</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("education")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "education"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Education ({educationList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("certifications")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "certifications"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Certifications ({certList.length})</span>
        </button>
      </div>

      {/* Tab 1: Education */}
      {activeTab === "education" && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">Degree & Field</th>
                <th className="p-4">Institution</th>
                <th className="p-4">Period</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {educationList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-zinc-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <p className="text-xs text-zinc-500">
                        No education records found in Cloud Firestore.
                      </p>
                      <button
                        onClick={handleOpenCreateEdu}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Education</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                educationList.map((edu) => (
                  <tr
                    key={edu.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                  >
                    <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">
                      {edu.degree} in {edu.field}
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-400">
                      {edu.institution}
                    </td>
                    <td className="p-4 font-mono text-zinc-500">
                      {edu.startDate} – {edu.endDate}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditEdu(edu)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-600 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteEduId(edu.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg"
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
      )}

      {/* Tab 2: Certifications */}
      {activeTab === "certifications" && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">Certificate Name</th>
                <th className="p-4">Issuer</th>
                <th className="p-4">Issued</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {certList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-zinc-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <p className="text-xs text-zinc-500">
                        No certification records found in Cloud Firestore.
                      </p>
                      <button
                        onClick={handleOpenCreateCert}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Certification</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                certList.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                  >
                    <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">
                      {c.name}
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-400">
                      {c.issuer}
                    </td>
                    <td className="p-4 font-mono text-zinc-500">
                      {c.issueDate}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditCert(c)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-600 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCertId(c.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg"
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
      )}

      {/* Education Modal */}
      {isEduModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {editingEduId ? "Edit Education" : "Add Education"}
            </h2>
            <form onSubmit={handleSaveEdu} className="space-y-3">
              <div>
                <label className="block font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                  Degree *
                </label>
                <input
                  type="text"
                  required
                  value={eduForm.degree}
                  onChange={(e) =>
                    setEduForm((p) => ({ ...p, degree: e.target.value }))
                  }
                  placeholder="e.g. Bachelor of Science"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                  Field of Study *
                </label>
                <input
                  type="text"
                  required
                  value={eduForm.field}
                  onChange={(e) =>
                    setEduForm((p) => ({ ...p, field: e.target.value }))
                  }
                  placeholder="e.g. Computer Science"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                  Institution *
                </label>
                <input
                  type="text"
                  required
                  value={eduForm.institution}
                  onChange={(e) =>
                    setEduForm((p) => ({ ...p, institution: e.target.value }))
                  }
                  placeholder="e.g. University of the Philippines"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="text"
                    value={eduForm.startDate}
                    onChange={(e) =>
                      setEduForm((p) => ({ ...p, startDate: e.target.value }))
                    }
                    placeholder="2018"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="text"
                    value={eduForm.endDate}
                    onChange={(e) =>
                      setEduForm((p) => ({ ...p, endDate: e.target.value }))
                    }
                    placeholder="2022"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                  Honors / Achievements (one per line)
                </label>
                <textarea
                  rows={2}
                  value={eduAchText}
                  onChange={(e) => setEduAchText(e.target.value)}
                  placeholder="Magna Cum Laude&#10;Dean's List"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEduModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdu}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingEdu && <Spinner size="sm" />}
                  <span>
                    {savingEdu ? "Saving Education..." : "Save Education"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certification Modal */}
      {isCertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {editingCertId ? "Edit Certification" : "Add Certification"}
            </h2>
            <form onSubmit={handleSaveCert} className="space-y-3">
              <div>
                <label className="block font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                  Certificate Name *
                </label>
                <input
                  type="text"
                  required
                  value={certForm.name}
                  onChange={(e) =>
                    setCertForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Google Cloud Certified Associate Cloud Engineer"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                  Issuer *
                </label>
                <input
                  type="text"
                  required
                  value={certForm.issuer}
                  onChange={(e) =>
                    setCertForm((p) => ({ ...p, issuer: e.target.value }))
                  }
                  placeholder="e.g. Google Cloud"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="text"
                    value={certForm.issueDate}
                    onChange={(e) =>
                      setCertForm((p) => ({ ...p, issueDate: e.target.value }))
                    }
                    placeholder="2024"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                    Credential ID
                  </label>
                  <input
                    type="text"
                    value={certForm.credentialId}
                    onChange={(e) =>
                      setCertForm((p) => ({
                        ...p,
                        credentialId: e.target.value,
                      }))
                    }
                    placeholder="e.g. GC-948201"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                  Verification URL
                </label>
                <input
                  type="url"
                  value={certForm.credentialUrl}
                  onChange={(e) =>
                    setCertForm((p) => ({
                      ...p,
                      credentialUrl: e.target.value,
                    }))
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCertModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCert}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingCert && <Spinner size="sm" />}
                  <span>
                    {savingCert
                      ? "Saving Certification..."
                      : "Save Certification"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modals */}
      <ConfirmDialog
        isOpen={!!deleteEduId}
        onClose={() => setDeleteEduId(null)}
        onConfirm={handleDeleteEdu}
        title="Delete Education Record?"
        message="Are you sure you want to remove this education record?"
        confirmText="Delete"
        isDestructive={true}
        isLoading={deletingEdu}
      />
      <ConfirmDialog
        isOpen={!!deleteCertId}
        onClose={() => setDeleteCertId(null)}
        onConfirm={handleDeleteCert}
        title="Delete Certification?"
        message="Are you sure you want to remove this certification?"
        confirmText="Delete"
        isDestructive={true}
        isLoading={deletingCert}
      />
    </div>
  );
};
