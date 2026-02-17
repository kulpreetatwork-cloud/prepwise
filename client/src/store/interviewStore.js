import { create } from 'zustand';

const defaultConfig = {
  role: '',
  type: 'technical',
  difficulty: 'medium',
  experienceLevel: 'fresher',
  duration: 10,
  focusAreas: [],
  interviewStyle: 'neutral',
  companyStyle: 'general',
  mode: 'assessment',
  resumeText: '',
  jobDescription: '',
};

export const useInterviewStore = create((set, get) => ({
  config: { ...defaultConfig },
  status: 'idle',
  interviewId: null,
  transcript: [],
  currentTurn: 'ai',
  timeElapsed: 0,
  timeTotal: 0,
  questionsAsked: 0,
  isPaused: false,
  isAIThinking: false,
  aiText: '',
  userTranscript: '',
  feedbackId: null,

  setConfig: (updates) => set((state) => ({
    config: { ...state.config, ...updates },
  })),

  resetConfig: () => set({ config: { ...defaultConfig } }),

  setStatus: (status) => set({ status }),
  setInterviewId: (interviewId) => set({ interviewId }),

  addTranscript: (entry) => set((state) => ({
    transcript: [...state.transcript, entry],
  })),

  setCurrentTurn: (turn) => set({ currentTurn: turn }),

  setTimeUpdate: (elapsed, total) => set({
    timeElapsed: elapsed,
    timeTotal: total,
  }),

  setIsPaused: (isPaused) => set({ isPaused }),
  setIsAIThinking: (isAIThinking) => set({ isAIThinking }),
  setAIText: (aiText) => set({ aiText }),
  setUserTranscript: (userTranscript) => set({ userTranscript }),
  setFeedbackId: (feedbackId) => set({ feedbackId }),

  resetInterview: () => set({
    status: 'idle',
    interviewId: null,
    transcript: [],
    currentTurn: 'ai',
    timeElapsed: 0,
    timeTotal: 0,
    questionsAsked: 0,
    isPaused: false,
    isAIThinking: false,
    aiText: '',
    userTranscript: '',
    feedbackId: null,
  }),
}));
