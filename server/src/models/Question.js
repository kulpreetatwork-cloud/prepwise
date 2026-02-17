import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'expert'],
      required: true,
    },
    type: {
      type: String,
      enum: ['technical', 'behavioral', 'hr', 'system-design'],
      required: true,
    },
    idealAnswer: {
      type: String,
      default: '',
    },
    tips: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ role: 1, type: 1, difficulty: 1 });

const Question = mongoose.model('Question', questionSchema);
export default Question;
