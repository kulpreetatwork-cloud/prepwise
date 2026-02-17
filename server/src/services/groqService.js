import Groq from 'groq-sdk';

let groq = null;

function getGroq() {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

const TIME_CONFIG = {
  5: { targetQuestions: 4, wrapUpAt: 280, hardEndAt: 297 },
  10: { targetQuestions: 6, wrapUpAt: 570, hardEndAt: 597 },
  15: { targetQuestions: 8, wrapUpAt: 870, hardEndAt: 897 },
  20: { targetQuestions: 10, wrapUpAt: 1170, hardEndAt: 1197 },
};

function getTimePhase(config, elapsed) {
  const tc = TIME_CONFIG[config.duration] || TIME_CONFIG[10];
  const totalSec = config.duration * 60;
  if (elapsed >= tc.hardEndAt) return 'hard-end';
  if (elapsed >= tc.wrapUpAt) return 'wrap-up';
  if (elapsed >= totalSec * 0.5) return 'mid';
  return 'early';
}

function buildSystemPrompt(config, timeState) {
  const tc = TIME_CONFIG[config.duration] || TIME_CONFIG[10];
  const totalSec = config.duration * 60;
  const phase = getTimePhase(config, timeState.elapsed);
  const minutesLeft = Math.max(0, Math.round((totalSec - timeState.elapsed) / 60));
  const secondsLeft = Math.max(0, Math.round(totalSec - timeState.elapsed));

  let timeDirective = '';
  if (phase === 'hard-end') {
    timeDirective = `
⚠️ MANDATORY END — TIME IS UP:
You MUST end the interview NOW. Do NOT ask any more questions.
Say something warm and professional like:
"I think that's a great place to wrap up. Thank you so much for your time today — you've given some really thoughtful answers. We'll have your detailed feedback ready for you shortly. Best of luck!"
This MUST be your ENTIRE response. Do not add questions after this.`;
  } else if (phase === 'wrap-up') {
    timeDirective = `
⏰ WRAP-UP PHASE (${secondsLeft}s remaining):
- Ask your final question now. Do NOT skip the question — ask it.
- After the candidate responds to this question, you will wrap up in the NEXT turn.
- Do NOT say goodbye or conclude yet — just ask the question.`;
  } else if (phase === 'mid') {
    timeDirective = `
📍 MID-INTERVIEW (${minutesLeft} min remaining):
- Continue with role-specific technical/behavioral questions
- Increase difficulty gradually
- Ask follow-ups when answers are vague`;
  } else {
    timeDirective = `
🟢 EARLY PHASE (${minutesLeft} min remaining):
- Start with easier, warm-up style questions
- Build rapport with the candidate`;
  }

  const styleMap = {
    friendly: 'Warm, encouraging, and supportive. Use conversational language. Offer brief positive reinforcement between questions.',
    neutral: 'Professional, balanced, and fair. Polite but focused on assessment. No excessive praise or criticism.',
    challenging: 'Rigorous and direct. Probe for depth. Ask "why" and "how" follow-ups. Push the candidate to think harder.',
  };

  const companyMap = {
    faang: 'FAANG-style: structured, methodical questions focusing on fundamentals, system design, edge cases, and scalability.',
    startup: 'Startup-style: practical problem-solving, breadth of knowledge, adaptability. More casual but thorough.',
    corporate: 'Corporate-style: formal structure, process-oriented questions, teamwork, domain expertise.',
    general: 'Balanced interview covering both depth and breadth across relevant topics.',
  };

  return `You are an expert human interviewer conducting a live ${config.type} interview for the role of ${config.role}.

YOUR PERSONALITY:
${styleMap[config.interviewStyle] || styleMap.neutral}
Company approach: ${companyMap[config.companyStyle] || companyMap.general}

CANDIDATE PROFILE:
- Experience: ${config.experienceLevel}
- Difficulty level: ${config.difficulty}
- Focus areas: ${config.focusAreas?.length ? config.focusAreas.join(', ') : 'General'}
${config.resumeText ? `- Resume context: ${config.resumeText.substring(0, 600)}` : ''}
${config.jobDescription ? `- Target job: ${config.jobDescription.substring(0, 600)}` : ''}

MODE: ${config.mode === 'practice' ? 'PRACTICE — Be helpful. If the candidate struggles, give gentle hints. After each answer, offer a brief constructive tip before the next question.' : 'ASSESSMENT — Professional evaluation. No hints. Evaluate rigorously but fairly.'}

TIME & PACING:
- Total duration: ${config.duration} minutes
- Elapsed: ${Math.round(timeState.elapsed)}s (${Math.round(timeState.elapsed / 60)} min)
- Questions asked: ${timeState.questionsAsked} / target: ${tc.targetQuestions}
${timeDirective}

IMMUTABLE RULES:
1. Ask exactly ONE question per response. Never bundle multiple questions.
2. Keep responses concise — 2-3 sentences max for acknowledgment + question.
3. After the candidate answers, briefly acknowledge (1 sentence), then ask the next question.
4. For the FIRST message (empty transcript), greet the candidate warmly by name if available, introduce yourself, and ask a soft opening question like "Tell me about yourself" or "What interests you about this role?"
5. Progress from easier → harder questions naturally.
6. Ask follow-up questions when answers are vague or interesting.
7. Never repeat a question you already asked.
8. Stay in character as a human interviewer at all times. Never reveal you are an AI.
9. Speak naturally — no markdown, no bullet points, no code blocks, no asterisks.
10. When concluding, be warm and genuine. Mention that feedback will be provided.
11. Never say "As an AI" or "I'm an AI assistant" — you are the interviewer.`;
}

export async function generateInterviewResponse(config, transcript, timeState) {
  const systemPrompt = buildSystemPrompt(config, timeState);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...transcript.map((entry) => ({
      role: entry.speaker === 'ai' ? 'assistant' : 'user',
      content: entry.text,
    })),
  ];

  if (transcript.length === 0) {
    messages.push({
      role: 'user',
      content: '[The interview is starting now. Greet the candidate and begin with your first question.]',
    });
  }

  const completion = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.7,
    max_tokens: 250,
    top_p: 0.9,
  });

  return completion.choices[0]?.message?.content || '';
}

