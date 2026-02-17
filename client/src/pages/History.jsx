import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineTrash,
} from 'react-icons/hi';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function History() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ role: '', status: 'completed' });

  const fetchInterviews = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;

      const { data } = await api.get('/interviews', { params });
      setInterviews(data.interviews);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [filters]);

  const handleDelete = async (e, interviewId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this interview and its feedback? This cannot be undone.')) return;
    try {
      await api.delete(`/interviews/${interviewId}`);
      toast.success('Interview deleted');
      fetchInterviews(pagination.page);
    } catch {
      toast.error('Failed to delete interview');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Delete all ${pagination.total} interviews? This cannot be undone.`)) return;
    try {
      await api.delete('/interviews/all');
      toast.success('All interviews deleted');
      fetchInterviews(1);
    } catch {
      toast.error('Failed to delete interviews');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 55) return 'text-amber-400';
    return 'text-red-400';
  };

  const getGradeBadge = (grade) => {
    const colors = {
      'A+': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'A': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'B+': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'B': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'C+': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'C': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'D': 'bg-red-500/10 text-red-400 border-red-500/20',
      'F': 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[grade] || colors['C'];
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Interview History</h1>
          <p className="text-text-secondary mt-1">{pagination.total} {pagination.total === 1 ? 'interview' : 'interviews'} total</p>
        </div>
        <div className="flex items-center gap-3">
          {pagination.total > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm text-red-400/70 hover:text-red-400 border border-red-500/10 hover:border-red-500/20 hover:bg-red-500/5 transition-all"
            >
              <HiOutlineTrash className="w-4 h-4" />
              Clear All
            </button>
          )}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 sm:px-4 sm:py-2.5 bg-dark-secondary border border-dark-border rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-dark-secondary rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <div className="rounded-2xl p-8 sm:p-12 text-center border border-white/[0.06]" style={{ background: 'rgba(15,15,30,0.5)' }}>
          <HiOutlineClock className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No interviews found</h3>
          <p className="text-text-secondary mb-6">Start practicing to see your history here</p>
          <Link
            to="/interview/setup"
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}
          >
            Start Interview
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((interview, index) => (
            <motion.div
              key={interview._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to={interview.feedback ? `/interview/feedback/${interview._id}` : '#'}
                  className={`flex-1 flex items-center justify-between p-3 sm:p-5 rounded-2xl border border-white/[0.06] hover:border-purple-500/15 transition-all group ${
                    !interview.feedback ? 'opacity-50' : ''
                  }`}
                  style={{ background: 'rgba(15,15,30,0.5)' }}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                         style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}>
                      <HiOutlineChartBar className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white group-hover:text-purple-300 transition-colors truncate">
                        {interview.config?.role || 'Unknown Role'} - {interview.config?.type || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-text-muted">
                          {new Date(interview.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </span>
                        <span className="text-xs text-text-muted">{interview.config?.duration} min</span>
                        <span className="text-xs text-text-muted capitalize">{interview.config?.difficulty}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          interview.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {interview.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {interview.feedback && (
                    <div className="text-right shrink-0 ml-2 sm:ml-4">
                      <p className={`text-xl sm:text-2xl font-bold ${getScoreColor(interview.feedback.overallScore)}`}>
                        {interview.feedback.overallScore}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getGradeBadge(interview.feedback.grade)}`}>
                        {interview.feedback.grade}
                      </span>
                    </div>
                  )}
                </Link>

                <button
                  onClick={(e) => handleDelete(e, interview._id)}
                  className="p-2 sm:p-3 rounded-xl text-text-muted/40 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/15 transition-all shrink-0"
                  title="Delete interview"
                >
                  <HiOutlineTrash className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => fetchInterviews(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-2 rounded-lg bg-dark-secondary border border-dark-border text-text-secondary hover:text-white disabled:opacity-30 transition-colors"
          >
            <HiOutlineChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-text-secondary">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => fetchInterviews(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="p-2 rounded-lg bg-dark-secondary border border-dark-border text-text-secondary hover:text-white disabled:opacity-30 transition-colors"
          >
            <HiOutlineChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
