import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area,
} from 'recharts';
import {
  HiOutlineTrendingUp,
  HiOutlineClock,
  HiOutlineStar,
  HiOutlineChartBar,
  HiOutlineAcademicCap,
  HiOutlineLightningBolt,
} from 'react-icons/hi';
import api from '../services/api';
import toast from 'react-hot-toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getHeatmapColor(count) {
  if (count === 0) return 'rgba(139,92,246,0.05)';
  if (count === 1) return 'rgba(139,92,246,0.2)';
  if (count === 2) return 'rgba(139,92,246,0.4)';
  if (count <= 4) return 'rgba(139,92,246,0.6)';
  return 'rgba(139,92,246,0.85)';
}

function HeatmapTooltip({ date, count }) {
  if (!date) return null;
  const d = new Date(date);
  return (
    <div className="px-3 py-1.5 rounded-lg text-xs" style={{ background: '#1A1A2E', border: '1px solid rgba(139,92,246,0.2)' }}>
      <span className="text-text-secondary font-medium">
        {count} {count === 1 ? 'interview' : 'interviews'}
      </span>
      <br />
      <span className="text-text-muted">
        {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    </div>
  );
}

function ContributionHeatmap({ data }) {
  const [hoverCell, setHoverCell] = useState(null);

  if (!data || data.length === 0) return null;

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);
  const startDay = startDate.getDay();

  const dataMap = {};
  data.forEach((d) => { dataMap[d.date] = d.count; });

  const weeks = [];
  let currentWeek = [];
  const cursor = new Date(startDate);

  for (let i = 0; i < startDay; i++) {
    currentWeek.push(null);
  }

  while (cursor <= today) {
    const key = cursor.toISOString().split('T')[0];
    currentWeek.push({ date: key, count: dataMap[key] || 0 });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const totalInterviews = data.reduce((s, d) => s + d.count, 0);
  const activeDays = data.filter((d) => d.count > 0).length;

  return (
    <div className="rounded-2xl border border-white/[0.06] p-4 sm:p-6" style={{ background: 'rgba(15,15,30,0.5)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 mb-4">
        <h3 className="text-base font-semibold text-white">Interview Activity</h3>
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span>{totalInterviews} total</span>
          <span>{activeDays} active days</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-[3px] min-w-max relative">
          {/* Day labels */}
          <div className="flex items-start">
            <div className="w-8 shrink-0" />
            <div className="flex gap-[3px]">
              {/* Month labels */}
            </div>
          </div>

          {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => (
            <div key={dayIdx} className="flex items-center gap-[3px]">
              <span className="text-[9px] text-text-muted w-8 text-right pr-2 shrink-0">
                {dayIdx % 2 === 1 ? DAYS[dayIdx]?.slice(0, 3) : ''}
              </span>
              {weeks.map((week, wIdx) => {
                const cell = week[dayIdx];
                if (!cell) return <div key={wIdx} className="w-[10px] h-[10px] sm:w-[13px] sm:h-[13px]" />;
                return (
                  <div
                    key={wIdx}
                    className="w-[10px] h-[10px] sm:w-[13px] sm:h-[13px] rounded-[3px] cursor-pointer transition-all hover:ring-1 hover:ring-accent-purple/50"
                    style={{ background: getHeatmapColor(cell.count) }}
                    onMouseEnter={() => setHoverCell(cell)}
                    onMouseLeave={() => setHoverCell(null)}
                    title={`${cell.date}: ${cell.count} interview${cell.count !== 1 ? 's' : ''}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] text-text-muted">
          {hoverCell ? <HeatmapTooltip date={hoverCell.date} count={hoverCell.count} /> : 'Hover for details'}
        </span>
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <span>Less</span>
          {[0, 1, 2, 3, 5].map((v) => (
            <div key={v} className="w-[11px] h-[11px] rounded-[2px]" style={{ background: getHeatmapColor(v) }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

const chartTooltipStyle = {
  backgroundColor: '#16162A',
  border: '1px solid rgba(139,92,246,0.2)',
  borderRadius: '12px',
  color: '#F1F5F9',
  fontSize: '12px',
};

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/users/analytics');
        setAnalytics(data.analytics);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-dark-secondary rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-20 max-w-6xl mx-auto">
        <p className="text-text-muted text-lg">No analytics data available yet</p>
        <p className="text-text-muted text-sm mt-2">Complete some interviews to see your analytics</p>
      </div>
    );
  }

  const { heatmap, categoryTrends, performanceByType, performanceByDifficulty, performanceByRole, timeOfDay, performanceByDuration, summary } = analytics;

  const summaryCards = [
    { label: 'Total Interviews', value: summary?.totalInterviews || 0, icon: HiOutlineChartBar, gradient: 'linear-gradient(135deg, #8B5CF6, #6366F1)' },
    { label: 'Practice Hours', value: summary?.totalPracticeHours || 0, icon: HiOutlineClock, gradient: 'linear-gradient(135deg, #3B82F6, #06B6D4)' },
    { label: 'Best Score', value: `${summary?.bestScore || 0}%`, icon: HiOutlineStar, gradient: 'linear-gradient(135deg, #10B981, #34D399)' },
    { label: 'Average Score', value: `${summary?.avgScore || 0}%`, icon: HiOutlineTrendingUp, gradient: 'linear-gradient(135deg, #F59E0B, #EAB308)' },
    { label: 'Most Practiced', value: summary?.mostPracticedRole || 'N/A', icon: HiOutlineAcademicCap, gradient: 'linear-gradient(135deg, #EF4444, #F97316)' },
    { label: 'Improvement', value: `${summary?.improvementRate > 0 ? '+' : ''}${summary?.improvementRate || 0}`, icon: HiOutlineLightningBolt, gradient: 'linear-gradient(135deg, #EC4899, #8B5CF6)' },
  ];

  const activeHours = timeOfDay?.filter((h) => h.count > 0) || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Analytics</h1>
        <p className="text-text-secondary text-sm mt-1">Deep insights into your interview performance</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl p-3 sm:p-4 border border-white/[0.06] relative overflow-hidden"
            style={{ background: 'rgba(15,15,30,0.5)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: card.gradient }}>
              <card.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm sm:text-lg font-bold text-white truncate">{card.value}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Heatmap */}
      <ContributionHeatmap data={heatmap} />

      {/* Score trend */}
      {categoryTrends?.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/[0.06] p-4 sm:p-6"
          style={{ background: 'rgba(15,15,30,0.5)' }}
        >
          <h3 className="text-base font-semibold text-white mb-4">Score Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={categoryTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickFormatter={(v) => { const d = new Date(v); return `${MONTHS[d.getMonth()]} ${d.getDate()}`; }} />
              <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line type="monotone" dataKey="overallScore" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6', r: 3 }} name="Overall" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Category performance over time */}
      {categoryTrends?.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-white/[0.06] p-4 sm:p-6"
          style={{ background: 'rgba(15,15,30,0.5)' }}
        >
          <h3 className="text-base font-semibold text-white mb-4">Category Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={categoryTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickFormatter={(v) => { const d = new Date(v); return `${MONTHS[d.getMonth()]} ${d.getDate()}`; }} />
              <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="communication" stroke="#8B5CF6" fill="rgba(139,92,246,0.08)" strokeWidth={1.5} name="Communication" />
              <Area type="monotone" dataKey="technicalAccuracy" stroke="#3B82F6" fill="rgba(59,130,246,0.08)" strokeWidth={1.5} name="Technical" />
              <Area type="monotone" dataKey="confidence" stroke="#10B981" fill="rgba(16,185,129,0.08)" strokeWidth={1.5} name="Confidence" />
              <Area type="monotone" dataKey="clarity" stroke="#F59E0B" fill="rgba(245,158,11,0.08)" strokeWidth={1.5} name="Clarity" />
              <Area type="monotone" dataKey="relevance" stroke="#06B6D4" fill="rgba(6,182,212,0.08)" strokeWidth={1.5} name="Relevance" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Breakdowns grid */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* By type */}
        {performanceByType?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-white/[0.06] p-4 sm:p-6"
            style={{ background: 'rgba(15,15,30,0.5)' }}
          >
            <h3 className="text-sm sm:text-base font-semibold text-white mb-4">By Interview Type</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={performanceByType} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" stroke="#64748B" fontSize={9} domain={[0, 100]} />
                <YAxis dataKey="type" type="category" stroke="#64748B" fontSize={9} width={65} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="avgScore" fill="#8B5CF6" radius={[0, 6, 6, 0]} barSize={16} name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* By difficulty */}
        {performanceByDifficulty?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl border border-white/[0.06] p-4 sm:p-6"
            style={{ background: 'rgba(15,15,30,0.5)' }}
          >
            <h3 className="text-sm sm:text-base font-semibold text-white mb-4">By Difficulty</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={performanceByDifficulty} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" stroke="#64748B" fontSize={10} domain={[0, 100]} />
                <YAxis dataKey="difficulty" type="category" stroke="#64748B" fontSize={10} width={60} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="avgScore" fill="#3B82F6" radius={[0, 6, 6, 0]} barSize={16} name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* By role */}
        {performanceByRole?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-white/[0.06] p-4 sm:p-6"
            style={{ background: 'rgba(15,15,30,0.5)' }}
          >
            <h3 className="text-sm sm:text-base font-semibold text-white mb-4">By Role</h3>
            <ResponsiveContainer width="100%" height={Math.max(150, performanceByRole.length * 35)}>
              <BarChart data={performanceByRole} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" stroke="#64748B" fontSize={9} domain={[0, 100]} />
                <YAxis dataKey="role" type="category" stroke="#64748B" fontSize={9} width={65} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="avgScore" fill="#10B981" radius={[0, 6, 6, 0]} barSize={16} name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* By duration */}
        {performanceByDuration?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-2xl border border-white/[0.06] p-4 sm:p-6"
            style={{ background: 'rgba(15,15,30,0.5)' }}
          >
            <h3 className="text-sm sm:text-base font-semibold text-white mb-4">By Duration</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={performanceByDuration}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="duration" stroke="#64748B" fontSize={10} tickFormatter={(v) => `${v}m`} />
                <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="avgScore" fill="#F59E0B" radius={[6, 6, 0, 0]} barSize={30} name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Time of day */}
      {activeHours.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-white/[0.06] p-4 sm:p-6"
          style={{ background: 'rgba(15,15,30,0.5)' }}
        >
          <h3 className="text-base font-semibold text-white mb-4">Best Time of Day</h3>
          <div className="flex items-end gap-0.5 sm:gap-1 h-24 sm:h-32">
            {timeOfDay?.map((h) => {
              const maxScore = Math.max(...timeOfDay.map((x) => x.avgScore || 0), 1);
              const height = h.count > 0 ? Math.max(8, (h.avgScore / maxScore) * 100) : 4;
              const label = h.hour === 0 ? '12a' : h.hour < 12 ? `${h.hour}a` : h.hour === 12 ? '12p' : `${h.hour - 12}p`;
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center justify-end gap-1 group" title={`${label}: ${h.count} interviews, avg ${h.avgScore}%`}>
                  <span className="text-[8px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    {h.count > 0 ? `${h.avgScore}%` : ''}
                  </span>
                  <div
                    className="w-full rounded-t-sm transition-all"
                    style={{
                      height: `${height}%`,
                      background: h.count > 0 ? `rgba(139,92,246,${0.3 + (h.avgScore / 100) * 0.6})` : 'rgba(139,92,246,0.05)',
                      minHeight: '3px',
                    }}
                  />
                  {h.hour % 4 === 0 && (
                    <span className="text-[8px] text-text-muted">{label}</span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
