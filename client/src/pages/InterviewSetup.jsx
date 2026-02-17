import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInterviewStore } from '../store/interviewStore';
import { useAudio } from '../hooks/useAudio';
import {
  ROLES, INTERVIEW_TYPES, DIFFICULTY_LEVELS, EXPERIENCE_LEVELS,
  DURATIONS, INTERVIEW_STYLES, COMPANY_STYLES, FOCUS_AREAS,
} from '../utils/constants';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineChevronRight, HiOutlineChevronLeft, HiOutlineMicrophone,
  HiOutlineDocumentText, HiOutlineLightningBolt, HiOutlineCheck,
  HiOutlinePlay, HiOutlineAcademicCap, HiOutlineBriefcase,
  HiOutlineBookmark, HiOutlineTrash, HiOutlineX, HiOutlineStar,
} from 'react-icons/hi';

const STEPS = ['Role', 'Configuration', 'Enhancements', 'Ready'];

export default function InterviewSetup() {
  const navigate = useNavigate();
  const { config, setConfig, resetConfig } = useInterviewStore();
  const { testMicrophone } = useAudio();
  const [step, setStep] = useState(0);
  const [customRole, setCustomRole] = useState('');
  const [micTested, setMicTested] = useState(false);
  const [micWorking, setMicWorking] = useState(false);
  const [testingMic, setTestingMic] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data } = await api.get('/templates');
        setTemplates(data.templates || []);
      } catch {
        /* ignore */
      }
    };
    fetchTemplates();
  }, []);

  const handleUseTemplate = async (template) => {
    const c = template.config;
    setConfig({
      role: c.role || '',
      type: c.type || 'technical',
      difficulty: c.difficulty || 'medium',
      experienceLevel: c.experienceLevel || 'fresher',
      duration: c.duration || 10,
      focusAreas: c.focusAreas || [],
      interviewStyle: c.interviewStyle || 'neutral',
      companyStyle: c.companyStyle || 'general',
      mode: c.mode || 'assessment',
    });
    toast.success(`Template "${template.name}" loaded`);
    try {
      await api.post(`/templates/${template._id}/use`);
    } catch {
      /* ignore */
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return toast.error('Template name is required');
    if (!config.role) return toast.error('Please select a role first');
    setSavingTemplate(true);
    try {
      const { data } = await api.post('/templates', {
        name: templateName,
        description: templateDesc,
        config: {
          role: config.role,
          type: config.type,
          difficulty: config.difficulty,
          experienceLevel: config.experienceLevel,
          duration: config.duration,
          focusAreas: config.focusAreas,
          interviewStyle: config.interviewStyle,
          companyStyle: config.companyStyle,
          mode: config.mode,
        },
      });
      setTemplates((prev) => [...prev, data.template]);
      setShowSaveTemplate(false);
      setTemplateName('');
      setTemplateDesc('');
      toast.success('Template saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (e, templateId) => {
    e.stopPropagation();
    if (!confirm('Delete this template?')) return;
    try {
      await api.delete(`/templates/${templateId}`);
      setTemplates((prev) => prev.filter((t) => t._id !== templateId));
      toast.success('Template deleted');
    } catch {
      toast.error('Failed to delete template');
    }
  };

  const nextStep = () => {
    if (step === 0 && !config.role) {
      return toast.error('Please select a role');
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleRoleSelect = (roleId) => {
    if (roleId === 'other') {
      if (!customRole.trim()) return;
      setConfig({ role: customRole.trim() });
    } else {
      const role = ROLES.find((r) => r.id === roleId);
      setConfig({ role: role?.label || roleId });
    }
  };

  const handleFocusToggle = (area) => {
    const current = config.focusAreas || [];
    if (current.includes(area)) {
      setConfig({ focusAreas: current.filter((a) => a !== area) });
    } else {
      if (current.length >= 5) return toast.error('Max 5 focus areas');
      setConfig({ focusAreas: [...current, area] });
    }
  };

  const handleTestMic = async () => {
    setTestingMic(true);
    const result = await testMicrophone();
    setMicTested(true);
    setMicWorking(result);
    setTestingMic(false);
    if (result) {
      toast.success('Microphone is working!');
    } else {
      toast.error('Microphone access denied. Please enable it in your browser settings.');
    }
  };

  const handleStart = () => {
    if (!micTested || !micWorking) {
      return toast.error('Please test your microphone first');
    }
    navigate('/interview/room');
  };

  const roleId = ROLES.find((r) => r.label === config.role)?.id || '';
  const availableFocusAreas = FOCUS_AREAS[roleId] || FOCUS_AREAS['fullstack'];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Setup Your Interview</h1>
          <p className="text-text-secondary">Configure your mock interview experience</p>
        </div>
        <button
          onClick={() => setShowSaveTemplate(true)}
          className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 text-sm font-medium text-text-secondary hover:text-white rounded-xl border border-dark-border hover:border-accent-purple/30 transition-all"
        >
          <HiOutlineBookmark className="w-4 h-4" />
          <span className="hidden sm:inline">Save as Template</span>
        </button>
      </div>

      {/* Templates section */}
      {templates.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Quick Start Templates</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {templates.map((t) => (
              <button
                key={t._id}
                onClick={() => handleUseTemplate(t)}
                className="group shrink-0 w-44 sm:w-52 rounded-xl border border-white/[0.06] p-3 sm:p-4 text-left transition-all hover:border-purple-500/20 relative"
                style={{ background: 'rgba(15,15,30,0.5)' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                    style={{ background: t.color || '#8B5CF6' }}
                  />
                  {!t.isDefault && (
                    <button
                      onClick={(e) => handleDeleteTemplate(e, t._id)}
                      className="p-1 rounded-md text-text-muted/30 hover:text-accent-red hover:bg-accent-red/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <HiOutlineTrash className="w-3 h-3" />
                    </button>
                  )}
                  {t.isDefault && (
                    <span className="text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-white truncate">{t.name}</p>
                {t.description && (
                  <p className="text-[11px] text-text-muted line-clamp-1 mt-0.5">{t.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-dark-tertiary/50 text-text-muted">{t.config?.type}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-dark-tertiary/50 text-text-muted">{t.config?.difficulty}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-dark-tertiary/50 text-text-muted">{t.config?.duration}m</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all shrink-0 ${
              i < step ? 'bg-accent-purple text-white' :
              i === step ? 'bg-gradient-to-r from-accent-purple to-accent-blue text-white' :
              'bg-dark-secondary text-text-muted border border-dark-border'
            }`}>
              {i < step ? <HiOutlineCheck className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${i <= step ? 'text-white' : 'text-text-muted'}`}>{s}</span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? 'bg-accent-purple' : 'bg-dark-border'}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <HiOutlineBriefcase className="w-5 h-5 text-accent-purple" />
                Select Target Role
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      config.role === role.label
                        ? 'border-accent-purple bg-accent-purple/10 shadow-lg shadow-accent-purple/10'
                        : 'border-dark-border bg-dark-secondary hover:border-accent-purple/50'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{role.icon}</span>
                    <span className="text-sm font-medium text-white">{role.label}</span>
                  </button>
                ))}
                <div className="p-4 rounded-xl border border-dark-border bg-dark-secondary">
                  <span className="text-2xl mb-2 block">+</span>
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    onBlur={() => customRole.trim() && handleRoleSelect('other')}
                    className="w-full bg-transparent text-sm text-white placeholder:text-text-muted focus:outline-none"
                    placeholder="Custom role..."
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Interview Type</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {INTERVIEW_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setConfig({ type: t.id })}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      config.type === t.id
                        ? 'border-accent-purple bg-accent-purple/10'
                        : 'border-dark-border bg-dark-secondary hover:border-accent-purple/50'
                    }`}
                  >
                    <p className="text-sm font-medium text-white">{t.label}</p>
                    <p className="text-xs text-text-muted mt-1">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Difficulty</h3>
                <div className="grid grid-cols-2 gap-3">
                  {DIFFICULTY_LEVELS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setConfig({ difficulty: d.id })}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        config.difficulty === d.id
                          ? 'border-accent-purple bg-accent-purple/10'
                          : 'border-dark-border bg-dark-secondary hover:border-accent-purple/50'
                      }`}
                    >
                      <span className={`text-sm font-medium ${d.color}`}>{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Experience Level</h3>
                <div className="grid grid-cols-2 gap-3">
                  {EXPERIENCE_LEVELS.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setConfig({ experienceLevel: e.id })}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        config.experienceLevel === e.id
                          ? 'border-accent-purple bg-accent-purple/10'
                          : 'border-dark-border bg-dark-secondary hover:border-accent-purple/50'
                      }`}
                    >
                      <p className="text-sm font-medium text-white">{e.label}</p>
                      <p className="text-xs text-text-muted">{e.subtitle}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Duration</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setConfig({ duration: d.value })}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      config.duration === d.value
                        ? 'border-accent-purple bg-accent-purple/10'
                        : 'border-dark-border bg-dark-secondary hover:border-accent-purple/50'
                    }`}
                  >
                    <p className="text-lg font-bold text-white">{d.label}</p>
                    <p className="text-xs text-text-muted">{d.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Interview Style</h3>
                <div className="space-y-2">
                  {INTERVIEW_STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setConfig({ interviewStyle: s.id })}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        config.interviewStyle === s.id
                          ? 'border-accent-purple bg-accent-purple/10'
                          : 'border-dark-border bg-dark-secondary hover:border-accent-purple/50'
                      }`}
                    >
                      <p className="text-sm font-medium text-white">{s.label}</p>
                      <p className="text-xs text-text-muted">{s.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Company Style</h3>
                <div className="space-y-2">
                  {COMPANY_STYLES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setConfig({ companyStyle: c.id })}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        config.companyStyle === c.id
                          ? 'border-accent-purple bg-accent-purple/10'
                          : 'border-dark-border bg-dark-secondary hover:border-accent-purple/50'
                      }`}
                    >
                      <p className="text-sm font-medium text-white">{c.label}</p>
                      <p className="text-xs text-text-muted">{c.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Focus Areas</h3>
              <p className="text-text-muted text-sm mb-4">Select up to 5 topics to focus on</p>
              <div className="flex flex-wrap gap-2">
                {availableFocusAreas.map((area) => (
                  <button
                    key={area}
                    onClick={() => handleFocusToggle(area)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      config.focusAreas?.includes(area)
                        ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
                        : 'bg-dark-secondary text-text-secondary border border-dark-border hover:border-accent-purple/30'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Mode</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setConfig({ mode: 'practice' })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    config.mode === 'practice'
                      ? 'border-accent-green bg-accent-green/10'
                      : 'border-dark-border bg-dark-secondary hover:border-accent-green/30'
                  }`}
                >
                  <HiOutlineAcademicCap className="w-6 h-6 text-accent-green mb-2" />
                  <p className="text-sm font-medium text-white">Practice Mode</p>
                  <p className="text-xs text-text-muted mt-1">Relaxed, with hints and tips</p>
                </button>
                <button
                  onClick={() => setConfig({ mode: 'assessment' })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    config.mode === 'assessment'
                      ? 'border-accent-purple bg-accent-purple/10'
                      : 'border-dark-border bg-dark-secondary hover:border-accent-purple/30'
                  }`}
                >
                  <HiOutlineLightningBolt className="w-6 h-6 text-accent-purple mb-2" />
                  <p className="text-sm font-medium text-white">Assessment Mode</p>
                  <p className="text-xs text-text-muted mt-1">Strict, realistic simulation</p>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <HiOutlineDocumentText className="w-5 h-5 text-accent-purple" />
                Resume Text (Optional)
              </h3>
              <p className="text-text-muted text-sm mb-4">Paste your resume content to get personalized questions</p>
              <textarea
                value={config.resumeText}
                onChange={(e) => setConfig({ resumeText: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-xl text-white text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all resize-none"
                placeholder="Paste your resume content here..."
              />
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <HiOutlineBriefcase className="w-5 h-5 text-accent-purple" />
                Job Description (Optional)
              </h3>
              <p className="text-text-muted text-sm mb-4">Paste the JD to tailor questions to specific requirements</p>
              <textarea
                value={config.jobDescription}
                onChange={(e) => setConfig({ jobDescription: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-xl text-white text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all resize-none"
                placeholder="Paste the job description here..."
              />
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Interview Summary</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Role', value: config.role },
                  { label: 'Type', value: config.type },
                  { label: 'Difficulty', value: config.difficulty },
                  { label: 'Experience', value: config.experienceLevel },
                  { label: 'Duration', value: `${config.duration} minutes` },
                  { label: 'Style', value: config.interviewStyle },
                  { label: 'Company', value: config.companyStyle },
                  { label: 'Mode', value: config.mode },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between p-3 rounded-lg bg-dark-secondary/50">
                    <span className="text-sm text-text-muted">{item.label}</span>
                    <span className="text-sm font-medium text-white capitalize">{item.value}</span>
                  </div>
                ))}
              </div>
              {config.focusAreas?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-text-muted mb-2">Focus Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {config.focusAreas.map((area) => (
                      <span key={area} className="px-3 py-1 rounded-lg bg-accent-purple/10 text-accent-purple text-xs border border-accent-purple/20">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <HiOutlineMicrophone className="w-5 h-5 text-accent-purple" />
                Microphone Test
              </h3>
              <p className="text-text-muted text-sm mb-4">Make sure your microphone is working before starting</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleTestMic}
                  disabled={testingMic}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    micWorking
                      ? 'bg-accent-green/20 border border-accent-green/30 text-accent-green'
                      : 'bg-accent-purple/20 border border-accent-purple/30 text-accent-purple hover:bg-accent-purple/30'
                  }`}
                >
                  {testingMic ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : micWorking ? (
                    <HiOutlineCheck className="w-5 h-5" />
                  ) : (
                    <HiOutlineMicrophone className="w-5 h-5" />
                  )}
                  {micWorking ? 'Microphone Ready' : 'Test Microphone'}
                </button>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-accent-purple/5 to-accent-blue/5 border-accent-purple/20">
              <h3 className="text-lg font-semibold text-white mb-3">Quick Tips</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-accent-purple mt-0.5">&#8226;</span>
                  Speak clearly and at a moderate pace
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-purple mt-0.5">&#8226;</span>
                  Wait for the AI interviewer to finish before responding
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-purple mt-0.5">&#8226;</span>
                  Take a moment to think before answering - it&apos;s okay to pause
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-purple mt-0.5">&#8226;</span>
                  Treat this like a real interview for the best experience
                </li>
              </ul>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStart}
              className="w-full py-4 bg-gradient-to-r from-accent-purple to-accent-blue text-white text-lg font-bold rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-accent-purple/20 flex items-center justify-center gap-3"
            >
              <HiOutlinePlay className="w-6 h-6" />
              Start Interview
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          disabled={step === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-text-secondary hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <HiOutlineChevronLeft className="w-5 h-5" />
          Back
        </button>
        {step < STEPS.length - 1 && (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-3 bg-dark-secondary border border-dark-border rounded-xl text-white hover:border-accent-purple/50 transition-all"
          >
            Next
            <HiOutlineChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Save Template Modal */}
      <AnimatePresence>
        {showSaveTemplate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowSaveTemplate(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[20%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 rounded-2xl p-5 sm:p-6 border border-dark-border max-h-[80vh] overflow-y-auto"
              style={{ background: 'linear-gradient(135deg, rgba(19,19,43,0.95) 0%, rgba(17,17,24,0.98) 100%)', backdropFilter: 'blur(24px)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <HiOutlineBookmark className="w-5 h-5 text-accent-purple" />
                  Save Template
                </h2>
                <button onClick={() => setShowSaveTemplate(false)} className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-dark-tertiary transition-colors">
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Template name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  maxLength={100}
                  className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:border-accent-purple focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  maxLength={300}
                  className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:border-accent-purple focus:outline-none"
                />
                <div className="flex flex-wrap gap-1.5 text-[10px] text-text-muted">
                  <span className="px-2 py-1 rounded bg-dark-tertiary/50">{config.role || 'No role'}</span>
                  <span className="px-2 py-1 rounded bg-dark-tertiary/50">{config.type}</span>
                  <span className="px-2 py-1 rounded bg-dark-tertiary/50">{config.difficulty}</span>
                  <span className="px-2 py-1 rounded bg-dark-tertiary/50">{config.duration}m</span>
                  <span className="px-2 py-1 rounded bg-dark-tertiary/50">{config.interviewStyle}</span>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setShowSaveTemplate(false)}
                    className="px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-white rounded-xl hover:bg-dark-tertiary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={savingTemplate || !templateName.trim()}
                    className="px-5 py-2.5 text-sm font-medium text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}
                  >
                    {savingTemplate ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
