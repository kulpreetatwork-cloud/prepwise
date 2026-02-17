import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useInterviewStore } from '../store/interviewStore';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import AIOrb from '../components/AIOrb';
import toast from 'react-hot-toast';
import {
  HiOutlineMicrophone, HiOutlineStop,
  HiOutlinePause, HiOutlinePlay,
  HiOutlineClock, HiOutlineChat,
} from 'react-icons/hi';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

function speakBrowser(text) {
  return new Promise((resolve) => {
    if (!text || !window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.92;
    utt.pitch = 1.0;

    let resolved = false;
    const done = () => { if (resolved) return; resolved = true; clearInterval(keepAlive); resolve(); };

    // Chrome TTS keepalive — prevents Chrome from silently killing long utterances
    const keepAlive = setInterval(() => {
      if (!window.speechSynthesis.speaking) { done(); return; }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 5000);

    utt.onend = done;
    utt.onerror = done;
    window.speechSynthesis.speak(utt);

    // Safety timeout — max 30s per utterance to prevent infinite hangs
    setTimeout(done, 30000);
  });
}

export default function InterviewRoom() {
  const navigate = useNavigate();
  const { isListening, audioLevel, isSupported, startListening, stopListening, abort: abortListening } = useSpeechRecognition();
  const {
    config, setStatus, setInterviewId, addTranscript,
    transcript, setCurrentTurn, currentTurn, setTimeUpdate,
    timeElapsed, timeTotal, setIsPaused, isPaused, setIsAIThinking,
    isAIThinking, setAIText, aiText, setUserTranscript, userTranscript,
    setFeedbackId,
  } = useInterviewStore();

  const [showTranscript, setShowTranscript] = useState(true);
  const [orbState, setOrbState] = useState('idle');
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState('countdown');
  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [interviewEnding, setInterviewEnding] = useState(false);

  const socketRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const aiSpeakingRef = useRef(false);
  const abortListeningRef = useRef(abortListening);
  abortListeningRef.current = abortListening;
  useEffect(() => {
    if (!config.role) {
      navigate('/interview/setup');
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [config.role, navigate]);

  useEffect(() => {
    if (countdown === 0 && phase === 'countdown') setPhase('connecting');
  }, [countdown, phase]);

  useEffect(() => {
    if (phase !== 'connecting') return;

    const token = localStorage.getItem('prepwise_token');
    if (!token) { toast.error('Not authenticated'); navigate('/login'); return; }

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    let stale = false;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (stale) { socket.removeAllListeners(); socket.disconnect(); return; }
      socket.emit('start-interview', {
        role: config.role,
        type: config.type,
        difficulty: config.difficulty,
        experienceLevel: config.experienceLevel,
        duration: config.duration,
        focusAreas: config.focusAreas,
        interviewStyle: config.interviewStyle,
        companyStyle: config.companyStyle,
        mode: config.mode,
        resumeText: config.resumeText,
        jobDescription: config.jobDescription,
      });
    });

    socket.on('connect_error', (err) => {
      if (stale) return;
      if (err.message === 'Authentication failed') {
        toast.error('Authentication failed');
        navigate('/login');
      } else {
        toast.error('Failed to connect to server');
      }
    });

    socket.on('interview-started', ({ interviewId }) => {
      setInterviewId(interviewId);
      setStatus('active');
      setPhase('active');
    });

    socket.on('ai-thinking', () => {
      abortListeningRef.current();
      setIsAIThinking(true);
      setOrbState('thinking');
      setCurrentTurn('ai');
      setStatusText('AI is thinking...');
    });

    socket.on('ai-response-text', ({ text }) => {
      setAIText(text);
    });

    socket.on('ai-speaking', async ({ text, noSpeak }) => {
      aiSpeakingRef.current = true;
      setIsAIThinking(false);
      setOrbState('speaking');
      setStatusText('AI is speaking...');
      addTranscript({ speaker: 'ai', text, timestamp: Date.now() });

      if (text && !noSpeak) {
        await speakBrowser(text);
      }

      aiSpeakingRef.current = false;
      setOrbState('listening');
      setCurrentTurn('user');
      setUserTranscript('');
      setAIText('');
      setStatusText('Your turn — click the mic to speak');
    });

    socket.on('your-turn', () => {
      if (!aiSpeakingRef.current) {
        setCurrentTurn('user');
        setOrbState('listening');
        setStatusText('Your turn — click the mic to speak');
      }
    });

    socket.on('user-transcript-final', ({ text }) => {
      addTranscript({ speaker: 'user', text, timestamp: Date.now() });
      setUserTranscript('');
    });

    socket.on('time-update', ({ elapsed, total }) => {
      setTimeUpdate(elapsed, total);
    });

    socket.on('interview-paused', () => { setIsPaused(true); setStatusText('Interview paused'); });
    socket.on('interview-resumed', () => { setIsPaused(false); setStatusText('Interview resumed'); });

    socket.on('interview-ending', () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setInterviewEnding(true);
      setStatusText('Interview is wrapping up...');
    });

    socket.on('generating-feedback', () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setGeneratingFeedback(true);
      setStatusText('Generating your feedback...');
    });

    socket.on('interview-complete', ({ interviewId, feedbackId, newAchievements }) => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setStatus('completed');
      setFeedbackId(feedbackId);
      if (newAchievements?.length > 0) {
        newAchievements.forEach((a) => {
          toast.success(`Achievement unlocked: ${a.title}!`, { duration: 5000 });
        });
      }
      abortListeningRef.current();

      if (!feedbackId) {
        toast('Interview completed. Feedback was not generated for this session.', { icon: 'ℹ️', duration: 4000 });
        navigate('/dashboard');
        return;
      }

      navigate(`/interview/feedback/${interviewId}`);
    });

    socket.on('interview-error', ({ message }) => {
      toast.error(message);
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect' || reason === 'transport close') {
        toast.error('Connection lost');
      }
    });

    return () => { stale = true; };
  }, [phase]);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      abortListeningRef.current();
      if (socketRef.current) {
        socketRef.current.emit('end-interview');
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, userTranscript]);

  const handleMicToggle = useCallback(async () => {
    if (currentTurn !== 'user' || isPaused) return;
    const socket = socketRef.current;
    if (!socket?.connected) return;

    if (isListening) {
      setStatusText('Processing your response...');
      setOrbState('thinking');
      const finalText = await stopListening();
      socket.emit('stop-speaking', { transcript: finalText || '' });
    } else {
      if (!isSupported) {
        toast.error('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
        return;
      }
      try {
        await startListening(
          (interimText) => {
            setUserTranscript(interimText);
          },
          (errMsg) => {
            toast.error(errMsg);
            setOrbState('listening');
            setStatusText('Your turn — click the mic to speak');
          }
        );
        setOrbState('listening');
        setStatusText('Speaking... Click mic when done');
        setUserTranscript('');
      } catch {
        toast.error('Failed to access microphone. Please check permissions.');
      }
    }
  }, [currentTurn, isPaused, isListening, startListening, stopListening, isSupported, setUserTranscript]);

  const handlePause = () => {
    const socket = socketRef.current;
    if (!socket) return;
    if (isPaused) {
      socket.emit('resume-interview');
    } else {
      abortListeningRef.current();
      socket.emit('pause-interview');
    }
  };

  const handleEnd = () => {
    if (!confirm('Are you sure you want to end the interview?')) return;
    abortListeningRef.current();
    socketRef.current?.emit('end-interview');
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = timeTotal > 0 ? (timeElapsed / timeTotal) * 100 : 0;
  const isUrgent = progress > 85;
  const remaining = Math.max(0, timeTotal - timeElapsed);

  /* ---------- COUNTDOWN SCREEN ---------- */
  if (phase === 'countdown') {
    return (
      <div className="fixed inset-0 bg-dark-primary flex items-center justify-center z-50">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(139,92,246,0.08) 0%, transparent 60%)' }} />
        <AnimatePresence mode="wait">
          <motion.div
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center relative z-10"
          >
            <div className="text-9xl font-black gradient-text mb-6">{countdown || 'Go!'}</div>
            <p className="text-text-secondary text-lg font-medium">Get ready for your interview...</p>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  /* ---------- CONNECTING SCREEN ---------- */
  if (phase === 'connecting') {
    return (
      <div className="fixed inset-0 bg-dark-primary flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-[3px] border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-8" />
          <h2 className="text-2xl font-bold text-white mb-2">Connecting</h2>
          <p className="text-text-secondary">Setting up your interview session...</p>
        </div>
      </div>
    );
  }

  /* ---------- INTERVIEW ENDING (smooth overlay) ---------- */
  if (interviewEnding && !generatingFeedback) {
    return (
      <div className="fixed inset-0 bg-dark-primary flex items-center justify-center z-50">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(139,92,246,0.06) 0%, transparent 60%)' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center relative z-10">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
               style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.15))', border: '2px solid rgba(139,92,246,0.2)' }}>
            <HiOutlineChat className="w-9 h-9 text-purple-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Interview Complete</h2>
          <p className="text-text-secondary text-lg">Great job! Preparing your results...</p>
        </motion.div>
      </div>
    );
  }

  /* ---------- GENERATING FEEDBACK SCREEN ---------- */
  if (generatingFeedback) {
    return (
      <div className="fixed inset-0 bg-dark-primary flex items-center justify-center z-50">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(139,92,246,0.06) 0%, transparent 60%)' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center relative z-10">
          <div className="w-20 h-20 border-[3px] border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-8" />
          <h2 className="text-3xl font-bold text-white mb-3">Analyzing Performance</h2>
          <p className="text-text-secondary text-lg">Generating your detailed feedback report...</p>
        </motion.div>
      </div>
    );
  }

  /* ---------- ACTIVE INTERVIEW ---------- */
  return (
    <div className="fixed inset-0 bg-dark-primary flex flex-col z-50">
      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-5 py-3 border-b border-white/[0.06] shrink-0"
              style={{ background: 'linear-gradient(180deg, rgba(15,15,25,0.95) 0%, rgba(10,10,20,0.9) 100%)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
               style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
            P
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-tight truncate">{config.role}</p>
            <p className="text-[11px] text-text-muted capitalize">{config.type} &middot; {config.difficulty}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <HiOutlineClock className={`w-4 h-4 ${isUrgent ? 'text-red-400' : 'text-text-muted'}`} />
            <span className={`font-mono text-sm font-semibold tracking-tight ${isUrgent ? 'text-red-400' : 'text-white'}`}>
              {formatTime(timeElapsed)}
            </span>
            <span className="text-text-muted text-xs">/</span>
            <span className="font-mono text-sm text-text-muted">{formatTime(timeTotal)}</span>
          </div>

          <div className="hidden sm:block w-28 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: isUrgent ? '#EF4444' : 'linear-gradient(90deg, #8B5CF6, #6366F1)', width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {isUrgent && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="hidden sm:inline text-[10px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded"
            >
              {formatTime(remaining)} left
            </motion.span>
          )}
        </div>

        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className={`p-2 rounded-lg transition-all shrink-0 ${showTranscript ? 'text-purple-400 bg-purple-500/10' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
          title="Toggle transcript"
        >
          <HiOutlineChat className="w-5 h-5" />
        </button>
      </header>

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Center: Orb + status */}
        <div className="flex-1 flex flex-col items-center justify-center relative px-4 overflow-hidden min-h-0">
          {isPaused && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40"
            >
              <div className="text-center">
                <p className="text-3xl font-bold text-white mb-6">Interview Paused</p>
                <button onClick={handlePause}
                  className="px-8 py-3 text-white rounded-xl font-semibold transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
                  Resume
                </button>
              </div>
            </motion.div>
          )}

          <AIOrb state={orbState} audioLevel={audioLevel} />

          {/* Single-line status under orb */}
          <div className="mt-3 text-center px-4">
            <p className="text-xs text-text-muted truncate max-w-xs">
              {orbState === 'speaking' ? 'Interviewer is speaking...' :
               orbState === 'thinking' ? 'Preparing response...' :
               isListening ? 'Listening to you...' :
               currentTurn === 'user' ? 'Your turn to speak' : ''}
            </p>
          </div>
        </div>

        {/* Right/Bottom: Transcript panel */}
        {showTranscript && (
          <div
            className="lg:w-[360px] w-full h-56 lg:h-auto border-t lg:border-t-0 lg:border-l border-white/[0.06] flex flex-col shrink-0"
            style={{ background: 'rgba(10,10,20,0.6)' }}
          >
            <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <h3 className="text-sm font-semibold text-white">Live Transcript</h3>
              <span className="text-[10px] text-text-muted bg-white/5 px-2 py-0.5 rounded">
                {transcript.length} messages
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
              {transcript.length === 0 && !userTranscript && (
                <p className="text-text-muted text-xs text-center mt-4">Transcript will appear here as the interview progresses...</p>
              )}
              {transcript.map((entry, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${entry.speaker === 'ai' ? 'bg-purple-400' : 'bg-emerald-400'}`} />
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${entry.speaker === 'ai' ? 'text-purple-400/70' : 'text-emerald-400/70'}`}>
                      {entry.speaker === 'ai' ? 'Interviewer' : 'You'}
                    </span>
                  </div>
                  <p className="text-text-primary text-xs leading-relaxed pl-3.5">{entry.text}</p>
                </div>
              ))}
              {userTranscript && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">You (live)</span>
                  </div>
                  <p className="text-emerald-300/60 text-xs leading-relaxed pl-3.5 italic">{userTranscript}</p>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <footer className="border-t border-white/[0.06] px-6 py-4 shrink-0"
              style={{ background: 'linear-gradient(180deg, rgba(10,10,20,0.9) 0%, rgba(15,15,25,0.95) 100%)' }}>
        <div className="flex items-center justify-center gap-3 sm:gap-5">
          {/* Pause */}
          <button
            onClick={handlePause}
            className="p-3 rounded-xl border transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <HiOutlinePlay className="w-5 h-5 text-white" /> : <HiOutlinePause className="w-5 h-5 text-text-muted" />}
          </button>

          {/* Mic button */}
          {currentTurn === 'user' ? (
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleMicToggle}
              className="relative p-4 sm:p-5 rounded-2xl transition-all"
              style={isListening
                ? { background: 'linear-gradient(135deg, #EF4444, #DC2626)', boxShadow: '0 0 30px rgba(239,68,68,0.35), 0 0 60px rgba(239,68,68,0.15)' }
                : { background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', boxShadow: '0 0 30px rgba(139,92,246,0.3), 0 0 60px rgba(139,92,246,0.1)' }
              }
            >
              {isListening && (
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ border: '2px solid rgba(239,68,68,0.3)' }}
                />
              )}
              <HiOutlineMicrophone className="w-7 h-7 text-white relative z-10" />
            </motion.button>
          ) : (
            <div className="p-4 sm:p-5 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <HiOutlineMicrophone className="w-7 h-7 text-text-muted/40" />
            </div>
          )}

          {/* End */}
          <button
            onClick={handleEnd}
            className="p-3 rounded-xl border transition-all hover:scale-105 group"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(239,68,68,0.15)' }}
            title="End Interview"
          >
            <HiOutlineStop className="w-5 h-5 text-red-400/70 group-hover:text-red-400" />
          </button>
        </div>

        {/* Status text */}
        <motion.p
          key={statusText}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs mt-3 h-4"
          style={{ color: isListening ? '#34D399' : currentTurn === 'ai' ? '#A78BFA' : '#9CA3AF' }}
        >
          {statusText || (currentTurn === 'user' && !isListening ? 'Your turn — click the mic to speak' :
            currentTurn === 'user' && isListening ? 'Speaking... Click mic when done' :
            currentTurn === 'ai' && isAIThinking ? 'AI is preparing a response...' :
            orbState === 'speaking' ? 'AI is speaking...' : '')}
        </motion.p>
      </footer>
    </div>
  );
}
