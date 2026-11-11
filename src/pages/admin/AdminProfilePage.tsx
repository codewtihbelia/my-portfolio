import React, { useState, useEffect, useRef } from "react";
import {
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Upload,
  Globe,
  Sparkles,
  X,
  Check,
} from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { updateProfile } from "../../services/profileService";
import {
  getSocialLinks,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
} from "../../services/socialService";
import { SocialLink } from "../../types";
import { MediaPickerModal } from "../../components/ui/MediaPickerModal";
import { useToast } from "../../components/ui/Toast";
import { Spinner } from "../../components/ui/Spinner";
import { BrandLogo } from "../../components/ui/BrandLogo";
import { uploadMediaFile } from "../../services/mediaService";
import { updateAppFavicon } from "../../utils/favicon";

export const AdminProfilePage: React.FC = () => {
  const { profile, reloadSettings } = useSettings();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    professionalTitle: "",
    shortIntroduction: "",
    biography: "",
    email: "",
    phone: "",
    location: "",
    availability: "",
    yearsOfExperience: "",
    profileImage: "",
    resumeUrl: "",
  });

  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [saving, setSaving] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New social link input
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        professionalTitle: profile.professionalTitle || "",
        shortIntroduction: profile.shortIntroduction || "",
        biography: profile.biography || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
        availability: profile.availability || "",
        yearsOfExperience: profile.yearsOfExperience || "",
        profileImage: profile.profileImage || "",
        resumeUrl: profile.resumeUrl || "",
      });
    }
    loadSocials();
  }, [profile]);

  const loadSocials = async () => {
    try {
      const items = await getSocialLinks(false);
      setSocials(items);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDirectAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast(
        "Please select a valid image file (PNG, JPG, WebP, etc.).",
        "error",
      );
      return;
    }

    setUploadingAvatar(true);
    try {
      const newMedia = await uploadMediaFile(
        file,
        "avatars",
        `${formData.name || "User"} Profile Portrait`,
      );
      setFormData((prev) => ({ ...prev, profileImage: newMedia.url }));
      updateAppFavicon(newMedia.url);
      showToast(
        "Photo uploaded! Set as active site logo and browser tab favicon.",
        "success",
      );
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to upload image.", "error");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, profileImage: "" }));
    updateAppFavicon(null);
    showToast(
      "Profile image removed. Reverted to default initial logo and SVG favicon.",
      "info",
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(formData);
      await reloadSettings();
      if (formData.profileImage) {
        updateAppFavicon(formData.profileImage);
      }
      showToast(
        "Profile saved! Site logo and browser tab icon updated successfully.",
        "success",
      );
    } catch (err) {
      console.error(err);
      showToast("Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSocial = async () => {
    if (!newPlatform.trim() || !newUrl.trim()) {
      showToast("Please specify platform and URL.", "error");
      return;
    }
    try {
      await createSocialLink({
        platform: newPlatform.trim(),
        url: newUrl.trim(),
        displayOrder: socials.length + 1,
        isVisible: true,
      });
      setNewPlatform("");
      setNewUrl("");
      await loadSocials();
      showToast("Social link added.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to add social link.", "error");
    }
  };

  const handleDeleteSocial = async (id: string) => {
    try {
      await deleteSocialLink(id);
      await loadSocials();
      showToast("Social link deleted.", "info");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete social link.", "error");
    }
  };

  return (
    <div id="admin-profile-page" className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Profile & Identity Management
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Customize your public biography, job title, availability status, and
          social profiles.
        </p>
      </div>

      <form
        onSubmit={handleSaveProfile}
        className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6"
      >
        {/* Profile Avatar, Site Brand Logo & Browser Tab Icon Section */}
        <div className="p-5 sm:p-6 rounded-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Brand Identity & Browser Icon
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                Profile Photo, Logo & Favicon
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl leading-relaxed">
                The image you upload here automatically becomes your portfolio
                portrait, the brand logo displayed in the header and footer, and
                the dynamic favicon icon in the browser tab.
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 pt-2">
            {/* Current Avatar Card */}
            <div className="relative group w-28 h-28 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 shadow-sm shrink-0">
              {formData.profileImage ? (
                <img
                  src={formData.profileImage}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-3xl text-zinc-400 dark:text-zinc-500">
                  {formData.name ? formData.name.charAt(0) : "A"}
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs gap-1.5">
                  <Spinner size="sm" />
                  <span className="text-[10px] font-medium">Uploading...</span>
                </div>
              )}
            </div>

            {/* Actions & File Upload */}
            <div className="space-y-3 flex-1 w-full">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleDirectAvatarUpload}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {uploadingAvatar
                      ? "Uploading Photo..."
                      : "Upload New Photo"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaPickerOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 inline-flex items-center gap-2 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Choose from Library</span>
                </button>

                {formData.profileImage && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-medium text-rose-700 dark:text-rose-300 transition-colors inline-flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              {/* Live Preview Strip */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Site Logo Preview */}
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-3">
                  <BrandLogo
                    image={formData.profileImage}
                    name={formData.name || "Portfolio"}
                    sizeClass="w-8 h-8 rounded-lg"
                    textSizeClass="text-xs"
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {formData.name || "Codewithbelia"}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Header & Footer Logo
                    </div>
                  </div>
                </div>

                {/* Browser Tab Icon Preview */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-indigo-500/60 shadow-xs shrink-0 flex items-center justify-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
                    {formData.profileImage ? (
                      <img
                        src={formData.profileImage}
                        alt="Favicon"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-[9px] font-mono font-bold">
                        {formData.name ? formData.name.charAt(0) : "A"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      Codewithbelia Developer Portfolio 3
                    </div>
                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Active Browser Tab Favicon</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Professional Title *
            </label>
            <input
              type="text"
              name="professionalTitle"
              required
              value={formData.professionalTitle}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
            Short Introduction (Hero display)
          </label>
          <input
            type="text"
            name="shortIntroduction"
            value={formData.shortIntroduction}
            onChange={handleProfileChange}
            className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
            Full Biography
          </label>
          <textarea
            name="biography"
            rows={4}
            value={formData.biography}
            onChange={handleProfileChange}
            className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Availability
            </label>
            <input
              type="text"
              name="availability"
              value={formData.availability}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Years of Experience
            </label>
            <input
              type="text"
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleProfileChange}
              placeholder="e.g. 4+"
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Phone Number
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
            <span>
              {saving ? "Saving to Firestore..." : "Save Profile Changes"}
            </span>
          </button>
        </div>
      </form>

      {/* Social Links Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Social & External Links
          </h2>
          <p className="text-xs text-zinc-500">
            Display links on your navbar, footer, and contact section.
          </p>
        </div>

        <div className="space-y-3">
          {socials.map((s) => (
            <div
              key={s.id}
              className="p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex items-center justify-between gap-4"
            >
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {s.platform}
                </span>
                <span className="text-xs text-zinc-400 block truncate max-w-md">
                  {s.url}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteSocial(s.id)}
                className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add new social link */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <input
            type="text"
            placeholder="Platform (e.g. GitHub, LinkedIn)"
            value={newPlatform}
            onChange={(e) => setNewPlatform(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 sm:w-48"
          />
          <input
            type="url"
            placeholder="https://..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={handleAddSocial}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Link</span>
          </button>
        </div>
      </div>

      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => {
          setFormData((prev) => ({ ...prev, profileImage: url }));
          updateAppFavicon(url);
          showToast(
            "Image selected for brand logo and browser tab favicon.",
            "info",
          );
        }}
        title="Select Profile Avatar & Brand Logo"
        category="avatars"
      />
    </div>
  );
};
