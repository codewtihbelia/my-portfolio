import React, { useState, useEffect } from "react";
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Cloud,
  AlertCircle,
} from "lucide-react";
import { Media } from "../../types";
import { getMediaItems, uploadMediaFile } from "../../services/mediaService";
import {
  getCloudinaryConfig,
  isCloudinaryUrl,
} from "../../services/cloudinaryService";
import { useToast } from "./Toast";
import { Spinner } from "./Spinner";

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
  category?: string;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = "Select Media Asset",
  category = "general",
}) => {
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string>("");
  const [customUrl, setCustomUrl] = useState<string>("");
  const { showToast } = useToast();

  const cloudinaryConfig = getCloudinaryConfig();

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const items = await getMediaItems();
      setMediaList(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.", "error");
      return;
    }

    setUploading(true);
    try {
      const newMedia = await uploadMediaFile(file, category);
      setMediaList((prev) => [newMedia, ...prev]);
      setSelectedUrl(newMedia.url);
      showToast("Image uploaded to Cloudinary CDN!", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to upload image.", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleConfirm = () => {
    const finalUrl = selectedUrl || customUrl.trim();
    if (!finalUrl) {
      showToast("Please select or enter an image URL.", "error");
      return;
    }
    onSelect(finalUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="media-picker-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="media-picker-modal"
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {title}
            </h3>
            {/* {cloudinaryConfig.isConfigured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Cloud className="w-2.5 h-2.5" />
                <span>Cloudinary CDN</span>
              </span>
            )} */}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Cloudinary Notice if not configured */}
          {!cloudinaryConfig.isConfigured && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-semibold">
                  Cloudinary Setup Required:{" "}
                </span>
                Image uploads are handled through Cloudinary. Please set your
                Cloud Name and Upload Preset in Admin Settings to enable direct
                image uploads.
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40">
            <div>
              <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <span>Upload new image</span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-normal">
                  via Cloudinary
                </span>
              </div>
              <div className="text-xs text-zinc-500">
                Supports JPG, PNG, WEBP, SVG, GIF
              </div>
            </div>
            <label
              className={`cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors ${uploading ? "opacity-70 pointer-events-none" : ""}`}
            >
              {uploading ? (
                <Spinner size="xs" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>
                {uploading
                  ? "Uploading to Cloudinary..."
                  : "Upload to Cloudinary"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>

          {/* Direct URL input fallback */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Or paste direct image URL
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={customUrl}
              onChange={(e) => {
                setCustomUrl(e.target.value);
                setSelectedUrl("");
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Media Library Grid */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Existing Library Assets ({mediaList.length})
            </div>
            {loading ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                Loading library assets...
              </div>
            ) : mediaList.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                No media assets in library yet. Upload one above!
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
                {mediaList.map((item) => {
                  const mediaUrl = item.url || item.downloadUrl || "";
                  const isSelected = selectedUrl === mediaUrl;
                  const isCloud =
                    item.provider === "cloudinary" || isCloudinaryUrl(mediaUrl);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedUrl(mediaUrl);
                        setCustomUrl("");
                      }}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        isSelected
                          ? "border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/20"
                          : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <img
                        src={mediaUrl}
                        alt={item.altText || item.filename || item.fileName}
                        className="w-full h-full object-cover"
                      />
                      {isCloud && (
                        <div
                          className="absolute top-1 right-1 p-0.5 rounded bg-black/60 text-indigo-300"
                          title="Cloudinary CDN"
                        >
                          <Cloud className="w-3 h-3" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white drop-shadow" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Use Selected Image
          </button>
        </div>
      </div>
    </div>
  );
};
