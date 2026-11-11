import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  Star,
  Eye,
  Image as ImageIcon,
} from "lucide-react";
import { BlogPost } from "../../types";
import {
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "../../services/blogService";
import { MediaPickerModal } from "../../components/ui/MediaPickerModal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { Select } from "../../components/ui/Select";
import { Spinner } from "../../components/ui/Spinner";

export const AdminBlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchParams] = useSearchParams();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const { showToast } = useToast();

  const emptyPost: Omit<BlogPost, "id"> = {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "Architecture",
    tags: ["WebDev", "Cloud"],
    readingTime: "4 min read",
    coverImage: "",
    status: "Published",
    published: true,
    isPublished: true,
    views: 0,
    publishedAt: new Date().toISOString().split("T")[0],
    author: "Codewithbelia",
    featured: false,
  };

  const [formData, setFormData] = useState<Omit<BlogPost, "id">>(emptyPost);
  const [tagsText, setTagsText] = useState("");

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await getBlogPosts(true);
      setPosts(data);
    } catch (err) {
      console.error(err);
      showToast("Error loading blog posts.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
    if (searchParams.get("create") === "true") {
      handleOpenCreate();
    }
  }, []);

  const generateSlug = (val: string) => {
    return val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(emptyPost);
    setTagsText(emptyPost.tags.join(", "));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (post: BlogPost) => {
    setEditingId(post.id);
    const isPub =
      (post.status === "Published" ||
        post.published === true ||
        post.isPublished === true) &&
      post.status !== "Draft";
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      tags: post.tags || [],
      readingTime: post.readingTime || "4 min read",
      coverImage: post.coverImage || "",
      status: isPub ? "Published" : "Draft",
      published: isPub,
      isPublished: isPub,
      views: post.views || 0,
      publishedAt: post.publishedAt || "",
      author: post.author || "Codewithbelia",
      featured: post.featured || false,
    });
    setTagsText((post.tags || []).join(", "));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const isPub = Boolean(
      formData.published ??
      formData.isPublished ??
      formData.status === "Published",
    );
    const payload = {
      ...formData,
      status: (isPub ? "Published" : "Draft") as "Published" | "Draft",
      published: isPub,
      isPublished: isPub,
      slug: formData.slug.trim() || generateSlug(formData.title),
      tags,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateBlogPost(editingId, payload);
        showToast("Article updated.", "success");
      } else {
        await createBlogPost(payload);
        showToast("Article published.", "success");
      }
      setIsModalOpen(false);
      await loadPosts();
    } catch (err) {
      console.error(err);
      showToast("Failed to save article.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await deleteBlogPost(deleteConfirmId);
      showToast("Article deleted.", "info");
      setDeleteConfirmId(null);
      await loadPosts();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete article.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = posts.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const isPub =
      (p.status === "Published" ||
        p.published === true ||
        p.isPublished === true) &&
      p.status !== "Draft";
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && isPub) ||
      (statusFilter === "draft" && !isPub);
    return matchesQuery && matchesStatus;
  });

  return (
    <div id="admin-blog-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Articles & Blog Posts
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Write technical articles, architecture teardowns, and engineering
            guides.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Write Article</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search articles by title or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="w-full sm:w-44 shrink-0">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sizeVariant="sm"
              options={[
                { value: "all", label: "All Statuses" },
                {
                  value: "published",
                  label: "Published Only",
                  dotColor: "bg-emerald-500",
                },
                {
                  value: "draft",
                  label: "Drafts Only",
                  dotColor: "bg-zinc-400",
                },
              ]}
            />
          </div>
        </div>

        <div className="text-xs text-zinc-500 font-mono self-end sm:self-center">
          Total: {posts.length} | Shown: {filtered.length}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">Article Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-400">
                    Loading articles...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-400">
                    No articles found.
                  </td>
                </tr>
              ) : (
                filtered.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        {post.title}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        /blog/{post.slug}
                      </div>
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-400">
                      {post.category}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          (post.published ?? post.isPublished)
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {(post.published ?? post.isPublished)
                          ? "Published"
                          : "Draft"}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-zinc-500">
                      {post.publishedAt || "—"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(post)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-600 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(post.id)}
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
      </div>

      {/* Article Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-xs">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {editingId ? "Edit Article" : "Write New Article"}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      const t = e.target.value;
                      setFormData((p) => ({
                        ...p,
                        title: t,
                        slug: !editingId ? generateSlug(t) : p.slug,
                      }));
                    }}
                    placeholder="Article title"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, slug: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Excerpt *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, excerpt: e.target.value }))
                  }
                  placeholder="Summary for list views"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
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
                      { value: "Architecture", label: "Architecture" },
                      { value: "Cloud & Firebase", label: "Cloud & Firebase" },
                      { value: "Engineering", label: "Engineering" },
                      {
                        value: "TypeScript & React",
                        label: "TypeScript & React",
                      },
                      { value: "Full-Stack Dev", label: "Full-Stack Dev" },
                      { value: "Security & Auth", label: "Security & Auth" },
                      { value: "Performance", label: "Performance" },
                      { value: "Tutorials", label: "Tutorials" },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Reading Time
                  </label>
                  <input
                    type="text"
                    value={formData.readingTime}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        readingTime: e.target.value,
                      }))
                    }
                    placeholder="5 min read"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 min-h-8"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Published Date
                  </label>
                  <input
                    type="text"
                    value={formData.publishedAt}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        publishedAt: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 font-mono min-h-8"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Cover Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.coverImage}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, coverImage: e.target.value }))
                    }
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => setMediaPickerOpen(true)}
                    className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 font-semibold"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Article Body Content (Markdown supported) *
                </label>
                <textarea
                  rows={8}
                  required
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, content: e.target.value }))
                  }
                  placeholder="## Section Heading&#10;&#10;Detailed technical narrative..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="Firestore, SecurityRules, React"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      formData.published ??
                      formData.isPublished ??
                      formData.status === "Published"
                    }
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        status: e.target.checked ? "Published" : "Draft",
                        published: e.target.checked,
                        isPublished: e.target.checked,
                      }))
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Published live
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, featured: e.target.checked }))
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Featured Article
                  </span>
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
                  <span>{saving ? "Saving Article..." : "Save Article"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mediaPickerOpen && (
        <MediaPickerModal
          isOpen={true}
          onClose={() => setMediaPickerOpen(false)}
          onSelect={(url) => {
            setFormData((p) => ({ ...p, coverImage: url }));
            setMediaPickerOpen(false);
          }}
          title="Select Article Cover Image"
          category="blog"
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Article?"
        message="Are you sure you want to remove this article from Firestore?"
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleting}
      />
    </div>
  );
};
