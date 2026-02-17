import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineInformationCircle, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
import { useThemeStore } from '../store/themeStore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, googleAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error('Please fill in all fields');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      await googleAuth({
        email: payload.email,
        name: payload.name,
        googleId: payload.sub,
        avatar: payload.picture,
      });
      toast.success('Welcome to Prepwise!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Google signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-dark-primary flex flex-row relative">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 z-30 p-2.5 rounded-xl text-text-muted hover:text-accent-purple hover:bg-accent-purple/10 transition-all border border-dark-border bg-dark-secondary/80 backdrop-blur-sm"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
      </button>

      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center p-16"
           style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(59,130,246,0.08) 100%)' }}>
        <div className="absolute top-[20%] left-[20%] w-80 h-80 rounded-full opacity-40"
             style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[20%] right-[20%] w-80 h-80 rounded-full opacity-40"
             style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }} />
        <div className="relative z-10 text-center max-w-md">
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-bold text-4xl mx-auto mb-10 glow-purple"
               style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}>
            P
          </div>
          <h2 className="text-5xl font-extrabold text-white mb-5 leading-tight">Join<br/>Prepwise</h2>
          <p className="text-text-secondary text-lg leading-relaxed">Start your interview preparation journey and build the confidence to land your dream job.</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-3 mb-12 lg:hidden">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                 style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}>
              P
            </div>
            <span className="text-2xl font-bold gradient-text">Prepwise</span>
          </Link>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Create account</h1>
          <p className="text-text-secondary text-base mb-8">Get started with your free account</p>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-8">
            <HiOutlineInformationCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/90 leading-relaxed">
              First request may take up to 50 seconds as our server wakes up (free tier). Subsequent requests are instant.
            </p>
          </div>

          {GOOGLE_CLIENT_ID && (
            <>
              <div className="flex justify-center mb-8">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google signup failed')}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  text="signup_with"
                />
              </div>
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dark-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-dark-primary text-text-muted">or sign up with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2.5">Full Name</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted z-10" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2.5">Email</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted z-10" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2.5">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted z-10" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field !pr-12"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors z-10"
                >
                  {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-base rounded-xl"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-text-secondary text-sm mt-10">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-purple hover:text-accent-blue transition-colors font-semibold">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function Register() {
  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <RegisterForm />
      </GoogleOAuthProvider>
    );
  }
  return <RegisterForm />;
}
