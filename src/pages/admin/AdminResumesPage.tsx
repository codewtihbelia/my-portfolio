import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Download,
  ExternalLink,
  Star,
  FileCheck,
  Eye,
  Sparkles,
  Database,
  AlertCircle,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { ResumeDocument } from "../../types";
import {
  getResumes,
  createResume,
  updateResume,
  setDefaultResume,
  deleteResume,
} from "../../services/resumeService";
import {
  uploadResumeDocument,
  downloadDocument,
} from "../../services/storageService";
import { PdfViewerModal } from "../../components/ui/PdfViewerModal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { Spinner } from "../../components/ui/Spinner";

export const AdminResumesPage: React.FC = () => {
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // In-App PDF Preview Modal State
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    fileUrl: string;
    version?: string;
  }>({
    isOpen: false,
    title: "",
    fileUrl: "",
    version: "",
  });

  // Form State
  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("v1.0");
  const [fileUrl, setFileUrl] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [uploadProvider, setUploadProvider] = useState<
    "database" | "firebase" | null
  >(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickFileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const loadResumes = async () => {
    setLoading(true);
    try {
      const data = await getResumes();
      setResumes(data);
    } catch (err) {
      console.error(err);
      showToast("Error loading resumes.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const resetForm = () => {
    setEditingResumeId(null);
    setTitle("");
    setVersion(`v${((resumes.length || 0) + 1).toFixed(1)}`);
    setFileUrl("");
    setFileSize("");
    setIsDefault(resumes.length === 0);
    setUploadProvider(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (res: ResumeDocument) => {
    setEditingResumeId(res.id);
    setTitle(res.title);
    setVersion(res.version || "v1.0");
    setFileUrl(res.fileUrl);
    setFileSize(res.fileSize || "");
    setIsDefault(Boolean(res.isDefault || res.active));
    setUploadProvider(
      res.fileUrl.startsWith("data:") ? "database" : "firebase",
    );
    setIsModalOpen(true);
  };

  const processFileUpload = async (file: File) => {
    const validExtensions = [".pdf", ".doc", ".docx"];
    const isExtensionValid = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext),
    );

    if (!isExtensionValid && !file.type.includes("pdf")) {
      showToast("Please select a PDF document file (.pdf).", "error");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadResumeDocument(file);
      setFileUrl(result.url);
      setTitle(file.name);
      setFileSize(result.fileSize);
      setUploadProvider(result.provider);

      showToast(
        `Resume PDF stored successfully in Cloud Firestore!`,
        "success",
      );

      if (!isModalOpen) {
        setVersion(`v${((resumes.length || 0) + 1).toFixed(1)}`);
        setIsDefault(
          resumes.length === 0 || !resumes.some((r) => r.active || r.isDefault),
        );
        setIsModalOpen(true);
      }
    } catch (err: any) {
      console.error(err);
      showToast(
        err.message || "Upload failed. You can paste a manual document URL.",
        "error",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (quickFileInputRef.current) quickFileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFileUpload(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim()) {
      showToast("Document title and file are required.", "error");
      return;
    }

    setSaving(true);
    try {
      if (editingResumeId) {
        await updateResume(editingResumeId, {
          title: title.trim(),
          version: version.trim() || "v1.0",
          fileUrl: fileUrl.trim(),
          fileSize: fileSize.trim() || "PDF",
          active: isDefault,
          isDefault,
        });
        showToast("Resume version updated.", "success");
      } else {
        await createResume({
          title: title.trim(),
          version: version.trim() || "v1.0",
          fileUrl: fileUrl.trim(),
          fileSize: fileSize.trim() || "PDF",
          active: isDefault,
          isDefault,
          downloadCount: 0,
          uploadedAt: new Date().toISOString().split("T")[0],
        });
        showToast("New resume version saved to Cloud Firestore.", "success");
      }

      setIsModalOpen(false);
      resetForm();
      await loadResumes();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to save resume document.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultResume(id);
      showToast(
        "Active default resume updated for public downloads.",
        "success",
      );
      await loadResumes();
    } catch (err) {
      console.error(err);
      showToast("Failed to set default.", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await deleteResume(deleteConfirmId);
      showToast("Resume record removed.", "info");
      setDeleteConfirmId(null);
      await loadResumes();
    } catch (err) {
      console.error(err);
      showToast("Error deleting resume.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenPreview = (res: {
    title: string;
    fileUrl: string;
    version?: string;
  }) => {
    setPreviewModal({
      isOpen: true,
      title: res.title,
      fileUrl: res.fileUrl,
      version: res.version,
    });
  };

  return (
    <div id="admin-resumes-page" className="space-y-6">
      {/* Hidden Quick Upload Input */}
      <input
        type="file"
        ref={quickFileInputRef}
        accept=".pdf,.doc,.docx"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Resume & CV Documents
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {resumes.length} {resumes.length === 1 ? "document" : "documents"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Upload genuine PDF documents stored securely in Cloud Firestore with
            instant preview and download capabilities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => quickFileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-2 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>{uploading ? "Uploading PDF..." : "Quick Upload PDF"}</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Resume</span>
          </button>
        </div>
      </div>

      {/* Direct Cloud Firestore Storage Banner */}
      <div className="hidden p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100 dark:border-indigo-900/40">
            <Database className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Direct Database Document Storage</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                No Cloudinary • Pure PDF
              </span>
            </div>
            <div className="text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Resume PDFs are stored directly in your Cloud Firestore database
              as self-contained documents. When previewed or downloaded, they
              load immediately with zero external dependencies.
            </div>
          </div>
        </div>
      </div>

      {/* Resumes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center space-y-3">
            <Spinner size="lg" className="mx-auto text-indigo-600" />
            <div className="text-xs text-zinc-400">
              Loading stored resumes...
            </div>
          </div>
        ) : resumes.length === 0 ? (
          <div className="col-span-full py-16 text-center p-8 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-800 dark:text-zinc-200">
                No resumes stored yet
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Upload your latest PDF CV so recruiters and visitors can
                download your credentials.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload First Resume</span>
            </button>
          </div>
        ) : (
          resumes.map((res) => {
            const isAct = Boolean(res.isDefault || res.active);

            return (
              <div
                key={res.id}
                className={`p-6 rounded-3xl border bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between space-y-5 relative transition-all ${
                  isAct
                    ? "border-indigo-500 ring-2 ring-indigo-500/20"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                {/* Active default badge */}
                {isAct && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    <Star className="w-3 h-3 fill-current text-indigo-600 dark:text-indigo-400" />
                    <span>ACTIVE DEFAULT</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-900/50">
                      <FileText className="w-6 h-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3
                        className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate"
                        title={res.title}
                      >
                        {res.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded-md font-mono">
                          {res.version || "v1.0"}
                        </span>
                        <span className="text-xs text-zinc-400">•</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                          {res.fileSize || "PDF Document"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Document Metadata Badges */}
                  <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      <Download className="w-3 h-3 text-indigo-500" />
                      <span>{res.downloadCount || 0} downloads</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                      <Database className="w-3 h-3 text-emerald-500" />
                      <span>Cloud Firestore</span>
                    </span>

                    {res.uploadedAt && (
                      <span className="text-zinc-400 text-[10px]">
                        {res.uploadedAt.split("T")[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(res)}
                      className="px-2.5 py-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      title="Preview Document in App"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadDocument(res.fileUrl, res.title)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(res)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Edit Details"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(res.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete Resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {!isAct ? (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(res.id)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Set as Default
                    </button>
                  ) : (
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Live on site</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {editingResumeId
                    ? "Edit Resume Record"
                    : "Upload Resume Document"}
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  PDF documents are saved directly in Cloud Firestore. No
                  external buckets needed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Drag & Drop Upload Zone */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Select or Drop PDF File
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileInputChange}
                  disabled={uploading}
                  className="hidden"
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    dragOver
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                      : fileUrl
                        ? "border-emerald-400/80 bg-emerald-50/30 dark:bg-emerald-950/20"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 bg-zinc-50 dark:bg-zinc-800/50"
                  }`}
                >
                  {uploading ? (
                    <div className="py-2 flex flex-col items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <Spinner size="md" />
                      <span className="font-semibold text-xs">
                        Encoding and processing PDF document...
                      </span>
                    </div>
                  ) : fileUrl ? (
                    <div className="py-1 space-y-1.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center mx-auto">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs truncate max-w-xs">
                        {title || "PDF Document Ready"}
                      </div>
                      <div className="text-[11px] text-zinc-500 flex items-center justify-center gap-2">
                        <span>{fileSize || "PDF"}</span>
                        <span>•</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                          Click to select a different PDF
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 space-y-1">
                      <Upload className="w-6 h-6 text-zinc-400 mx-auto mb-1" />
                      <div className="text-zinc-700 dark:text-zinc-200 font-semibold text-xs">
                        Click to select PDF or drag and drop file here
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Supports standard PDF files up to 750 KB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Title */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Codewithbelia_Senior_Fullstack_Resume.pdf"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Version & Size Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Version Tag
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g. 2026.1 or v2.0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Size Indicator
                  </label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="e.g. 185 KB"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* File Status & Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Document Data / Status *
                  </label>
                  {fileUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenPreview({
                          title: title || "PDF Preview",
                          fileUrl,
                          version,
                        })
                      }
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview Selected PDF</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  readOnly={fileUrl.startsWith("data:")}
                  value={
                    fileUrl.startsWith("data:")
                      ? `[Direct Firestore PDF Document (${fileSize || "Ready"})]`
                      : fileUrl
                  }
                  onChange={(e) => {
                    if (!fileUrl.startsWith("data:")) {
                      setFileUrl(e.target.value);
                    }
                  }}
                  placeholder="Select a file above or paste a direct public PDF URL"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-mono"
                />
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>
                    Direct Firestore Storage: completely self-contained PDF,
                    zero external links needed.
                  </span>
                </div>
              </div>

              {/* Set as Active Default Checkbox */}
              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="resume-default-checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor="resume-default-checkbox"
                  className="font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer text-xs"
                >
                  Set as primary active resume for public downloads & Hero CTA
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || saving || !fileUrl.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50 inline-flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  {saving && <Spinner size="sm" />}
                  <span>
                    {saving
                      ? "Saving..."
                      : editingResumeId
                        ? "Save Changes"
                        : "Publish Resume"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App PDF Document Viewer Modal */}
      <PdfViewerModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
        title={previewModal.title}
        fileUrl={previewModal.fileUrl}
        version={previewModal.version}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Resume Record?"
        message="Are you sure you want to remove this resume document? If this was the active default resume, another will need to be designated for public downloads."
        confirmText="Delete Document"
        isDestructive={true}
        isLoading={deleting}
      />
    </div>
  );
};