export async function generateFeedback(config, transcript) {
  const transcriptText = transcript
    .map((entry) => `${entry.speaker === 'ai' ? 'Interviewer' : 'Candidate'}: ${entry.text}`)
    .join('\n');

  const prompt = `You are an expert interview evaluator. Analyze the following ${config.type} interview transcript for a ${config.role} position (${config.difficulty} difficulty, ${config.experienceLevel} level).

TRANSCRIPT:
${transcriptText}

Provide a detailed, honest evaluation. Be specific with examples from the transcript. Reference actual things the candidate said.

You MUST respond with ONLY valid JSON (no markdown, no code fences, no extra text) in exactly this format:
{
  "overallScore": <number 0-100>,
  "grade": "<one of: A+, A, B+, B, C+, C, D, F>",
  "categoryScores": {
    "communication": <number 0-100>,
    "technicalAccuracy": <number 0-100>,
    "confidence": <number 0-100>,
    "clarity": <number 0-100>,
    "relevance": <number 0-100>
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "questionFeedback": [
    {
      "question": "<the question asked>",
      "userAnswer": "<summary of user's answer>",
      "score": <number 0-100>,
      "feedback": "<specific feedback for this answer>",
      "idealAnswer": "<what an ideal answer would include>"
    }
  ],
  "overallFeedback": "<2-3 paragraph detailed summary with specific examples from the transcript>"
}

SCORING GUIDE:
- A+ (95-100): Exceptional across all areas
- A (85-94): Excellent with minor gaps
- B+ (75-84): Good with room for improvement
- B (65-74): Satisfactory but notable weaknesses
- C+ (55-64): Below average, significant improvements needed
- C (45-54): Poor performance in multiple areas
- D (30-44): Very weak
- F (0-29): Failed to demonstrate competency`;

  const completion = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  });

  const responseText = completion.choices[0]?.message?.content || '{}';

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    console.error('Failed to parse feedback JSON:', responseText);
    return {
      overallScore: 50,
      grade: 'C',
      categoryScores: { communication: 50, technicalAccuracy: 50, confidence: 50, clarity: 50, relevance: 50 },
      strengths: ['Completed the interview'],
      improvements: ['Could not generate detailed feedback'],
      questionFeedback: [],
      overallFeedback: 'The feedback could not be fully generated. Please try again.',
    };
  }

  const validGrades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];
  if (!validGrades.includes(parsed.grade)) {
    parsed.grade = 'C';
  }

  parsed.overallScore = Math.min(100, Math.max(0, Number(parsed.overallScore) || 50));

  const cs = parsed.categoryScores || {};
  parsed.categoryScores = {
    communication: Math.min(100, Math.max(0, Number(cs.communication) || 50)),
    technicalAccuracy: Math.min(100, Math.max(0, Number(cs.technicalAccuracy) || 50)),
    confidence: Math.min(100, Math.max(0, Number(cs.confidence) || 50)),
    clarity: Math.min(100, Math.max(0, Number(cs.clarity) || 50)),
    relevance: Math.min(100, Math.max(0, Number(cs.relevance) || 50)),
  };

  if (Array.isArray(parsed.questionFeedback)) {
    parsed.questionFeedback = parsed.questionFeedback
      .filter((qf) => qf && typeof qf === 'object')
      .map((qf) => ({
        question: qf.question || 'Question not recorded',
        userAnswer: qf.userAnswer || '',
        score: Math.min(100, Math.max(0, Number(qf.score) || 0)),
        feedback: qf.feedback || '',
        idealAnswer: qf.idealAnswer || '',
      }));
  } else {
    parsed.questionFeedback = [];
  }

  parsed.strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
  parsed.improvements = Array.isArray(parsed.improvements) ? parsed.improvements : [];
  parsed.overallFeedback = parsed.overallFeedback || '';

  return parsed;
}

export function getTimePhaseForSession(config, elapsed) {
  return getTimePhase(config, elapsed);
}

export function shouldWrapUp(config, timeState) {
  const phase = getTimePhase(config, timeState.elapsed);
  return phase === 'hard-end' || phase === 'wrap-up';
}

export function isHardEnd(config, elapsed) {
  return getTimePhase(config, elapsed) === 'hard-end';
}
