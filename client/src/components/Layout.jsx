import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import OnboardingTour from './OnboardingTour';
import {
  HiOutlineViewGrid,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineCollection,
  HiOutlineLogout,
  HiOutlineLightningBolt,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineChartPie,
  HiOutlineQuestionMarkCircle,
} from 'react-icons/hi';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid, tourClass: 'tour-dashboard' },
  { path: '/interview/setup', label: 'New Interview', icon: HiOutlineLightningBolt, tourClass: 'tour-new-interview' },
  { path: '/history', label: 'History', icon: HiOutlineClock, tourClass: 'tour-history' },
  { path: '/question-bank', label: 'Questions', icon: HiOutlineCollection, tourClass: 'tour-questions' },
  { path: '/community', label: 'Community', icon: HiOutlineUserGroup, tourClass: 'tour-community' },
  { path: '/leaderboard', label: 'Leaderboard', icon: HiOutlineChartBar, tourClass: 'tour-leaderboard' },
  { path: '/analytics', label: 'Analytics', icon: HiOutlineChartPie, tourClass: 'tour-analytics' },
  { path: '/profile', label: 'Profile', icon: HiOutlineUser, tourClass: 'tour-profile' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const tourDone = localStorage.getItem('prepwise_tour_completed');
    if (!tourDone) {
      const timer = setTimeout(() => setShowTour(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full tour-welcome">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
               style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}>
            P
          </div>
          <span className="text-xl font-bold gradient-text">Prepwise</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `${item.tourClass} flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'text-white shadow-md'
                  : 'text-text-secondary hover:text-white hover:bg-dark-tertiary/60'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))',
                    border: '1px solid rgba(139,92,246,0.25)',
                  }
                : { border: '1px solid transparent' }
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="px-4 py-4 border-t border-dark-border">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold"
               style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-text-muted truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-accent-red hover:bg-accent-red/10 transition-all duration-200 w-full"
        >
          <HiOutlineLogout className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-primary flex flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 fixed h-full z-30 border-r border-dark-border"
             style={{ background: 'linear-gradient(180deg, #111118 0%, #0D0D14 100%)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col lg:hidden border-r border-dark-border"
              style={{ background: 'linear-gradient(180deg, #111118 0%, #0D0D14 100%)' }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col overflow-x-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-20 border-b border-dark-border px-5 lg:px-8 py-4 flex items-center justify-between"
                style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-dark-tertiary transition-colors"
          >
            <HiOutlineMenu className="w-6 h-6 text-text-secondary" />
          </button>
          <div className="lg:hidden" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTour(true)}
              className="p-2 rounded-lg text-text-muted hover:text-accent-purple hover:bg-accent-purple/10 transition-all"
              title="Take a tour"
            >
              <HiOutlineQuestionMarkCircle className="w-5 h-5" />
            </button>
            <NavLink
              to="/interview/setup"
              className="tour-start-btn hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', boxShadow: '0 4px 12px rgba(139,92,246,0.25)' }}
            >
              <HiOutlineLightningBolt className="w-4 h-4" />
              Start Interview
            </NavLink>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-5 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* Onboarding Tour */}
      <OnboardingTour run={showTour} onFinish={() => setShowTour(false)} />
    </div>
  );
}
