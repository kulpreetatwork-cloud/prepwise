import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import { useEffect, lazy, Suspense } from 'react';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const History = lazy(() => import('./pages/History'));
const InterviewSetup = lazy(() => import('./pages/InterviewSetup'));
const InterviewRoom = lazy(() => import('./pages/InterviewRoom'));
const Feedback = lazy(() => import('./pages/Feedback'));
const QuestionBank = lazy(() => import('./pages/QuestionBank'));
const Community = lazy(() => import('./pages/Community'));
const CommunityPost = lazy(() => import('./pages/CommunityPost'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const saved = localStorage.getItem('prepwise_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/history" element={<History />} />
          <Route path="/interview/setup" element={<InterviewSetup />} />
          <Route path="/question-bank" element={<QuestionBank />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/:id" element={<CommunityPost />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>

        <Route
          path="/interview/room"
          element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>}
        />
        <Route
          path="/interview/feedback/:id"
          element={<ProtectedRoute><Feedback /></ProtectedRoute>}
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
