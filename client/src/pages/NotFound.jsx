import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineHome } from 'react-icons/hi';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center p-6 relative overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center relative z-10 max-w-md"
      >
        <div className="mb-8">
          <span
            className="text-8xl sm:text-9xl font-extrabold bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}
          >
            404
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-text-secondary text-sm sm:text-base mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl hover:opacity-90 transition-all text-sm"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', boxShadow: '0 4px 15px rgba(139,92,246,0.25)' }}
          >
            <HiOutlineHome className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 text-text-secondary hover:text-white border border-dark-border hover:border-accent-purple/30 rounded-xl transition-all text-sm"
          >
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
