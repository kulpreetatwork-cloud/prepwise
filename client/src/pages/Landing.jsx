import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineLightningBolt, HiOutlineMicrophone, HiOutlineChartBar, HiOutlineAcademicCap, HiOutlineClock, HiOutlineShieldCheck, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
import { useThemeStore } from '../store/themeStore';

const features = [
  { icon: HiOutlineMicrophone, title: 'Real-Time Voice AI', description: 'Experience seamless voice-based interviews powered by cutting-edge AI technology' },
  { icon: HiOutlineLightningBolt, title: 'Adaptive Questions', description: 'AI adapts questions based on your responses, simulating a real interviewer' },
  { icon: HiOutlineChartBar, title: 'Detailed Feedback', description: 'Get comprehensive analysis with scores, strengths, and improvement areas' },
  { icon: HiOutlineAcademicCap, title: 'Role-Specific', description: 'Practice for Frontend, Backend, Data Science, PM, and 10+ other roles' },
  { icon: HiOutlineClock, title: 'Flexible Duration', description: 'Choose from 5 to 20 minute sessions that fit your schedule' },
  { icon: HiOutlineShieldCheck, title: 'Track Progress', description: 'Monitor your improvement with detailed analytics and streak tracking' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function Landing() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-dark-primary overflow-hidden">
      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-6 lg:px-20 py-4 sm:py-6 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg"
               style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}>
            P
          </div>
          <span className="text-xl sm:text-2xl font-bold gradient-text">Prepwise</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-text-muted hover:text-accent-purple hover:bg-accent-purple/10 transition-all"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
          </button>
          <Link to="/login" className="text-text-secondary hover:text-white transition-colors text-xs sm:text-sm font-medium px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-dark-tertiary/50">
            Sign In
          </Link>
          <Link to="/register" className="text-white text-xs sm:text-sm font-semibold px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl hover:opacity-90 transition-all shadow-lg"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', boxShadow: '0 4px 15px rgba(139,92,246,0.3)' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] lg:w-[900px] h-[500px] sm:h-[700px] lg:h-[900px] rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(59,130,246,0.06) 40%, transparent 70%)' }} />

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-16 sm:pt-24 pb-20 sm:pb-32 max-w-5xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium mb-10"
               style={{ background: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.2)', color: '#A78BFA' }}>
            <span className="w-2 h-2 rounded-full bg-accent-purple animate-pulse" />
            AI-Powered Interview Preparation
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-8xl font-extrabold text-white leading-[1.1] mb-6 sm:mb-8 tracking-tight">
            Ace Your Next
            <br />
            <span className="gradient-text">Interview</span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
            Practice mock interviews with an AI that speaks, listens, and adapts in
            real-time. Get instant feedback to land your dream job.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 text-white font-semibold px-6 py-3 sm:px-10 sm:py-4 rounded-2xl hover:opacity-90 transition-all text-base sm:text-lg"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', boxShadow: '0 8px 30px rgba(139,92,246,0.3)' }}
            >
              <HiOutlineLightningBolt className="w-5 h-5" />
              Start Practicing Free
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-text-secondary hover:text-white border border-dark-border hover:border-accent-purple/40 font-medium px-6 py-3 sm:px-10 sm:py-4 rounded-2xl transition-all text-base sm:text-lg"
            >
              I already have an account
            </Link>
          </div>
        </motion.div>

        {/* AI Orb Preview */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-20 sm:mt-28 relative"
        >
          <div className="glass-card rounded-3xl p-5 sm:p-12 lg:p-16 max-w-3xl mx-auto relative overflow-hidden">
            {/* subtle inner glow */}
            <div className="absolute inset-0 pointer-events-none"
                 style={{ background: 'radial-gradient(ellipse at center top, rgba(139,92,246,0.06) 0%, transparent 60%)' }} />

            <div className="flex items-center justify-center mb-6 sm:mb-8 relative">
              <div className="relative">
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full absolute inset-0 animate-ping opacity-20"
                     style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }} />
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center relative"
                     style={{
                       background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))',
                       border: '1px solid rgba(139,92,246,0.25)',
                       backdropFilter: 'blur(20px)',
                     }}>
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full"
                       style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1, #3B82F6)' }} />
                </div>
              </div>
            </div>

            <p className="text-text-secondary text-center text-base sm:text-lg italic leading-relaxed">
              &ldquo;Tell me about a challenging project you&rsquo;ve worked on and how you overcame the obstacles...&rdquo;
            </p>

            <div className="flex items-center justify-center gap-1.5 mt-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full animate-pulse"
                  style={{
                    height: `${14 + Math.random() * 22}px`,
                    animationDelay: `${i * 0.15}s`,
                    background: 'linear-gradient(to top, #8B5CF6, #3B82F6)',
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 lg:px-20 pb-28 sm:pb-36">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16 sm:mb-20"
          >
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5">Everything You Need to Prepare</h2>
            <p className="text-text-secondary text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Our platform combines AI interviewing with comprehensive feedback to accelerate your preparation
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                className="glass-card-hover rounded-2xl p-5 sm:p-8 group cursor-default"
              >
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-5 transition-all duration-300"
                     style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.12))' }}>
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-accent-purple group-hover:text-accent-blue transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 lg:px-20 pb-28 sm:pb-36">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center glass-card rounded-3xl p-6 sm:p-16 lg:p-20 relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.06) 0%, transparent 60%)' }} />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5">Ready to Ace Your Interview?</h2>
            <p className="text-text-secondary text-lg sm:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
              Start practicing now and build the confidence you need to land your dream job.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2.5 text-white font-semibold px-6 py-3 sm:px-10 sm:py-4 rounded-2xl hover:opacity-90 transition-all text-base sm:text-lg"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', boxShadow: '0 8px 30px rgba(139,92,246,0.3)' }}
            >
              <HiOutlineLightningBolt className="w-5 h-5" />
              Get Started &mdash; It&apos;s Free
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-dark-border px-6 py-10 text-center">
        <p className="text-text-muted text-sm">&copy; {new Date().getFullYear()} Prepwise &mdash; Your AI Interview Coach</p>
      </footer>
    </div>
  );
}
