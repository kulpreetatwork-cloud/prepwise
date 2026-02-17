import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineClock,
  HiOutlineTrendingUp,
  HiOutlineFire,
  HiOutlineChartBar,
  HiOutlinePlay,
  HiOutlineTrash,
} from 'react-icons/hi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { useAuthStore } from '../store/authStore';
import { ACHIEVEMENT_INFO } from '../utils/constants';
import api from '../services/api';
import toast from 'react-hot-toast';

function formatPracticeTime(minutes) {
  if (!minutes || minutes === 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function pluralize(value, singular, plural) {
  return value === 1 ? singular : plural;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/users/stats');
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDeleteInterview = async (e, interviewId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this interview and its feedback?')) return;
    try {
      await api.delete(`/interviews/${interviewId}`);
      toast.success('Interview deleted');
      fetchStats();
    } catch {
      toast.error('Failed to delete interview');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-dark-secondary rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const completedCount = stats?.completedInterviews || 0;
  const avgScore = stats?.averageScore || 0;
  const practiceMin = stats?.practiceMinutes || 0;
  const streak = stats?.currentStreak || 0;

  const statCards = [
    {
      label: 'Total Interviews',
      value: completedCount,
      suffix: '',
      icon: HiOutlineChartBar,
      gradient: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
      glow: 'rgba(139,92,246,0.15)',
    },
    {
      label: 'Average Score',
      value: avgScore,
      suffix: '%',
      icon: HiOutlineTrendingUp,
      gradient: 'linear-gradient(135deg, #10B981, #34D399)',
      glow: 'rgba(16,185,129,0.15)',
    },
    {
      label: 'Practice Time',
      value: formatPracticeTime(practiceMin),
      raw: true,
      icon: HiOutlineClock,
      gradient: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
      glow: 'rgba(59,130,246,0.15)',
    },
    {
      label: 'Current Streak',
      value: streak,
      suffix: ` ${pluralize(streak, 'day', 'days')}`,
      icon: HiOutlineFire,
      gradient: 'linear-gradient(135deg, #F97316, #F59E0B)',
      glow: 'rgba(249,115,22,0.15)',
    },
  ];

  const radarData = stats?.skillRadar
    ? [
        { subject: 'Communication', value: stats.skillRadar.communication },
        { subject: 'Technical', value: stats.skillRadar.technicalAccuracy },
        { subject: 'Confidence', value: stats.skillRadar.confidence },
        { subject: 'Clarity', value: stats.skillRadar.clarity },
        { subject: 'Relevance', value: stats.skillRadar.relevance },
      ]
    : null;

  const getGradeColor = (grade) => {
    if (grade?.startsWith('A')) return 'text-emerald-400';
    if (grade?.startsWith('B')) return 'text-blue-400';
    return 'text-amber-400';
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Welcome section */}
      <div className="relative rounded-2xl overflow-hidden p-4 sm:p-6 lg:p-8"
           style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.04) 50%, rgba(59,130,246,0.08) 100%)', border: '1px solid rgba(139,92,246,0.1)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-30" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-text-secondary text-sm lg:text-base">
            {completedCount > 0
              ? `You've completed ${completedCount} ${pluralize(completedCount, 'interview', 'interviews')}. Keep going!`
              : 'Start your interview prep journey today.'}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="rounded-2xl p-3.5 sm:p-5 lg:p-6 border border-white/[0.06] relative overflow-hidden theme-card"
          >
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20" style={{ background: stat.glow }} />
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3"
                 style={{ background: stat.gradient }}>
              <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-white leading-tight truncate">
              {stat.raw ? stat.value : `${stat.value}${stat.suffix || ''}`}
            </p>
            <p className="text-text-muted text-[10px] sm:text-xs mt-1 sm:mt-1.5 uppercase tracking-wider font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {stats?.progressData?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl p-4 sm:p-6 border border-white/[0.06] theme-card"
          >
            <h3 className="text-base font-semibold text-white mb-4">Score Progress</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="interview" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16162A',
                    border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: '12px',
                    color: '#F1F5F9',
                    fontSize: '12px',
                  }}
                />
                <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6', r: 3 }} />
                <Line type="monotone" dataKey="communication" stroke="#3B82F6" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="technical" stroke="#10B981" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {radarData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="rounded-2xl p-4 sm:p-6 border border-white/[0.06] theme-card"
          >
            <h3 className="text-base font-semibold text-white mb-4">Skill Radar</h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar
                  dataKey="value"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {!stats?.progressData?.length && !radarData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl p-12 text-center lg:col-span-2 border border-white/[0.06] theme-card"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                 style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))', border: '1px solid rgba(139,92,246,0.2)' }}>
              <HiOutlinePlay className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No interviews yet</h3>
            <p className="text-text-secondary text-sm mb-6">Complete your first mock interview to see your progress charts</p>
            <Link
              to="/interview/setup"
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', boxShadow: '0 4px 15px rgba(139,92,246,0.25)' }}
            >
              Start Your First Interview
            </Link>
          </motion.div>
        )}
      </div>

      {/* Recent Interviews */}
      {stats?.recentInterviews?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl p-4 sm:p-6 border border-white/[0.06] theme-card"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-white">Recent Interviews</h3>
            <Link to="/history" className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium uppercase tracking-wider">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {stats.recentInterviews.map((interview) => (
              <Link
                key={interview._id}
                to={interview.feedback ? `/interview/feedback/${interview._id}` : '#'}
                className={`flex items-center justify-between p-4 rounded-xl transition-all group border border-transparent hover:border-purple-500/10 ${
                  !interview.feedback ? 'opacity-50 pointer-events-none' : ''
                }`}
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <HiOutlineChartBar className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors truncate">
                      {interview.config?.role} - {interview.config?.type}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {new Date(interview.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {' · '}
                      {interview.config?.duration} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {interview.feedback && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{interview.feedback.overallScore}%</p>
                      <p className={`text-[10px] font-semibold uppercase tracking-wider ${getGradeColor(interview.feedback.grade)}`}>
                        Grade {interview.feedback.grade}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={(e) => handleDeleteInterview(e, interview._id)}
                    className="p-2 rounded-lg text-text-muted/40 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    title="Delete interview"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Achievements */}
      {stats?.achievements?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="rounded-2xl p-4 sm:p-6 border border-white/[0.06] theme-card"
        >
          <h3 className="text-base font-semibold text-white mb-4">Achievements</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {stats.achievements.map((achievement) => {
              const info = ACHIEVEMENT_INFO[achievement.achievementType];
              if (!info) return null;
              return (
                <div
                  key={achievement._id}
                  className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all hover:border-purple-500/30"
                  style={{ background: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.15)' }}
                  title={info.description}
                >
                  <span className="text-lg">{info.icon}</span>
                  <span className="text-sm font-medium text-white">{info.title}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
