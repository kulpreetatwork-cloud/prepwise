import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineChatAlt2,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineFire,
  HiOutlineTrendingUp,
} from 'react-icons/hi';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'interview-experience', label: 'Experiences' },
  { id: 'tips-tricks', label: 'Tips & Tricks' },
  { id: 'technical-questions', label: 'Technical' },
  { id: 'company-specific', label: 'Company' },
  { id: 'general-discussion', label: 'General' },
];

const SORT_OPTIONS = [
  { id: 'recent', label: 'Recent', icon: HiOutlineClock },
  { id: 'most-voted', label: 'Most Voted', icon: HiOutlineTrendingUp },
  { id: 'popular', label: 'Popular', icon: HiOutlineFire },
];

const CATEGORY_COLORS = {
  'interview-experience': { bg: 'rgba(139,92,246,0.12)', text: '#A78BFA', border: 'rgba(139,92,246,0.25)' },
  'tips-tricks': { bg: 'rgba(16,185,129,0.12)', text: '#6EE7B7', border: 'rgba(16,185,129,0.25)' },
  'technical-questions': { bg: 'rgba(59,130,246,0.12)', text: '#93C5FD', border: 'rgba(59,130,246,0.25)' },
  'company-specific': { bg: 'rgba(245,158,11,0.12)', text: '#FCD34D', border: 'rgba(245,158,11,0.25)' },
  'general-discussion': { bg: 'rgba(148,163,184,0.12)', text: '#CBD5E1', border: 'rgba(148,163,184,0.25)' },
};

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label || id;
}

export default function Community() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('recent');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general-discussion', tags: '' });

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, sort };
      if (category) params.category = category;
      if (search) params.search = search;
      const { data } = await api.get('/community/posts', { params });
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [page, category, sort, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleVote = async (postId, type) => {
    try {
      const { data } = await api.post(`/community/posts/${postId}/vote`, { type });
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, upvotes: data.upvotes, downvotes: data.downvotes, voteScore: data.voteScore }
            : p
        )
      );
    } catch {
      toast.error('Failed to vote');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      return toast.error('Title and content are required');
    }
    setCreating(true);
    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await api.post('/community/posts', { ...form, tags });
      toast.success('Post created!');
      setShowCreate(false);
      setForm({ title: '', content: '', category: 'general-discussion', tags: '' });
      setPage(1);
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Community</h1>
          <p className="text-text-secondary text-sm mt-1">Share experiences, ask questions, and learn from peers</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all shrink-0"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', boxShadow: '0 4px 12px rgba(139,92,246,0.25)' }}
        >
          <HiOutlinePlus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Category tabs */}
        <div className="flex overflow-x-auto gap-2 pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setCategory(cat.id); setPage(1); }}
              className={`shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                category === cat.id
                  ? 'text-white'
                  : 'text-text-secondary hover:text-white hover:bg-dark-tertiary/60'
              }`}
              style={
                category === cat.id
                  ? {
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))',
                      border: '1px solid rgba(139,92,246,0.25)',
                    }
                  : { border: '1px solid transparent' }
              }
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-dark-secondary border border-dark-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:border-accent-purple focus:outline-none transition-colors"
            />
          </form>
          <div className="flex gap-1 p-1 rounded-xl bg-dark-secondary border border-dark-border">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => { setSort(opt.id); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  sort === opt.id
                    ? 'bg-accent-purple/15 text-white'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <opt.icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-dark-secondary rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-white/[0.06] theme-card">
          <p className="text-text-muted text-lg mb-2">No posts found</p>
          <p className="text-text-muted text-sm">Be the first to start a discussion!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const uid = user?._id;
            const hasUpvoted = post.upvotes?.some((id) => (typeof id === 'string' ? id : id?._id || id) === uid);
            const hasDownvoted = post.downvotes?.some((id) => (typeof id === 'string' ? id : id?._id || id) === uid);
            const catColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS['general-discussion'];

            return (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/[0.06] p-3 sm:p-5 transition-all hover:border-purple-500/15 group theme-card"
              >
                    <div className="flex gap-3 sm:gap-4">
                  {/* Vote column */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleVote(post._id, 'up')}
                      className={`p-1 rounded-lg transition-colors ${
                        hasUpvoted ? 'text-accent-purple bg-accent-purple/10' : 'text-text-muted hover:text-accent-purple'
                      }`}
                    >
                      <HiOutlineChevronUp className="w-5 h-5" />
                    </button>
                    <span className={`text-sm font-bold ${post.voteScore > 0 ? 'text-accent-purple' : post.voteScore < 0 ? 'text-accent-red' : 'text-text-muted'}`}>
                      {post.voteScore || 0}
                    </span>
                    <button
                      onClick={() => handleVote(post._id, 'down')}
                      className={`p-1 rounded-lg transition-colors ${
                        hasDownvoted ? 'text-accent-red bg-accent-red/10' : 'text-text-muted hover:text-accent-red'
                      }`}
                    >
                      <HiOutlineChevronDown className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg"
                        style={{ background: catColor.bg, color: catColor.text, border: `1px solid ${catColor.border}` }}
                      >
                        {categoryLabel(post.category)}
                      </span>
                      {post.tags?.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] text-text-muted bg-dark-tertiary/50 px-2 py-0.5 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <Link to={`/community/${post._id}`} className="block group/title">
                      <h3 className="text-base font-semibold text-white group-hover/title:text-accent-purple transition-colors line-clamp-1">
                        {post.title}
                      </h3>
                      <p className="text-sm text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                        {post.content}
                      </p>
                    </Link>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 text-xs text-text-muted">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-semibold"
                          style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}
                        >
                          {post.userId?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span>{post.userId?.name || 'Anonymous'}</span>
                        {post.userId?.targetRole && (
                          <span className="text-text-muted/60">· {post.userId.targetRole}</span>
                        )}
                      </div>
                      <span>{timeAgo(post.createdAt)}</span>
                      <div className="flex items-center gap-1">
                        <HiOutlineChatAlt2 className="w-3.5 h-3.5" />
                        {post.commentsCount || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <HiOutlineEye className="w-3.5 h-3.5" />
                        {post.views || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                page === i + 1
                  ? 'text-white bg-accent-purple/20 border border-accent-purple/30'
                  : 'text-text-muted hover:text-white hover:bg-dark-tertiary'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowCreate(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50 rounded-2xl p-5 sm:p-6 border border-dark-border max-h-[85vh] overflow-y-auto modal-bg"
              style={{ background: 'linear-gradient(135deg, rgba(19,19,43,0.95) 0%, rgba(17,17,24,0.98) 100%)', backdropFilter: 'blur(24px)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">Create Post</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-dark-tertiary transition-colors">
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <input
                  type="text"
                  placeholder="Post title..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={200}
                  className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:border-accent-purple focus:outline-none"
                />

                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-xl text-sm text-text-primary focus:border-accent-purple focus:outline-none"
                >
                  {CATEGORIES.filter((c) => c.id).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>

                <textarea
                  placeholder="Share your thoughts..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  maxLength={5000}
                  rows={6}
                  className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:border-accent-purple focus:outline-none resize-none"
                />

                <input
                  type="text"
                  placeholder="Tags (comma-separated, max 5)"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:border-accent-purple focus:outline-none"
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">{form.content.length}/5000</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-white rounded-xl hover:bg-dark-tertiary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating || !form.title.trim() || !form.content.trim()}
                      className="px-5 py-2.5 text-sm font-medium text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}
                    >
                      {creating ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
