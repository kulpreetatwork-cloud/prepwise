import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineSearch, HiOutlineFilter, HiOutlineBookmark,
  HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineLightBulb,
  HiOutlineStar,
} from 'react-icons/hi';
import { useAuthStore } from '../store/authStore';
import { DIFFICULTY_LEVELS } from '../utils/constants';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function QuestionBank() {
  const { user, setUser } = useAuthStore();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ role: '', type: '', difficulty: '' });
  const [expandedId, setExpandedId] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showBookmarked, setShowBookmarked] = useState(false);

  const fetchQuestions = async (page = 1) => {
    setLoading(true);
    try {
      if (showBookmarked) {
        const { data } = await api.get('/questions/bookmarked');
        setQuestions(data.questions);
        setPagination({ page: 1, pages: 1, total: data.questions.length });
      } else {
        const params = { page, limit: 20 };
        if (search) params.search = search;
        if (filters.role) params.role = filters.role;
        if (filters.type) params.type = filters.type;
        if (filters.difficulty) params.difficulty = filters.difficulty;

        const { data } = await api.get('/questions', { params });
        setQuestions(data.questions);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [filters, showBookmarked]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!showBookmarked) fetchQuestions();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleBookmark = async (questionId) => {
    try {
      const { data } = await api.post(`/questions/${questionId}/bookmark`);
      setUser({ ...user, bookmarkedQuestions: data.bookmarkedQuestions });
      toast.success('Bookmark updated');
    } catch {
      toast.error('Failed to update bookmark');
    }
  };

  const isBookmarked = (qId) => user?.bookmarkedQuestions?.includes(qId);

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-accent-green/10 text-accent-green border-accent-green/20',
      medium: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20',
      hard: 'bg-accent-red/10 text-accent-red border-accent-red/20',
      expert: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
    };
    return colors[difficulty] || colors.medium;
  };

  const getTypeColor = (type) => {
    const colors = {
      technical: 'bg-accent-blue/10 text-accent-blue',
      behavioral: 'bg-accent-green/10 text-accent-green',
      hr: 'bg-accent-yellow/10 text-accent-yellow',
      'system-design': 'bg-accent-purple/10 text-accent-purple',
    };
    return colors[type] || colors.technical;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Question Bank</h1>
        <p className="text-text-secondary mt-1">Browse and prepare with curated interview questions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            placeholder="Search questions..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-4 py-3 bg-dark-secondary border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-accent-purple focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all"
          >
            <option value="">All Roles</option>
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
            <option value="fullstack">Full Stack</option>
            <option value="data-analyst">Data Analyst</option>
            <option value="devops">DevOps</option>
            <option value="product-manager">Product Manager</option>
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-4 py-3 bg-dark-secondary border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-accent-purple focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all"
          >
            <option value="">All Types</option>
            <option value="technical">Technical</option>
            <option value="behavioral">Behavioral</option>
            <option value="hr">HR</option>
            <option value="system-design">System Design</option>
          </select>

          <select
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            className="px-4 py-3 bg-dark-secondary border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-accent-purple focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all"
          >
            <option value="">All Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>

          <button
            onClick={() => setShowBookmarked(!showBookmarked)}
            className={`p-3 rounded-xl border transition-all ${
              showBookmarked
                ? 'bg-accent-purple/20 border-accent-purple/30 text-accent-purple'
                : 'bg-dark-secondary border-dark-border text-text-secondary hover:text-white'
            }`}
            title="Show Bookmarked"
          >
            <HiOutlineBookmark className="w-5 h-5" />
          </button>
        </div>
      </div>

      <p className="text-text-muted text-sm">{pagination.total} questions found</p>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-dark-secondary rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <HiOutlineSearch className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No questions found</h3>
          <p className="text-text-secondary">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, index) => (
            <motion.div
              key={q._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === q._id ? null : q._id)}
                className="w-full flex items-start justify-between p-5 text-left"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium text-white leading-relaxed">{q.question}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getDifficultyColor(q.difficulty)}`}>
                      {q.difficulty}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(q.type)}`}>
                      {q.type}
                    </span>
                    <span className="text-xs text-text-muted capitalize">{q.role}</span>
                    <span className="text-xs text-text-muted">{q.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleBookmark(q._id); }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isBookmarked(q._id) ? 'text-accent-purple' : 'text-text-muted hover:text-accent-purple'
                    }`}
                  >
                    <HiOutlineBookmark className={`w-4 h-4 ${isBookmarked(q._id) ? 'fill-current' : ''}`} />
                  </button>
                  {expandedId === q._id ? (
                    <HiOutlineChevronUp className="w-5 h-5 text-text-muted" />
                  ) : (
                    <HiOutlineChevronDown className="w-5 h-5 text-text-muted" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {expandedId === q._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-5 space-y-4"
                  >
                    {q.idealAnswer && (
                      <div className="p-4 rounded-xl bg-accent-purple/5 border border-accent-purple/10">
                        <p className="text-xs font-medium text-accent-purple uppercase tracking-wider mb-2 flex items-center gap-1">
                          <HiOutlineStar className="w-3.5 h-3.5" />
                          Ideal Answer
                        </p>
                        <p className="text-sm text-text-secondary leading-relaxed">{q.idealAnswer}</p>
                      </div>
                    )}
                    {q.tips && (
                      <div className="p-4 rounded-xl bg-accent-yellow/5 border border-accent-yellow/10">
                        <p className="text-xs font-medium text-accent-yellow uppercase tracking-wider mb-2 flex items-center gap-1">
                          <HiOutlineLightBulb className="w-3.5 h-3.5" />
                          Tips
                        </p>
                        <p className="text-sm text-text-secondary leading-relaxed">{q.tips}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
