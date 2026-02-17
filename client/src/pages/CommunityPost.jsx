import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineArrowLeft,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineChatAlt2,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineReply,
} from 'react-icons/hi';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  'interview-experience': { bg: 'rgba(139,92,246,0.12)', text: '#A78BFA', border: 'rgba(139,92,246,0.25)' },
  'tips-tricks': { bg: 'rgba(16,185,129,0.12)', text: '#6EE7B7', border: 'rgba(16,185,129,0.25)' },
  'technical-questions': { bg: 'rgba(59,130,246,0.12)', text: '#93C5FD', border: 'rgba(59,130,246,0.25)' },
  'company-specific': { bg: 'rgba(245,158,11,0.12)', text: '#FCD34D', border: 'rgba(245,158,11,0.25)' },
  'general-discussion': { bg: 'rgba(148,163,184,0.12)', text: '#CBD5E1', border: 'rgba(148,163,184,0.25)' },
};

const CATEGORY_LABELS = {
  'interview-experience': 'Experience',
  'tips-tricks': 'Tips & Tricks',
  'technical-questions': 'Technical',
  'company-specific': 'Company',
  'general-discussion': 'General',
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
  return `${Math.floor(days / 30)}mo ago`;
}

export default function CommunityPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postRes, commentsRes] = await Promise.all([
          api.get(`/community/posts/${id}`),
          api.get(`/community/posts/${id}/comments`),
        ]);
        setPost(postRes.data.post);
        setComments(commentsRes.data.comments);
      } catch {
        toast.error('Post not found');
        navigate('/community');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleVotePost = async (type) => {
    try {
      const { data } = await api.post(`/community/posts/${id}/vote`, { type });
      setPost((p) => ({ ...p, upvotes: data.upvotes, downvotes: data.downvotes, voteScore: data.voteScore }));
    } catch {
      toast.error('Failed to vote');
    }
  };

  const handleVoteComment = async (commentId, type) => {
    try {
      const { data } = await api.post(`/community/comments/${commentId}/vote`, { type });
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? { ...c, upvotes: data.upvotes, downvotes: data.downvotes, voteScore: data.voteScore }
            : c
        )
      );
    } catch {
      toast.error('Failed to vote');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/community/posts/${id}/comments`, {
        content: commentText,
        parentComment: replyTo,
      });
      setComments((prev) => [...prev, data.comment]);
      setPost((p) => ({ ...p, commentsCount: (p.commentsCount || 0) + 1 }));
      setCommentText('');
      setReplyTo(null);
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      await api.delete(`/community/posts/${id}`);
      toast.success('Post deleted');
      navigate('/community');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await api.delete(`/community/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setPost((p) => ({ ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) }));
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleEditPost = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put(`/community/posts/${id}`, editForm);
      setPost(data.post);
      setEditing(false);
      toast.success('Post updated');
    } catch {
      toast.error('Failed to update post');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="h-8 w-32 bg-dark-secondary rounded-xl animate-pulse" />
        <div className="h-64 bg-dark-secondary rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!post) return null;

  const catColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS['general-discussion'];
  const isAuthor = user?._id === post.userId?._id;
  const uid = user?._id;
  const hasUpvotedPost = post.upvotes?.some((i) => (typeof i === 'string' ? i : i?._id || i) === uid);
  const hasDownvotedPost = post.downvotes?.some((i) => (typeof i === 'string' ? i : i?._id || i) === uid);

  const topLevel = comments.filter((c) => !c.parentComment);
  const replies = (parentId) => comments.filter((c) => c.parentComment === parentId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link to="/community" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors">
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to Community
      </Link>

      {/* Post */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/[0.06] p-4 sm:p-6 theme-card"
      >
        <div className="flex gap-3 sm:gap-4">
          {/* Vote */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <button
              onClick={() => handleVotePost('up')}
              className={`p-1.5 rounded-lg transition-colors ${hasUpvotedPost ? 'text-accent-purple bg-accent-purple/10' : 'text-text-muted hover:text-accent-purple'}`}
            >
              <HiOutlineChevronUp className="w-6 h-6" />
            </button>
            <span className={`text-lg font-bold ${post.voteScore > 0 ? 'text-accent-purple' : post.voteScore < 0 ? 'text-accent-red' : 'text-text-muted'}`}>
              {post.voteScore || 0}
            </span>
            <button
              onClick={() => handleVotePost('down')}
              className={`p-1.5 rounded-lg transition-colors ${hasDownvotedPost ? 'text-accent-red bg-accent-red/10' : 'text-text-muted hover:text-accent-red'}`}
            >
              <HiOutlineChevronDown className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg"
                style={{ background: catColor.bg, color: catColor.text, border: `1px solid ${catColor.border}` }}
              >
                {CATEGORY_LABELS[post.category] || post.category}
              </span>
              {post.tags?.map((tag) => (
                <span key={tag} className="text-[10px] text-text-muted bg-dark-tertiary/50 px-2 py-0.5 rounded-md">#{tag}</span>
              ))}
            </div>

            {editing ? (
              <form onSubmit={handleEditPost} className="space-y-3">
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-secondary border border-dark-border rounded-xl text-sm text-text-primary focus:border-accent-purple focus:outline-none"
                />
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 bg-dark-secondary border border-dark-border rounded-xl text-sm text-text-primary focus:border-accent-purple focus:outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white rounded-xl" style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}>
                    Save
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-white rounded-xl hover:bg-dark-tertiary transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h1 className="text-xl font-bold text-white mb-3">{post.title}</h1>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </>
            )}

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 pt-4 border-t border-white/[0.04] text-xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-semibold" style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>
                  {post.userId?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="font-medium text-text-secondary">{post.userId?.name || 'Anonymous'}</span>
                {post.userId?.targetRole && <span className="text-text-muted/60">· {post.userId.targetRole}</span>}
              </div>
              <span>{timeAgo(post.createdAt)}</span>
              <div className="flex items-center gap-1"><HiOutlineEye className="w-3.5 h-3.5" />{post.views}</div>
              <div className="flex items-center gap-1"><HiOutlineChatAlt2 className="w-3.5 h-3.5" />{post.commentsCount}</div>

              {isAuthor && !editing && (
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => { setEditing(true); setEditForm({ title: post.title, content: post.content }); }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-colors"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                  </button>
                  <button onClick={handleDeletePost} className="p-1.5 rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Comment form */}
      <div className="rounded-2xl border border-white/[0.06] p-4 sm:p-5 theme-card">
        <h3 className="text-sm font-semibold text-white mb-3">
          {replyTo ? 'Replying to comment' : 'Add a comment'}
          {replyTo && (
            <button onClick={() => setReplyTo(null)} className="ml-2 text-xs text-accent-purple hover:underline">
              Cancel reply
            </button>
          )}
        </h3>
        <form onSubmit={handleComment} className="flex flex-col sm:flex-row gap-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your thoughts..."
            rows={2}
            maxLength={2000}
            className="flex-1 px-4 py-2.5 bg-dark-secondary border border-dark-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:border-accent-purple focus:outline-none resize-none"
          />
          <button
            type="submit"
            disabled={submitting || !commentText.trim()}
            className="self-end px-5 py-2.5 text-sm font-medium text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-40 shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}
          >
            {submitting ? '...' : 'Post'}
          </button>
        </form>
      </div>

      {/* Comments */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">
          Comments ({post.commentsCount || 0})
        </h3>

        {topLevel.length === 0 ? (
          <p className="text-sm text-text-muted py-6 text-center">No comments yet. Be the first!</p>
        ) : (
          topLevel.map((comment) => {
            const hasUp = comment.upvotes?.some((i) => (typeof i === 'string' ? i : i?._id || i) === uid);
            const hasDown = comment.downvotes?.some((i) => (typeof i === 'string' ? i : i?._id || i) === uid);
            const isCommentAuthor = uid === comment.userId?._id;
            const childReplies = replies(comment._id);

            return (
              <div key={comment._id} className="space-y-2">
                <div className="rounded-xl border border-white/[0.04] p-4 theme-card">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <button onClick={() => handleVoteComment(comment._id, 'up')} className={`p-0.5 rounded transition-colors ${hasUp ? 'text-accent-purple' : 'text-text-muted hover:text-accent-purple'}`}>
                        <HiOutlineChevronUp className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold text-text-muted">{comment.voteScore || 0}</span>
                      <button onClick={() => handleVoteComment(comment._id, 'down')} className={`p-0.5 rounded transition-colors ${hasDown ? 'text-accent-red' : 'text-text-muted hover:text-accent-red'}`}>
                        <HiOutlineChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                        <span className="font-medium text-text-secondary">{comment.userId?.name || 'Anonymous'}</span>
                        <span>{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => { setReplyTo(comment._id); setCommentText(''); }}
                          className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-purple transition-colors"
                        >
                          <HiOutlineReply className="w-3.5 h-3.5" /> Reply
                        </button>
                        {isCommentAuthor && (
                          <button onClick={() => handleDeleteComment(comment._id)} className="text-xs text-text-muted hover:text-accent-red transition-colors">
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nested replies */}
                {childReplies.length > 0 && (
                  <div className="ml-3 pl-3 sm:ml-6 sm:pl-4 space-y-2 border-l-2 border-dark-border/50">
                    {childReplies.map((reply) => {
                      const rUp = reply.upvotes?.some((i) => (typeof i === 'string' ? i : i?._id || i) === uid);
                      const rDown = reply.downvotes?.some((i) => (typeof i === 'string' ? i : i?._id || i) === uid);
                      const isReplyAuthor = uid === reply.userId?._id;
                      return (
                        <div key={reply._id} className="rounded-xl border border-white/[0.03] p-3 theme-card">
                          <div className="flex gap-3">
                            <div className="flex flex-col items-center gap-0.5 shrink-0">
                              <button onClick={() => handleVoteComment(reply._id, 'up')} className={`p-0.5 rounded transition-colors ${rUp ? 'text-accent-purple' : 'text-text-muted hover:text-accent-purple'}`}>
                                <HiOutlineChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-[10px] font-bold text-text-muted">{reply.voteScore || 0}</span>
                              <button onClick={() => handleVoteComment(reply._id, 'down')} className={`p-0.5 rounded transition-colors ${rDown ? 'text-accent-red' : 'text-text-muted hover:text-accent-red'}`}>
                                <HiOutlineChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                                <span className="font-medium text-text-secondary">{reply.userId?.name || 'Anonymous'}</span>
                                <span>{timeAgo(reply.createdAt)}</span>
                              </div>
                              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                              {isReplyAuthor && (
                                <button onClick={() => handleDeleteComment(reply._id)} className="text-xs text-text-muted hover:text-accent-red transition-colors mt-1">
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
