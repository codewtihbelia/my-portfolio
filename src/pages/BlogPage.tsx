import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Clock, Calendar, ArrowRight, Tag } from "lucide-react";
import { BlogPost, BlogCategory } from "../types";
import { getBlogPosts, getBlogCategories } from "../services/blogService";
import { logAnalyticsEvent } from "../services/analyticsService";
import { Select } from "../components/ui/Select";

export const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logAnalyticsEvent({ type: "page_view", path: "/blog" });
    async function loadData() {
      try {
        const [p, c] = await Promise.all([
          getBlogPosts(false),
          getBlogCategories(),
        ]);
        setPosts(p);
        setCategories(c);
      } catch (err) {
        console.warn("Blog data notice:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categoryNames = useMemo(() => {
    const set = new Set<string>(["All"]);
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    categories.forEach((c) => {
      if (c.name) set.add(c.name);
    });
    return Array.from(set);
  }, [posts, categories]);

  const filteredPosts = useMemo(() => {
    const list = posts.filter((p) => {
      const matchesCat = selectedCat === "All" || p.category === selectedCat;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });

    return list.sort((a, b) => {
      if (sortBy === "newest") {
        return (b.date || "").localeCompare(a.date || "");
      }
      if (sortBy === "oldest") {
        return (a.date || "").localeCompare(b.date || "");
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [posts, selectedCat, searchQuery, sortBy]);

  return (
    <div
      id="blog-page"
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12"
    >
      <div className="max-w-2xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Writings & Architecture Notes
        </span>
        <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Articles & Insights
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Technical reflections on full-stack architecture, zero-trust cloud
          security, system performance, and software craftsmanship.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 lg:pb-0 flex-1">
          {categoryNames.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                selectedCat === cat
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                  : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="relative min-w-55">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-9"
            />
          </div>

          <div className="w-full sm:w-44 shrink-0">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sizeVariant="sm"
              options={[
                { value: "newest", label: "Latest First" },
                { value: "oldest", label: "Oldest First" },
                { value: "title", label: "Title (A-Z)" },
              ]}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-zinc-500 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading articles from Cloud Firestore...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl text-zinc-500">
          No articles found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              data-cursor-label="Read"
              className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readingTime}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-mono">
                  {post.publishedAt || "Recent"}
                </span>
                <Link
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:gap-2 transition-all"
                >
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
