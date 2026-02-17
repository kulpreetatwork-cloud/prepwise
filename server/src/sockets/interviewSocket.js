import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Interview from '../models/Interview.js';
import Feedback from '../models/Feedback.js';
import Achievement, { ACHIEVEMENT_TYPES } from '../models/Achievement.js';
import { generateInterviewResponse, generateFeedback, isHardEnd } from '../services/groqService.js';

const activeSessions = new Map();

async function authenticateSocket(socket) {
  const token = socket.handshake.auth?.token;
  if (!token) throw new Error('No token provided');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) throw new Error('User not found');
  return user;
}

export function setupInterviewSocket(io) {
  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);
      socket.user = user;
      socket.userId = user._id.toString();
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[Socket] User connected: ${user.name} (${socket.id})`);

    socket.on('start-interview', async (config) => {
      try {
        const interview = await Interview.create({
          userId: user._id,
          config,
          status: 'in-progress',
          startedAt: new Date(),
        });

        await User.findByIdAndUpdate(user._id, { lastInterviewConfig: config });

        const session = {
          interviewId: interview._id.toString(),
          config,
          transcript: [],
          questionsAsked: 0,
          startTime: Date.now(),
          paused: false,
          pausedTime: 0,
          pauseStart: null,
          pendingTranscript: '',
          isAISpeaking: false,
          isProcessing: false,
          isEnding: false,
          timer: null,
        };

        activeSessions.set(socket.id, session);

        session.timer = setInterval(() => {
          if (session.paused || session.isEnding) return;

          const elapsed = getElapsedSeconds(session);
          const total = config.duration * 60;
          const remaining = Math.max(0, total - elapsed);

          socket.emit('time-update', { elapsed, total, remaining });

          if (isHardEnd(config, elapsed) && !session.isAISpeaking && !session.isProcessing && !session.isEnding) {
            session.isEnding = true;
            forceEndInterview(socket, session);
          }
        }, 1000);

        socket.emit('interview-started', { interviewId: interview._id });

        await processAITurn(socket, session);
      } catch (error) {
        console.error('[Interview] Start error:', error);
        socket.emit('interview-error', { message: 'Failed to start interview' });
      }
    });

    socket.on('stop-speaking', async ({ transcript: clientTranscript }) => {
      const session = activeSessions.get(socket.id);
      if (!session) return;
      if (session.isProcessing) return;

      const finalText = (clientTranscript || '').trim();

      console.log('[Socket] User stopped speaking, transcript:', finalText ? finalText.substring(0, 80) + '...' : '(empty)');

      if (finalText) {
        session.pendingTranscript = finalText;
        await finishUserSpeaking(socket, session);
      } else {
        console.log('[Socket] No speech detected, returning turn to user');
        socket.emit('your-turn');
      }
    });

    socket.on('pause-interview', () => {
      const session = activeSessions.get(socket.id);
      if (!session || session.paused) return;
      session.paused = true;
      session.pauseStart = Date.now();
      socket.emit('interview-paused');
    });

    socket.on('resume-interview', () => {
      const session = activeSessions.get(socket.id);
      if (!session || !session.paused) return;
      session.pausedTime += Date.now() - session.pauseStart;
      session.pauseStart = null;
      session.paused = false;
      socket.emit('interview-resumed');
    });

    socket.on('end-interview', async () => {
      const session = activeSessions.get(socket.id);
      if (!session || session.isEnding) return;
      session.isEnding = true;
      await endInterview(socket, session, 'completed');
    });

    socket.on('disconnect', async () => {
      const session = activeSessions.get(socket.id);
      if (session) {
        cleanupSession(session);
        try {
          await Interview.findByIdAndUpdate(session.interviewId, {
            status: 'abandoned',
            endedAt: new Date(),
            actualDuration: getElapsedSeconds(session),
            transcript: session.transcript,
          });
        } catch (err) {
          console.error('[Socket] Failed to save abandoned interview:', err);
        }
        activeSessions.delete(socket.id);
      }
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });
}

function getElapsedSeconds(session) {
  const now = Date.now();
  let totalPaused = session.pausedTime;
  if (session.paused && session.pauseStart) {
    totalPaused += now - session.pauseStart;
  }
  return (now - session.startTime - totalPaused) / 1000;
}

function cleanupSession(session) {
  if (session.timer) clearInterval(session.timer);
}

async function finishUserSpeaking(socket, session) {
  if (session.isProcessing) return;
  session.isProcessing = true;

  const userText = session.pendingTranscript?.trim();
  if (!userText) {
    session.isProcessing = false;
    socket.emit('your-turn');
    return;
  }

  session.transcript.push({
    speaker: 'user',
    text: userText,
    timestamp: getElapsedSeconds(session),
  });

  session.pendingTranscript = '';
  socket.emit('user-transcript-final', { text: userText });

  await processAITurn(socket, session);
  session.isProcessing = false;
}

async function processAITurn(socket, session) {
  try {
    session.isAISpeaking = true;
    socket.emit('ai-thinking');

    const elapsed = getElapsedSeconds(session);
    const timeState = { elapsed, questionsAsked: session.questionsAsked };

    const aiResponse = await generateInterviewResponse(
      session.config,
      session.transcript,
      timeState
    );

    if (!aiResponse) {
      session.isAISpeaking = false;
      socket.emit('your-turn');
      return;
    }

    session.transcript.push({
      speaker: 'ai',
      text: aiResponse,
      timestamp: getElapsedSeconds(session),
    });

    if (aiResponse.includes('?')) {
      session.questionsAsked += 1;
    }

    socket.emit('ai-response-text', { text: aiResponse });

    const isClosingStatement = detectClosingStatement(aiResponse, session);
    const isEnding = isClosingStatement || session.isEnding;

    socket.emit('ai-speaking', { text: aiResponse, noSpeak: isEnding });

    session.isAISpeaking = false;

    if (isEnding) {
      socket.emit('interview-ending');
      await endInterview(socket, session, 'completed');
    } else {
      socket.emit('your-turn');
    }
  } catch (error) {
    console.error('[AI Turn] Error:', error);
    session.isAISpeaking = false;
    socket.emit('interview-error', { message: 'AI processing error. Please try again.' });
    socket.emit('your-turn');
  }
}

async function forceEndInterview(socket, session) {
  try {
    session.isAISpeaking = true;
    socket.emit('ai-thinking');

    const elapsed = getElapsedSeconds(session);
    const aiResponse = await generateInterviewResponse(
      session.config,
      session.transcript,
      { elapsed, questionsAsked: session.questionsAsked }
    );

    if (aiResponse) {
      session.transcript.push({
        speaker: 'ai',
        text: aiResponse,
        timestamp: getElapsedSeconds(session),
      });

      socket.emit('ai-response-text', { text: aiResponse });
      socket.emit('ai-speaking', { text: aiResponse, noSpeak: true });
    }

    session.isAISpeaking = false;
    socket.emit('interview-ending');
    await endInterview(socket, session, 'completed');
  } catch (error) {
    console.error('[Force End] Error:', error);
    await endInterview(socket, session, 'completed');
  }
}

function detectClosingStatement(text, session) {
  if (!session.isEnding) return false;

  const lower = text.toLowerCase();
  const closingPhrases = [
    'concludes our interview',
    'that wraps up',
    'end of our interview',
    'great place to wrap up',
    'that brings us to the end',
    'feedback ready',
    'feedback will be',
    'pleasure interviewing you',
    'wrap things up',
  ];
  return closingPhrases.some((phrase) => lower.includes(phrase));
}

async function endInterview(socket, session, status) {
  try {
    cleanupSession(session);

    const actualDuration = getElapsedSeconds(session);

    await Interview.findByIdAndUpdate(session.interviewId, {
      status,
      endedAt: new Date(),
      actualDuration,
      transcript: session.transcript,
      questionsAsked: session.questionsAsked,
    });

    socket.emit('generating-feedback');

    if (status === 'completed' && session.transcript.length > 1) {
      let feedbackData;
      try {
        feedbackData = await generateFeedback(session.config, session.transcript);
      } catch (groqErr) {
        console.error('[End Interview] Groq feedback error:', groqErr);
        socket.emit('interview-complete', {
          interviewId: session.interviewId,
          feedbackId: null,
          feedback: null,
        });
        activeSessions.delete(socket.id);
        return;
      }

      let feedback;
      try {
        feedback = await Feedback.create({
          interviewId: session.interviewId,
          userId: socket.userId,
          ...feedbackData,
        });
      } catch (dbErr) {
        console.error('[End Interview] Feedback DB error:', dbErr.message);
        socket.emit('interview-complete', {
          interviewId: session.interviewId,
          feedbackId: null,
          feedback: null,
        });
        activeSessions.delete(socket.id);
        return;
      }

      await updateStreak(socket.userId);
      const newAchievements = await checkAndGrantAchievements(socket.userId);

      socket.emit('interview-complete', {
        interviewId: session.interviewId,
        feedbackId: feedback._id,
        feedback: feedbackData,
        newAchievements,
      });
    } else {
      socket.emit('interview-complete', {
        interviewId: session.interviewId,
        feedbackId: null,
        feedback: null,
      });
    }

    activeSessions.delete(socket.id);
  } catch (error) {
    console.error('[End Interview] Error:', error);
    socket.emit('interview-complete', {
      interviewId: session.interviewId,
      feedbackId: null,
      feedback: null,
    });
    activeSessions.delete(socket.id);
  }
}

async function checkAndGrantAchievements(userId) {
  const completedCount = await Interview.countDocuments({ userId, status: 'completed' });
  const feedbacks = await Feedback.find({ userId });
  const user = await User.findById(userId);
  const newAchievements = [];

  const checks = [
    { condition: completedCount >= 1, type: ACHIEVEMENT_TYPES.FIRST_INTERVIEW },
    { condition: completedCount >= 5, type: ACHIEVEMENT_TYPES.FIVE_INTERVIEWS },
    { condition: completedCount >= 10, type: ACHIEVEMENT_TYPES.TEN_INTERVIEWS },
    { condition: feedbacks.some((f) => f.overallScore >= 70), type: ACHIEVEMENT_TYPES.SCORE_70 },
    { condition: feedbacks.some((f) => f.overallScore >= 85), type: ACHIEVEMENT_TYPES.SCORE_85 },
    { condition: feedbacks.some((f) => f.overallScore >= 95), type: ACHIEVEMENT_TYPES.SCORE_95 },
    { condition: user.streak?.current >= 3, type: ACHIEVEMENT_TYPES.STREAK_3 },
    { condition: user.streak?.current >= 7, type: ACHIEVEMENT_TYPES.STREAK_7 },
    { condition: user.streak?.current >= 30, type: ACHIEVEMENT_TYPES.STREAK_30 },
  ];

  for (const check of checks) {
    if (check.condition) {
      try {
        const created = await Achievement.findOneAndUpdate(
          { userId, achievementType: check.type.id },
          { $setOnInsert: { userId, achievementType: check.type.id } },
          { upsert: true, new: true, rawResult: true }
        );
        if (created.lastErrorObject?.upserted) {
          newAchievements.push(check.type);
        }
      } catch {
        // duplicate
      }
    }
  }
  return newAchievements;
}

async function updateStreak(userId) {
  const user = await User.findById(userId);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (user.streak?.lastInterviewDate) {
    const lastDate = new Date(user.streak.lastInterviewDate);
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const diffDays = Math.floor((today - lastDay) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return;
    else if (diffDays === 1) user.streak.current += 1;
    else user.streak.current = 1;
  } else {
    user.streak.current = 1;
  }

  user.streak.longest = Math.max(user.streak.longest, user.streak.current);
  user.streak.lastInterviewDate = now;
  await user.save();
}
