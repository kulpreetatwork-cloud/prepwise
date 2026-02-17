import mongoose from 'mongoose';

const questionFeedbackSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    userAnswer: { type: String, default: '' },
    score: { type: Number, min: 0, max: 100, default: 0 },
    feedback: { type: String, default: '' },
    idealAnswer: { type: String, default: '' },
  },
  { _id: false }
);

const feedbackSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
      required: true,
    },
    categoryScores: {
      communication: { type: Number, min: 0, max: 100, default: 0 },
      technicalAccuracy: { type: Number, min: 0, max: 100, default: 0 },
      confidence: { type: Number, min: 0, max: 100, default: 0 },
      clarity: { type: Number, min: 0, max: 100, default: 0 },
      relevance: { type: Number, min: 0, max: 100, default: 0 },
    },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    questionFeedback: [questionFeedbackSchema],
    overallFeedback: {
      type: String,
      default: '',
    },
    fillerWordsCount: {
      type: Number,
      default: 0,
    },
    speakingPace: {
      type: String,
      enum: ['slow', 'moderate', 'fast', 'varied'],
      default: 'moderate',
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ userId: 1, createdAt: -1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

// Drop stale index from previous schema version (field was renamed to interviewId)
Feedback.collection.dropIndex('interview_1').catch(() => {});
// Clean up any orphaned documents from the stale index era
Feedback.deleteMany({ interviewId: null }).catch(() => {});

export default Feedback;
