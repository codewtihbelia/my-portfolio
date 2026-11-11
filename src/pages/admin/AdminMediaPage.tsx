import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Image as ImageIcon,
  Upload,
  Copy,
  Trash2,
  Check,
  ExternalLink,
  Search,
  Filter,
  Layers,
  Cloud,
  AlertCircle,
  Settings as SettingsIcon,
} from "lucide-react";
import { MediaAsset } from "../../types";
import {
  getMediaAssets,
  uploadMediaAsset,
  deleteMediaAsset,
} from "../../services/mediaService";
import {
  getCloudinaryConfig,
  isCloudinaryUrl,
} from "../../services/cloudinaryService";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { Select } from "../../components/ui/Select";
import { Spinner } from "../../components/ui/Spinner";

export const AdminMediaPage: React.FC = () => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState("projects");

  const { showToast } = useToast();
  const cloudinaryConfig = getCloudinaryConfig();

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await getMediaAssets();
      setAssets(data);
    } catch (err) {
      console.error(err);
      showToast("Error loading media assets.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadMediaAsset(file, uploadCategory);
      showToast("Image uploaded successfully through Cloudinary!", "success");
      await loadAssets();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Upload failed.", "error");
    } finally {
      setUploading(false);
      // Reset input value
      e.target.value = "";
    }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast("Image URL copied to clipboard!", "info");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const targetItem = assets.find((a) => a.id === deleteConfirmId);
      await deleteMediaAsset(
        deleteConfirmId,
        targetItem?.storagePath,
        targetItem?.provider,
      );
      showToast("Media asset removed.", "info");
      setDeleteConfirmId(null);
      await loadAssets();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete asset.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = assets.filter((item) => {
    const matchCat = category === "all" || item.category === category;
    const name = (item.fileName || item.filename || "").toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div id="admin-media-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Media & Storage Assets
            </h1>
            {cloudinaryConfig.isConfigured ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Cloud className="w-3 h-3 text-indigo-500" />
                <span>Cloudinary CDN</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span>Setup Cloudinary</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            All portfolio images, screenshots, and visual media are hosted and
            delivered through Cloudinary CDN.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-48">
            <Select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              sizeVariant="sm"
              options={[
                { value: "projects", label: "Category: Projects" },
                { value: "blog", label: "Category: Blog" },
                { value: "avatars", label: "Category: Avatars" },
                { value: "general", label: "Category: General" },
              ]}
            />
          </div>

          <label className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm cursor-pointer transition-colors shrink-0">
            {uploading ? <Spinner size="xs" /> : <Upload className="w-4 h-4" />}
            <span>
              {uploading ? "Uploading to Cloudinary..." : "Upload Image"}
            </span>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Cloudinary Setup Alert if not configured */}
      {!cloudinaryConfig.isConfigured && (
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <Cloud className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold">
                Cloudinary Configuration Required:{" "}
              </span>
              Uploaded images are handled through Cloudinary. Enter your Cloud
              Name and Unsigned Upload Preset in Settings to begin uploading.
            </div>
          </div>
          <Link
            to="/administrator/settings"
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Configure Cloudinary</span>
          </Link>
        </div>
      )}

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          {["all", "projects", "blog", "avatars", "general"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                category === cat
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-zinc-400">
            Loading media library...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-zinc-400">
            No media assets found.
          </div>
        ) : (
          filtered.map((item) => {
            const assetUrl = item.url || item.downloadUrl || "";
            const assetName = item.fileName || item.filename || "asset";
            const isCloud =
              item.provider === "cloudinary" || isCloudinaryUrl(assetUrl);

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm flex flex-col justify-between group"
              >
                <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <img
                    src={assetUrl}
                    alt={assetName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isCloud && (
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[9px] font-medium text-white flex items-center gap-1 shadow-sm">
                      <Cloud className="w-2.5 h-2.5 text-indigo-400" />
                      <span>Cloudinary</span>
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  <div
                    className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate"
                    title={assetName}
                  >
                    {assetName}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                    <span>{item.category || "general"}</span>
                    <span>
                      {item.size ? `${Math.round(item.size / 1024)} KB` : ""}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <button
                      onClick={() => handleCopy(assetUrl, item.id)}
                      className="text-[11px] text-zinc-500 hover:text-indigo-600 flex items-center gap-1"
                      title="Copy URL"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedId === item.id ? "Copied" : "Copy"}</span>
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Media Asset?"
        message="Are you sure you want to remove this asset reference from the portfolio?"
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleting}
      />
    </div>
  );
};
