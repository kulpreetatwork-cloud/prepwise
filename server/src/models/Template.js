import mongoose from 'mongoose';

const templateConfigSchema = new mongoose.Schema(
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
  },
  { _id: false }
);

const templateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 300,
      default: '',
    },
    config: {
      type: templateConfigSchema,
      required: true,
    },
    color: {
      type: String,
      default: '#8B5CF6',
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

templateSchema.index({ userId: 1, createdAt: -1 });
templateSchema.index({ isDefault: 1 });

const Template = mongoose.model('Template', templateSchema);
export default Template;
