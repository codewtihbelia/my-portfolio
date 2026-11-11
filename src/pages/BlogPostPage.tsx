import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Share2, Tag, User, AlertCircle } from 'lucide-react';
import { BlogPost } from '../types';
import { getBlogPostBySlug, getBlogPosts } from '../services/blogService';
import { logAnalyticsEvent } from '../services/analyticsService';
import { useToast } from '../components/ui/Toast';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { showToast } = useToast();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    async function loadPost() {
      setLoading(true);
      try {
        const found = await getBlogPostBySlug(slug!);
        setPost(found);

        if (found) {
          logAnalyticsEvent({
            type: 'blog_view',
            targetId: found.id,
            path: `/blog/${slug}`
          });

          const all = await getBlogPosts(false);
          setRelatedPosts(all.filter((p) => p.slug !== slug).slice(0, 2));
        }
      } catch (err) {
        console.warn('Blog post fetch notice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Article link copied to clipboard!', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-zinc-500">Loading article from Cloud Firestore...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto" />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Article Not Found</h1>
        <p className="text-sm text-zinc-500">The requested article could not be found in Firestore.</p>
        <Link to="/blog" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <article id="blog-post-page" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all articles</span>
        </Link>
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>
      </div>

      {/* Article Header */}
      <header className="space-y-6">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="px-2.5 py-1 rounded-md font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
            {post.category}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {post.readingTime}
          </span>
          {post.publishedAt && (
            <>
              <span>•</span>
              <span>{post.publishedAt}</span>
            </>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-3 pt-2">
          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
            {post.author ? post.author.charAt(0) : 'A'}
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{post.author}</div>
            <div className="text-xs text-zinc-400">Software Engineer & Author</div>
          </div>
        </div>

        {post.coverImage && (
          <div className="rounded-3xl overflow-hidden aspect-video border border-zinc-200 dark:border-zinc-800 shadow-md">
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}
      </header>

      {/* Article Body Content */}
      <div className="prose prose-zinc dark:prose-invert max-w-none text-base leading-relaxed space-y-6 text-zinc-800 dark:text-zinc-200">
        {post.content.split('\n\n').map((paragraph, index) => {
          if (paragraph.startsWith('### ')) {
            return (
              <h3 key={index} className="text-xl font-bold text-zinc-900 dark:text-zinc-100 pt-4">
                {paragraph.replace('### ', '')}
              </h3>
            );
          }
          if (paragraph.startsWith('## ')) {
            return (
              <h2 key={index} className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 pt-6">
                {paragraph.replace('## ', '')}
              </h2>
            );
          }
          if (paragraph.startsWith('> ')) {
            return (
              <blockquote key={index} className="border-l-4 border-indigo-500 pl-4 italic text-zinc-600 dark:text-zinc-400">
                {paragraph.replace('> ', '')}
              </blockquote>
            );
          }
          return (
            <p key={index} className="leading-relaxed">
              {paragraph}
            </p>
          );
        })}
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Tags</div>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span
                key={t}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Related articles */}
      {relatedPosts.length > 0 && (
        <div className="pt-12 border-t border-zinc-200 dark:border-zinc-800 space-y-6">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">More Articles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedPosts.map((r) => (
              <Link
                key={r.id}
                to={`/blog/${r.slug}`}
                className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-500 transition-colors space-y-2"
              >
                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{r.category}</div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{r.title}</h4>
                <p className="text-xs text-zinc-500 line-clamp-2">{r.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};
