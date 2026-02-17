import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineTrendingUp,
  HiOutlineChartBar,
  HiOutlineFire,
  HiOutlineLightningBolt,
} from 'react-icons/hi';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

const RANKING_TYPES = [
  { id: 'score', label: 'Top Scores', icon: HiOutlineTrendingUp, unit: '%', description: 'Average interview score' },
  { id: 'interviews', label: 'Most Interviews', icon: HiOutlineChartBar, unit: '', description: 'Completed interviews' },
  { id: 'streak', label: 'Longest Streaks', icon: HiOutlineFire, unit: ' days', description: 'Best practice streak' },
  { id: 'improvement', label: 'Most Improved', icon: HiOutlineLightningBolt, unit: ' pts', description: 'Score improvement' },
];

const PERIODS = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'all-time', label: 'All Time' },
];

const PODIUM_STYLES = [
  { gradient: 'linear-gradient(135deg, #F59E0B, #EAB308)', glow: 'rgba(245,158,11,0.2)', badge: '#F59E0B', order: 1 },
  { gradient: 'linear-gradient(135deg, #94A3B8, #CBD5E1)', glow: 'rgba(148,163,184,0.2)', badge: '#94A3B8', order: 0 },
  { gradient: 'linear-gradient(135deg, #D97706, #B45309)', glow: 'rgba(217,119,6,0.2)', badge: '#D97706', order: 2 },
];

export default function Leaderboard() {
  const { user } = useAuthStore();
  const [type, setType] = useState('score');
  const [period, setPeriod] = useState('all-time');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/leaderboard', { params: { type, period } });
      setEntries(data.entries || []);
    } catch {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [type, period]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const currentType = RANKING_TYPES.find((t) => t.id === type);
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const myEntry = entries.find((e) => e.userId?.toString() === user?._id || e.userId === user?._id);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Leaderboard</h1>
        <p className="text-text-secondary text-sm mt-1">See how you rank against other Prepwise users</p>
      </div>

      {/* Ranking type tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {RANKING_TYPES.map((rt) => (
          <button
            key={rt.id}
            onClick={() => setType(rt.id)}
            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
              type === rt.id
                ? 'border-accent-purple/30 text-white'
                : 'border-white/[0.06] text-text-secondary hover:border-white/10'
            }`}
            style={{
              background: type === rt.id
                ? 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.05))'
                : 'rgba(15,15,30,0.5)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: type === rt.id ? 'linear-gradient(135deg, #8B5CF6, #3B82F6)' : 'rgba(139,92,246,0.1)' }}
            >
              <rt.icon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{rt.label}</p>
              <p className="text-[10px] text-text-muted truncate">{rt.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Period toggle */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-dark-secondary border border-dark-border w-fit">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === p.id ? 'bg-accent-purple/15 text-white' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-56 bg-dark-secondary rounded-2xl animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-dark-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-white/[0.06]" style={{ background: 'rgba(15,15,30,0.5)' }}>
          <p className="text-text-muted text-lg mb-2">No data yet</p>
          <p className="text-text-muted text-sm">Complete interviews to appear on the leaderboard!</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center gap-4 sm:gap-5 pt-8 pb-4">
              {[1, 0, 2].map((podiumIdx) => {
                const entry = top3[podiumIdx];
                if (!entry) return <div key={podiumIdx} className="hidden sm:block w-28 sm:w-36" />;
                const style = PODIUM_STYLES[podiumIdx];
                const isCenter = podiumIdx === 0;

                return (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: podiumIdx * 0.1 }}
                    className={`flex flex-row sm:flex-col items-center gap-3 sm:gap-0 w-full sm:w-auto ${isCenter ? 'sm:w-40' : 'sm:w-36'}`}
                    style={{ order: style.order }}
                  >
                    <div className="relative shrink-0 sm:mb-3">
                      <div
                        className={`${isCenter ? 'w-14 h-14 sm:w-20 sm:h-20' : 'w-12 h-12 sm:w-16 sm:h-16'} rounded-full flex items-center justify-center text-lg sm:text-xl font-bold text-white`}
                        style={{
                          background: style.gradient,
                          boxShadow: `0 0 30px ${style.glow}`,
                        }}
                      >
                        {entry.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div
                        className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-dark-primary"
                        style={{ background: style.badge }}
                      >
                        #{entry.rank}
                      </div>
                    </div>
                    <div className="flex-1 sm:flex-none sm:text-center min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{entry.name}</p>
                      {entry.targetRole && (
                        <p className="text-[10px] text-text-muted truncate">{entry.targetRole}</p>
                      )}
                    </div>
                    <p className="text-lg font-bold text-white sm:mt-1 shrink-0">
                      {typeof entry.value === 'number' ? (Number.isInteger(entry.value) ? entry.value : entry.value.toFixed(1)) : entry.value}
                      <span className="text-xs text-text-muted">{currentType?.unit}</span>
                    </p>

                    <div
                      className={`hidden sm:block w-full ${isCenter ? 'h-28 sm:h-36' : 'h-20 sm:h-24'} rounded-t-2xl mt-3`}
                      style={{
                        background: `linear-gradient(180deg, ${style.glow} 0%, rgba(15,15,30,0.3) 100%)`,
                        border: `1px solid ${style.glow}`,
                        borderBottom: 'none',
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Remaining list */}
          {rest.length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: 'rgba(15,15,30,0.5)' }}>
              {rest.map((entry, i) => {
                const isMe = entry.userId?.toString() === user?._id || entry.userId === user?._id;
                return (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-3.5 border-b border-white/[0.03] last:border-b-0 transition-colors ${
                      isMe ? 'bg-accent-purple/5' : 'hover:bg-white/[0.02]'
                    }`}
                    style={isMe ? { border: '1px solid rgba(139,92,246,0.15)', borderRadius: '0.75rem', margin: '0.25rem 0.5rem' } : {}}
                  >
                    <span className="text-sm font-bold text-text-muted w-8 text-center shrink-0">
                      {entry.rank}
                    </span>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0"
                      style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}
                    >
                      {entry.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {entry.name}
                        {isMe && <span className="text-xs text-accent-purple ml-2">(You)</span>}
                      </p>
                      {entry.targetRole && (
                        <p className="text-[10px] text-text-muted truncate">{entry.targetRole}</p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-white shrink-0">
                      {typeof entry.value === 'number' ? (Number.isInteger(entry.value) ? entry.value : entry.value.toFixed(1)) : entry.value}
                      <span className="text-xs text-text-muted">{currentType?.unit}</span>
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* My rank callout */}
          {myEntry && myEntry.rank > 3 && (
            <div
              className="rounded-2xl p-4 border flex items-center gap-4"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.04))',
                borderColor: 'rgba(139,92,246,0.2)',
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}>
                #{myEntry.rank}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Your Ranking</p>
                <p className="text-xs text-text-muted">
                  {currentType?.label}: {typeof myEntry.value === 'number' ? (Number.isInteger(myEntry.value) ? myEntry.value : myEntry.value.toFixed(1)) : myEntry.value}{currentType?.unit}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
