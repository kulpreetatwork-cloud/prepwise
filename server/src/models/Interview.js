import mongoose from 'mongoose';

const transcriptEntrySchema = new mongoose.Schema(
  {
    speaker: {
      type: String,
      enum: ['ai', 'user'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const interviewConfigSchema = new mongoose.Schema(
  {
    role: { type: String, required: true },
    type: {
      type: String,
      enum: ['technical', 'behavioral', 'hr', 'system-design', 'mixed'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'expert'],
      required: true,
    },
    experienceLevel: {
      type: String,
      enum: ['fresher', 'junior', 'mid', 'senior'],
      required: true,
    },
    duration: {
      type: Number,
      enum: [5, 10, 15, 20],
      required: true,
    },
    focusAreas: [{ type: String }],
    interviewStyle: {
      type: String,
      enum: ['friendly', 'neutral', 'challenging'],
      default: 'neutral',
    },
    companyStyle: {
      type: String,
      enum: ['faang', 'startup', 'corporate', 'general'],
      default: 'general',
    },
    mode: {
      type: String,
      enum: ['practice', 'assessment'],
      default: 'assessment',
    },
    resumeText: { type: String, default: '' },
    jobDescription: { type: String, default: '' },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'abandoned'],
      default: 'in-progress',
    },
    config: {
      type: interviewConfigSchema,
      required: true,
    },
    transcript: [transcriptEntrySchema],
    questionsAsked: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    actualDuration: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

interviewSchema.index({ userId: 1, createdAt: -1 });
interviewSchema.index({ status: 1 });

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
