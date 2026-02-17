import mongoose from 'mongoose';

export const ACHIEVEMENT_TYPES = {
  FIRST_INTERVIEW: {
    id: 'first_interview',
    title: 'First Steps',
    description: 'Completed your first mock interview',
    icon: 'trophy',
  },
  FIVE_INTERVIEWS: {
    id: 'five_interviews',
    title: 'Getting Serious',
    description: 'Completed 5 mock interviews',
    icon: 'fire',
  },
  TEN_INTERVIEWS: {
    id: 'ten_interviews',
    title: 'Interview Pro',
    description: 'Completed 10 mock interviews',
    icon: 'star',
  },
  SCORE_70: {
    id: 'score_70',
    title: 'Good Performance',
    description: 'Scored 70+ in an interview',
    icon: 'medal',
  },
  SCORE_85: {
    id: 'score_85',
    title: 'Excellent',
    description: 'Scored 85+ in an interview',
    icon: 'gem',
  },
  SCORE_95: {
    id: 'score_95',
    title: 'Near Perfect',
    description: 'Scored 95+ in an interview',
    icon: 'crown',
  },
  STREAK_3: {
    id: 'streak_3',
    title: 'Consistent',
    description: 'Practiced 3 days in a row',
    icon: 'flame',
  },
  STREAK_7: {
    id: 'streak_7',
    title: 'Dedicated',
    description: 'Practiced 7 days in a row',
    icon: 'rocket',
  },
  STREAK_30: {
    id: 'streak_30',
    title: 'Unstoppable',
    description: 'Practiced 30 days in a row',
    icon: 'lightning',
  },
};

const achievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    achievementType: {
      type: String,
      required: true,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

achievementSchema.index({ userId: 1, achievementType: 1 }, { unique: true });

const Achievement = mongoose.model('Achievement', achievementSchema);
export default Achievement;
